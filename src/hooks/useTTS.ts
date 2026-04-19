/**
 * Unified TTS hook — three-tier voice system with latency fixes.
 * Fix 1: WebGPU device selection (handled in worker)
 * Fix 2: ONNX threading + SIMD (handled in worker)
 * Fix 3: Audio cache + pre-cache (handled in worker)
 * Fix 4: Web Speech bridge for instant first-tap response
 */

import { useEffect, useCallback, useState } from 'react';
import { useTTSStore } from '../store/ttsStore';
import { useBoardStore } from '../store/boardStore';
import { unlockIOSSpeech } from '../utils/voiceDetection';

// Singleton worker — one instance for the app lifetime
let worker: Worker | null = null;
const pendingCallbacks = new Map<string, (buffer: ArrayBuffer) => void>();
let callbackIdCounter = 0;
// Tracks the latest in-flight Kokoro request so older worker responses (which
// may carry the previous rate/voice because the worker generates serially)
// don't play out of order and overwrite the new selection. Set to null on
// cancel to drop everything pending.
let latestKokoroRequestId: string | null = null;
// Monotonic batch counter — every new speak() increments it and the worker
// uses it to discard precache work queued by earlier batches.
let speakBatch = 0;
// Dedup guard: a single user gesture occasionally produces multiple speak
// calls (duplicate pointer events on some devices, touchend+click double-fire
// on mobile). If the same text is requested within this window, the second
// request is dropped. 500ms catches the slowest double-fire paths while still
// allowing intentional repeated taps after the phrase has played.
const SPEAK_DEDUP_MS = 500;
let lastSpeakText: string | null = null;
let lastSpeakAt = 0;
// isSpeaking mutex: flipped true when a speak() request is accepted, flipped
// false when the resulting audio ends or is cancelled. Used to block a second
// speak() of the SAME text while the first is still audible — a harder
// guarantee than the time-based dedup since long phrases can exceed the
// window. We intentionally do NOT block different-text speaks here so AAC's
// rapid-interrupt behavior (tap A, then B) still works.
let isSpeaking = false;
// Listeners subscribed to isSpeaking changes so the UI can disable buttons
// (Test Voice, etc.) for the duration of playback.
const speakingListeners = new Set<(v: boolean) => void>();
function setIsSpeaking(v: boolean): void {
  if (isSpeaking === v) return;
  isSpeaking = v;
  speakingListeners.forEach((l) => l(v));
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/tts.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'AUDIO_READY') {
        const cb = pendingCallbacks.get(msg.id);
        if (cb) {
          cb(msg.buffer);
          pendingCallbacks.delete(msg.id);
        }
      }
      if (msg.type === 'SPEAK_ERROR') {
        pendingCallbacks.delete(msg.id);
      }
      if (msg.type === 'LOAD_PROGRESS') {
        useTTSStore.getState().setKokoroProgress(Math.round(msg.progress));
        if (msg.status === 'cached' || msg.status === 'restored') {
          useTTSStore.getState().setKokoroLoadingFromCache(true);
        }
      }
      if (msg.type === 'LOAD_COMPLETE') {
        useTTSStore.getState().setKokoroStatus('ready');
        useTTSStore.getState().setKokoroDevice(msg.device);
        useTTSStore.getState().setKokoroDownloaded(true);
        useTTSStore.getState().setActiveTier('kokoro');
        useTTSStore.getState().setKokoroLoadingFromCache(false);
      }
      if (msg.type === 'LOAD_ERROR') {
        useTTSStore.getState().setKokoroStatus('error');
        useTTSStore.getState().setKokoroError(msg.error);
        // Auto-fallback to Web Speech on Kokoro error (e.g., SharedArrayBuffer not available in WebView)
        useTTSStore.getState().setActiveTier('webspeech');
      }
    };
    // Catch worker initialization errors (e.g., SharedArrayBuffer not available)
    worker.onerror = (error) => {
      console.error('[TTS Worker Error]', error.message);
      useTTSStore.getState().setKokoroStatus('error');
      useTTSStore.getState().setKokoroError(error.message || 'Worker initialization failed');
      useTTSStore.getState().setActiveTier('webspeech');
      // Continue running without Kokoro — user will hear Web Speech instead
    };
  }
  return worker;
}

// Shared AudioContext — reuse across playbacks to avoid init screech
let sharedAudioCtx: AudioContext | null = null;
let audioCtxWarmed = false;

// Interrupt mode: keep track of currently playing audio source so we can stop it
let currentAudioSource: AudioBufferSourceNode | null = null;

