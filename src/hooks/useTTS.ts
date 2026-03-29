/**
 * Unified TTS hook — three-tier voice system with latency fixes.
 * Fix 1: WebGPU device selection (handled in worker)
 * Fix 2: ONNX threading + SIMD (handled in worker)
 * Fix 3: Audio cache + pre-cache (handled in worker)
 * Fix 4: Web Speech bridge for instant first-tap response
 */

import { useEffect, useCallback } from 'react';
import { useTTSStore } from '../store/ttsStore';
import { useBoardStore } from '../store/boardStore';
import { unlockIOSSpeech } from '../utils/voiceDetection';

// Singleton worker — one instance for the app lifetime
let worker: Worker | null = null;
const pendingCallbacks = new Map<string, (buffer: ArrayBuffer) => void>();
let callbackIdCounter = 0;

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
  if (ctx.state === 'suspended') {
    await ctx.resume();
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

async function playArrayBuffer(buffer: ArrayBuffer, volume: number): Promise<void> {
  const audioCtx = getAudioContext();
  // Verify context is running, resume if suspended
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  await warmAudioContext(audioCtx);
  const audioBuffer = await audioCtx.decodeAudioData(buffer.slice(0));
  const source = audioCtx.createBufferSource();
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = volume;
  source.buffer = audioBuffer;
  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  source.start(0);
  return new Promise((resolve) => {
    source.onended = () => resolve();
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
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    if (voiceURI) {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.voiceURI === voiceURI);
      if (match) utterance.voice = match;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve(); // Never reject — AAC reliability
    window.speechSynthesis.speak(utterance);
  });
}

export function useTTS() {
  const {
    speechRate,
    speechPitch,
    speechVolume,
  } = useTTSStore();

  const getPronunciation = useBoardStore((s) => s.getPronunciation);

  // Unlock iOS speech synthesis + warm AudioContext on first user interaction
  useEffect(() => {
    unlockIOSSpeech();
    const warmOnInteraction = () => {
      warmAudioContext(getAudioContext());
      document.removeEventListener('pointerdown', warmOnInteraction);
    };
    document.addEventListener('pointerdown', warmOnInteraction, { once: true });
    return () => document.removeEventListener('pointerdown', warmOnInteraction);
  }, []);

  // Auto-download Kokoro on app start (if not already downloaded)
  // Or reload if it was previously cached
  useEffect(() => {
    const { kokoroDownloaded, kokoroStatus, kokoroDeclined } = useTTSStore.getState();

    // Only proceed if Kokoro is idle and user hasn't declined download
    if (kokoroStatus !== 'idle' || kokoroDeclined) return;

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

    // Tier 1: Kokoro (best quality)
    if (tier === 'kokoro' && status === 'ready') {
      return new Promise<void>((resolve) => {
        const id = String(++callbackIdCounter);

        // Register Kokoro callback — wait for it, no bridge fallback
        pendingCallbacks.set(id, async (buffer: ArrayBuffer) => {
          try {
            await playArrayBuffer(buffer, volume);
          } catch {
            await speakWithWebSpeech(processed, wsVoiceURI, rate, pitch, volume);
          }
          resolve();
        });

        getWorker().postMessage({
          type: 'SPEAK',
          text: processed,
          voice,
          speed: rate,
          id,
        });

        // Background-cache the sentence words for next time
        const words = processed.split(/\s+/).filter(w => w.length > 1);
        for (const word of words) {
          getWorker().postMessage({
            type: 'SPEAK_AND_CACHE',
            text: word,
            voice,
            speed: rate,
          });
        }

        // Hard timeout: if Kokoro doesn't respond in 15s, fall back to Web Speech
        setTimeout(() => {
          if (pendingCallbacks.has(id)) {
            pendingCallbacks.delete(id);
            speakWithWebSpeech(processed, wsVoiceURI, rate, pitch, volume).then(resolve);
          }
        }, 15000);
      });
    }

    // Tier 2 & 3: Web Speech API
    return speakWithWebSpeech(processed, wsVoiceURI, rate, pitch, volume);
  }, [getPronunciation]);

  // Auditory Touch preview — always Web Speech, slightly quieter/faster
  // Note: speakPreview doesn't pass voice since it's always Web Speech (not Kokoro)
  const speakPreview = useCallback((text: string): void => {
    if (!text.trim()) return;
    const processed = getPronunciation(text);
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(processed);
    u.rate = speechRate * 1.05;
    u.pitch = speechPitch;
    u.volume = speechVolume * 0.85;
    window.speechSynthesis.speak(u);
  }, [speechRate, speechPitch, speechVolume, getPronunciation]);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, speakPreview, cancel };
}
