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
      }
    };
  }
  return worker;
}

// Shared AudioContext — reuse across playbacks to avoid init screech
let sharedAudioCtx: AudioContext | null = null;
let audioCtxWarmed = false;

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
  // Play 50ms of silence to flush any init artifacts
  const silent = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = silent;
  src.connect(ctx.destination);
  src.start();
  await new Promise<void>((resolve) => { src.onended = () => resolve(); });
  audioCtxWarmed = true;
}

async function playArrayBuffer(buffer: ArrayBuffer, volume: number): Promise<void> {
  const audioCtx = getAudioContext();
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
    kokoroStatus,
    kokoroVoice,
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

  // Auto-reload Kokoro if it was previously downloaded (model cached by browser)
  useEffect(() => {
    const { kokoroDownloaded, kokoroStatus } = useTTSStore.getState();
    if (kokoroDownloaded && kokoroStatus === 'idle') {
      useTTSStore.getState().setKokoroStatus('downloading');
      useTTSStore.getState().setKokoroLoadingFromCache(true); // Signal this is a cache reload
      const { kokoroVoice, speechRate } = useTTSStore.getState();
      getWorker().postMessage({ type: 'LOAD', dtype: 'q8', voice: kokoroVoice, speed: speechRate });
    }
  }, []);

  // Fix 3: Clear cache and re-warm when voice changes
  useEffect(() => {
    if (kokoroStatus === 'ready') {
      getWorker().postMessage({ type: 'CLEAR_CACHE' });
      getWorker().postMessage({
        type: 'LOAD',
        voice: kokoroVoice,
        speed: speechRate,
      });
    }
  }, [kokoroVoice]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const processed = getPronunciation(text);

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

  const downloadKokoro = useCallback(() => {
    const { kokoroVoice, speechRate } = useTTSStore.getState();
    useTTSStore.getState().setKokoroStatus('downloading');
    useTTSStore.getState().setKokoroDeclined(false);
    getWorker().postMessage({
      type: 'LOAD',
      dtype: 'q8', // Worker overrides with fp32 if WebGPU detected
      voice: kokoroVoice,
      speed: speechRate,
    });
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, speakPreview, downloadKokoro, cancel };
}