// Web Speech voice resolution: do NOT cache voice objects across calls.
// Browsers (esp. Chrome / Android) invalidate SpeechSynthesisVoice references
// whenever the underlying voice list refreshes — a stale ref silently makes
// the utterance fall back to the system default ("robotic") voice. We always
// re-query getVoices() inside resolveVoice() so the assignment uses a live
// reference. We still subscribe to voiceschanged because on Chrome the first
// getVoices() call returns [] until that event fires.
let voicesListenerAttached = false;

function pokeVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  // Just touch the API so the engine populates its internal list.
  window.speechSynthesis.getVoices();
}

/** Pick the best-sounding English voice available on this device.
 *  Priority: Personal Voice → Siri/known iOS voices → local (offline) → network.
 *  Never returns null unless the voice list is completely empty. */
function bestAvailableVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  const pool = english.length ? english : voices;
  const lower = (v: SpeechSynthesisVoice) => v.name.toLowerCase();
  return (
    pool.find((v) => lower(v).includes('personal voice') || lower(v).includes('personalvoice')) ??
    pool.find((v) => v.localService && /siri|samantha|karen|daniel|moira|google us english|microsoft/.test(lower(v))) ??
    pool.find((v) => v.localService) ??
    pool[0] ??
    null
  );
}

/** Resolve the stored voiceURI through a fallback chain so we never hand an
 *  unassigned `.voice` to speechSynthesis. Returns null only if no voices are
 *  loaded at all. */
function resolveVoice(voiceURI: string | null): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  if (voiceURI) {
    // 1. Exact voiceURI match.
    const byURI = voices.find((v) => v.voiceURI === voiceURI);
    if (byURI) return byURI;
    // 2. Name match (some browsers persist the display name as the URI).
    const byName = voices.find((v) => v.name === voiceURI);
    if (byName) return byName;
    // 3. Partial name/URI match — catches voices renamed across OS updates.
    const needle = voiceURI.toLowerCase();
    const partial = voices.find(
      (v) => v.name.toLowerCase().includes(needle) || v.voiceURI.toLowerCase().includes(needle),
    );
    if (partial) return partial;
    console.warn('[TTS] Stored voiceURI not found — falling back to best-available:', voiceURI);
  }

  return bestAvailableVoice(voices);
}

/** Seed the store's webSpeechVoiceURI with a sensible default when we first
 *  receive the voice list. Without this, a fresh install has URI=null and any
 *  Web Speech utterance falls through to the browser's robotic default. */
function seedVoiceURIIfMissing(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const { webSpeechVoiceURI, setWebSpeechVoiceURI } = useTTSStore.getState();
  if (webSpeechVoiceURI) return;
  const voices = window.speechSynthesis.getVoices();
  const best = bestAvailableVoice(voices);
  if (best) setWebSpeechVoiceURI(best.voiceURI);
}

function onVoicesChanged(): void {
  pokeVoices();
  seedVoiceURIIfMissing();
}

function attachVoicesListener(): void {
  if (voicesListenerAttached) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  voicesListenerAttached = true;
  onVoicesChanged();
  try {
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
  } catch {
    (window.speechSynthesis as unknown as { onvoiceschanged: () => void }).onvoiceschanged = onVoicesChanged;
  }
}

attachVoicesListener();

// When the user changes speech rate or voice, re-run the worker's common-word
// precache for the new (voice, speed) pair. Debounced 1s so dragging the
// slider doesn't fire dozens of precache jobs — only the settled value does.
// Module-level so we have exactly one subscription per app, not one per
// useTTS consumer.
let recacheTimer: ReturnType<typeof setTimeout> | null = null;
let lastRecacheSig = '';

useTTSStore.subscribe((state) => {
  if (state.kokoroStatus !== 'ready') return;
  if (!worker) return; // Worker not initialized yet — LOAD will handle initial precache
  const sig = `${state.kokoroVoice}:${state.speechRate.toFixed(2)}`;
  if (sig === lastRecacheSig) return;
  lastRecacheSig = sig;
  if (recacheTimer) clearTimeout(recacheTimer);
  recacheTimer = setTimeout(() => {
    worker?.postMessage({
      type: 'RECACHE',
      voice: state.kokoroVoice,
      speed: state.speechRate,
    });
  }, 1000);
});

/** Check if device is Samsung/older Android that needs audio buffer */
function isSamsungOldAndroid(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  const isSamsung = ua.includes('samsung') || ua.includes('galaxys') || ua.includes('samsungbrowser');
  const androidMatch = ua.match(/android\s+(\d+)/);
  const androidVersion = androidMatch ? parseInt(androidMatch[1], 10) : 0;
  return isSamsung && androidVersion < 12;
}

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioContext();
    audioCtxWarmed = false;
  }
  return sharedAudioCtx;
}

