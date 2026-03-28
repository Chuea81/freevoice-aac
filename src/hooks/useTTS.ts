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
      }
      if (msg.type === 'LOAD_COMPLETE') {
        useTTSStore.getState().setKokoroStatus('ready');
        useTTSStore.getState().setKokoroDevice(msg.device);
        useTTSStore.getState().setKokoroDownloaded(true);
        useTTSStore.getState().setActiveTier('kokoro');
      }
      if (msg.type === 'LOAD_ERROR') {
        useTTSStore.getState().setKokoroStatus('error');
        useTTSStore.getState().setKokoroError(msg.error);
      }
    };
  }
  return worker;
}

async function playArrayBuffer(buffer: ArrayBuffer, volume: number): Promise<void> {
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(buffer.slice(0));
  const source = audioCtx.createBufferSource();
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = volume;
  source.buffer = audioBuffer;
  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  source.start(0);
  return new Promise((resolve) => {
    source.onended = () => {
      audioCtx.close();
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
    activeTier,
    kokoroStatus,
    kokoroVoice,
    webSpeechVoiceURI,
    speechRate,
    speechPitch,
    speechVolume,
  } = useTTSStore();

  const getPronunciation = useBoardStore((s) => s.getPronunciation);

  // Unlock iOS speech synthesis on mount
  useEffect(() => {
    unlockIOSSpeech();
  }, []);

  // Auto-reload Kokoro if it was previously downloaded (model cached by browser)
  useEffect(() => {
    const { kokoroDownloaded, kokoroStatus } = useTTSStore.getState();
    if (kokoroDownloaded && kokoroStatus === 'idle') {
      useTTSStore.getState().setKokoroStatus('downloading');
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

  // Fix 4: speak() with Web Speech bridge for instant first-tap response
  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;

    const processed = getPronunciation(text);

    // Tier 1: Kokoro (best quality) with Web Speech bridge
    if (activeTier === 'kokoro' && kokoroStatus === 'ready') {
      return new Promise<void>((resolve) => {
        let webSpeechPlayed = false;
        let kokoroResponded = false;

        const id = String(++callbackIdCounter);

        // 300ms bridge: if Kokoro hasn't responded, it's a cache miss.
        // Play Web Speech immediately so the child hears something.
        const bridgeTimer = setTimeout(() => {
          if (!kokoroResponded) {
            webSpeechPlayed = true;
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(processed);
            u.rate = speechRate;
            u.pitch = speechPitch;
            u.volume = speechVolume;
            if (webSpeechVoiceURI) {
              const voices = window.speechSynthesis.getVoices();
              const match = voices.find(v => v.voiceURI === webSpeechVoiceURI);
              if (match) u.voice = match;
            }
            window.speechSynthesis.speak(u);
          }
        }, 300);

        // Register Kokoro callback
        pendingCallbacks.set(id, async (buffer: ArrayBuffer) => {
          kokoroResponded = true;
          clearTimeout(bridgeTimer);

          if (webSpeechPlayed) {
            // Web Speech already playing — don't overlap with Kokoro.
            // The audio is now cached, so next tap will be instant Kokoro.
            resolve();
            return;
          }

          try {
            await playArrayBuffer(buffer, speechVolume);
          } catch {
            // AudioContext failed — fall back to Web Speech
            await speakWithWebSpeech(processed, webSpeechVoiceURI, speechRate, speechPitch, speechVolume);
          }
          resolve();
        });

        getWorker().postMessage({
          type: 'SPEAK',
          text: processed,
          voice: kokoroVoice,
          speed: speechRate,
          id,
        });

        // Hard timeout: if nothing responds in 10s, resolve anyway
        setTimeout(() => {
          if (pendingCallbacks.has(id)) {
            pendingCallbacks.delete(id);
            if (!webSpeechPlayed) {
              speakWithWebSpeech(processed, webSpeechVoiceURI, speechRate, speechPitch, speechVolume).then(resolve);
            } else {
              resolve();
            }
          }
        }, 10000);
      });
    }

    // Tier 2 & 3: Web Speech API
    return speakWithWebSpeech(processed, webSpeechVoiceURI, speechRate, speechPitch, speechVolume);
  }, [activeTier, kokoroStatus, kokoroVoice, webSpeechVoiceURI, speechRate, speechPitch, speechVolume, getPronunciation]);

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