/** Warm the AudioContext with a tiny silent buffer to flush any init garbage */
async function warmAudioContext(ctx: AudioContext): Promise<void> {
  if (audioCtxWarmed) return;
  // Note: We don't await resume() here because it's already been called eagerly
  // in the first user interaction handler. This avoids blocking on double-waiting.
  if (ctx.state === 'suspended') {
    // Just try to resume fire-and-forget style since main thread already requested it
    ctx.resume().catch(() => {});
  }
  // Play silence to flush any init artifacts
  // Samsung/older Android: 100ms buffer to prevent screech
  // Other devices: 50ms
  const silenceDuration = isSamsungOldAndroid() ? 0.1 : 0.05;
  const silent = ctx.createBuffer(1, ctx.sampleRate * silenceDuration, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = silent;
  src.connect(ctx.destination);
  src.start();
  await new Promise<void>((resolve) => { src.onended = () => resolve(); });
  audioCtxWarmed = true;
}

async function playArrayBuffer(
  buffer: ArrayBuffer,
  volume: number,
  pitch: number,
  isStillActive?: () => boolean,
): Promise<void> {
  const audioCtx = getAudioContext();
  // Verify context is running, resume if suspended
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  await warmAudioContext(audioCtx);

  // Interrupt mode: stop any currently playing audio immediately
  if (currentAudioSource) {
    try {
      currentAudioSource.stop(0);
    } catch (e) {
      // Source may already be stopped, ignore
    }
  }

  const audioBuffer = await audioCtx.decodeAudioData(buffer.slice(0));
  // Re-check after the async decode: cancel() may have been called while we
  // were decoding. Without this, the stale buffer would still start playing
  // right after cancel — the overlapping-voices race that triggers on rapid
  // preview taps.
  if (isStillActive && !isStillActive()) return;
  const source = audioCtx.createBufferSource();
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = volume;
  source.buffer = audioBuffer;
  // Kokoro returns PCM at a fixed pitch; apply the user's pitch setting via
  // detune (cents). log2(ratio) * 1200 keeps 1.0 = unchanged, 2.0 = +1 octave,
  // 0.5 = -1 octave. Using detune instead of playbackRate preserves speed.
  if (pitch !== 1 && Number.isFinite(pitch) && pitch > 0) {
    try {
      source.detune.value = Math.log2(pitch) * 1200;
    } catch {
      // Older browsers without detune — silently skip pitch adjustment.
    }
  }
  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // Store reference for interrupt mode
  currentAudioSource = source;

  source.start(0);
  return new Promise((resolve) => {
    source.onended = () => {
      // Clear the reference when speech ends naturally
      if (currentAudioSource === source) {
        currentAudioSource = null;
      }
      resolve();
    };
  });
}

function speakWithWebSpeech(
  text: string,
  voiceURI: string | null,
  rate: number,
  pitch: number,
  volume: number
): Promise<void> {
  return new Promise((resolve) => {
    // Interrupt mode: cancel any currently playing Web Speech immediately
    window.speechSynthesis.cancel();

    // Also stop any Kokoro/Web Audio playback
    if (currentAudioSource) {
      try {
        currentAudioSource.stop(0);
        currentAudioSource = null;
      } catch (e) {
        // Source may already be stopped, ignore
      }
    }

    // Build a fresh utterance and set rate/pitch/volume/voice together right
    // before speak() — never rely on previous values carrying over.
    const voice = resolveVoice(voiceURI);
    if (!voice) {
      // No voices loaded at all — skipping is better than speaking in the
      // browser's robotic default. This should be extremely rare after
      // voiceschanged has fired.
      console.warn('[TTS] No voice available — skipping utterance:', text);
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    utterance.voice = voice;
    if (import.meta.env.DEV) {
      console.log('[TTS] speak()', { storedURI: voiceURI, using: voice.name, lang: voice.lang });
    }

    utterance.onend = () => { setIsSpeaking(false); resolve(); };
    utterance.onerror = () => { setIsSpeaking(false); resolve(); }; // Never reject — AAC reliability
    // Chrome can leave the engine paused when backgrounded; resume() before
    // speak() is the documented workaround.
    try { window.speechSynthesis.resume(); } catch { /* noop */ }
    window.speechSynthesis.speak(utterance);
  });
}

export function useTTS() {
  // Note: speak()/speakPreview() read speechRate/Pitch/Volume from the store
  // at call time via getState(), so we don't subscribe to them here — that
  // would cause spurious re-renders for every slider drag without changing
  // any rendered output.
  const getPronunciation = useBoardStore((s) => s.getPronunciation);

  // Unlock iOS speech synthesis + eagerly resume AudioContext on first user interaction
  // This prevents Web Audio API from blocking on first tap
  useEffect(() => {
    unlockIOSSpeech();
    // Touch the voice list in case it arrived after module init.
    pokeVoices();
    const warmOnInteraction = async () => {
      const audioCtx = getAudioContext();
      // Immediately try to resume AudioContext without waiting for warmup
      // This fires off the resume promise without blocking, so subsequent speaks are faster
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {
          // Non-fatal if resume fails
        });
      }
      // Then warm the context in the background (with silence buffer)
      warmAudioContext(audioCtx).catch(() => {
        // Non-fatal if warming fails
      });
      // Note: we intentionally don't speak a silent warmup utterance here.
      // A volume-0 utterance with no .voice primed some Chrome/Android builds
      // into the browser's default (robotic) voice state, causing subsequent
      // utterances to revert to robotic. The iOS unlock above is the only
      // engine-primer we rely on, and it only runs on touchstart.
      document.removeEventListener('pointerdown', warmOnInteraction);
    };
    document.addEventListener('pointerdown', warmOnInteraction, { once: true });
    return () => document.removeEventListener('pointerdown', warmOnInteraction);
  }, []);

  // Auto-download Kokoro on app start (if not already downloaded)
  // Or reload if it was previously cached
  useEffect(() => {
    const { kokoroDownloaded, kokoroStatus, kokoroDeclined } = useTTSStore.getState();

    // Only proceed if Kokoro is idle
    if (kokoroStatus !== 'idle') return;

    // Reset kokoroDeclined flag — old app version set this, but now we auto-download unconditionally
    if (kokoroDeclined) {
      useTTSStore.getState().setKokoroDeclined(false);
    }

    useTTSStore.getState().setKokoroStatus('downloading');

    if (kokoroDownloaded) {
      useTTSStore.getState().setKokoroLoadingFromCache(true); // Signal this is a cache reload
    }

    const { kokoroVoice, speechRate } = useTTSStore.getState();
    getWorker().postMessage({ type: 'LOAD', dtype: 'q8', voice: kokoroVoice, speed: speechRate });
  }, []);

  // Voice change — no need to clear cache or reload model.
  // Different voices use different cache keys (voice:text), so
  // old cache entries don't conflict. Model handles all voices.
  // Precaching happens naturally as the user speaks.

  // speak() — reads current state from store at call time (not stale closure)
  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;

    // Dedup: drop same-text requests fired within SPEAK_DEDUP_MS of the last
    // one, OR while the same text is still audibly playing (covers long
    // phrases that exceed the time window). Guards against a single tap
    // firing multiple speak() calls via duplicate pointer events or mobile
    // touchend+click double-fire, without blocking different-text taps so
    // rapid-switch AAC use still works.
    const now = Date.now();
    if (
      text === lastSpeakText &&
      (isSpeaking || now - lastSpeakAt < SPEAK_DEDUP_MS)
    ) {
      if (import.meta.env.DEV) {
        console.log('[TTS] dedup — dropping duplicate speak():', text, { isSpeaking });
      }
      return;
    }
    lastSpeakText = text;
    lastSpeakAt = now;
    setIsSpeaking(true);

    // Read FRESH state from store — avoids stale closure when called from voice preview
    const s = useTTSStore.getState();
    const tier = s.activeTier;
    const status = s.kokoroStatus;
    const voice = s.kokoroVoice;
    const wsVoiceURI = s.webSpeechVoiceURI;
    const rate = s.speechRate;
    const pitch = s.speechPitch;
    const volume = s.speechVolume;

    // Pass voice to getPronunciation so British voice overrides apply
    const processed = getPronunciation(text, voice);

    // Tier 1: Kokoro (best quality). Once the user has selected an AI voice,
    // we NEVER silently fall back to Web Speech — a sudden robotic voice is
    // more confusing than a delay. The tier only changes to 'webspeech' on an
    // explicit LOAD_ERROR (handled in the worker.onerror/LOAD_ERROR path),
    // which is a loud failure the user will notice.
    if (tier === 'kokoro') {
      if (status !== 'ready') {
        // Model still downloading or initializing — drop the request rather
        // than speak in the browser default voice. The Settings panel already
        // surfaces the download progress, so the user isn't left in the dark.
        console.warn('[TTS] Kokoro not ready (status=' + status + ') — dropping speak:', processed);
        return;
      }
      return new Promise<void>((resolve) => {
        const id = String(++callbackIdCounter);
        latestKokoroRequestId = id;

        pendingCallbacks.set(id, async (buffer: ArrayBuffer) => {
          // Drop stale audio: if a newer speak() (or cancel) has happened
          // since this request was issued, the worker is just now returning
          // the OLD rate/voice. Playing it would overwrite the user's new
          // selection and feel like the rate slider "didn't work".
          if (latestKokoroRequestId !== id) {
            resolve();
            return;
          }
          try {
            await playArrayBuffer(buffer, volume, pitch, () => latestKokoroRequestId === id);
          } catch (err) {
            // Decode/playback failed. Don't silently fall through to Web
            // Speech — that's the jarring "robotic voice" the user hears.
            console.error('[TTS] Kokoro playback failed:', err);
          }
          // Only clear isSpeaking if no newer speak has taken over — a fresh
          // speak bumped the id and set its own flag, which we must not
          // clobber by clearing here.
          if (latestKokoroRequestId === id) setIsSpeaking(false);
          resolve();
        });

        // Bumping the batch id tells the worker to skip any SPEAK_AND_CACHE
        // precache work that was queued by earlier speak() calls. Without
        // this, rapid taps make each new SPEAK wait behind a backlog of
        // per-word cache jobs from prior taps.
        speakBatch += 1;
        getWorker().postMessage({
          type: 'SPEAK',
          text: processed,
          voice,
          speed: rate,
          id,
          batch: speakBatch,
        });
      });
    }

    // Tier 2 & 3: Web Speech API — only reached when the user's active tier
    // is explicitly webspeech/personal (e.g. after a LOAD_ERROR auto-switch).
    return speakWithWebSpeech(processed, wsVoiceURI, rate, pitch, volume);
  }, [getPronunciation]);

  // Auditory Touch preview — always Web Speech, slightly quieter/faster.
  // Reads fresh state and resolves the voice on every call so a stale
  // selection never leaks through.
  const speakPreview = useCallback((text: string): void => {
    if (!text.trim()) return;
    const processed = getPronunciation(text);
    const s = useTTSStore.getState();
    // Interrupt mode: cancel any currently playing audio + invalidate Kokoro
    window.speechSynthesis.cancel();
    if (currentAudioSource) {
      try {
        currentAudioSource.stop(0);
        currentAudioSource = null;
      } catch (e) {
        // Source may already be stopped, ignore
      }
    }
    latestKokoroRequestId = null;
    const voice = resolveVoice(s.webSpeechVoiceURI);
    if (!voice) {
      console.warn('[TTS] No voice available — skipping preview:', processed);
      return;
    }
    const u = new SpeechSynthesisUtterance(processed);
    u.rate = s.speechRate * 1.05;
    u.pitch = s.speechPitch;
    u.volume = s.speechVolume * 0.85;
    u.voice = voice;
    try { window.speechSynthesis.resume(); } catch { /* noop */ }
    window.speechSynthesis.speak(u);
  }, [getPronunciation]);

  const cancel = useCallback(() => {
    // Cancel both Web Speech and Web Audio playback
    window.speechSynthesis?.cancel();
    if (currentAudioSource) {
      try {
        currentAudioSource.stop(0);
        currentAudioSource = null;
      } catch (e) {
        // Source may already be stopped, ignore
      }
    }
    // Invalidate every in-flight Kokoro request. Without this, audio that the
    // worker is still synthesizing will play *after* the user explicitly
    // stopped — the source of "random unprompted speech" when leaving the
    // Settings panel mid-preview.
    latestKokoroRequestId = null;
    // Clear dedup memory so a speak immediately following cancel isn't
    // incorrectly suppressed (e.g. Test Voice → cancel → speak same phrase).
    lastSpeakText = null;
    lastSpeakAt = 0;
    setIsSpeaking(false);
  }, []);

  // Subscribe to the module-level isSpeaking flag so components can disable
  // buttons (e.g. Test Voice) while speech is in flight. Mirrors the module
  // state into React so re-renders happen on change.
  const [isSpeakingState, setIsSpeakingState] = useState(isSpeaking);
  useEffect(() => {
    speakingListeners.add(setIsSpeakingState);
    setIsSpeakingState(isSpeaking);
    return () => { speakingListeners.delete(setIsSpeakingState); };
  }, []);

  return { speak, speakPreview, cancel, isSpeaking: isSpeakingState };
}
