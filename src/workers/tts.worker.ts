// TTS Web Worker — Kokoro inference runs here, never on main thread.

import { KokoroTTS } from 'kokoro-js';

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx = self as any;

let tts: InstanceType<typeof KokoroTTS> | null = null;
let loadingPromise: Promise<void> | null = null;

function post(msg: Record<string, unknown>, transfer?: Transferable[]) {
  if (transfer) {
    ctx.postMessage(msg, transfer);
  } else {
    ctx.postMessage(msg);
  }
}

async function detectWebGPU(): Promise<boolean> {
  try {
    if (!('gpu' in navigator)) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = await (navigator as any).gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

async function loadModel(dtypeHint = 'q8') {
  if (tts) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const hasWebGPU = await detectWebGPU();
      const device = hasWebGPU ? 'webgpu' : 'wasm';
      const dtype = hasWebGPU ? 'fp32' : (dtypeHint as 'q8');

      tts = await KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: dtype as 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16',
        device: device as 'webgpu' | 'wasm',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progress_callback: (progress: any) => {
          // progress.progress can be 0-100 (percentage) or 0-1 (fraction)
          // or undefined during 'initiate' phase
          let pct = 0;
          if (typeof progress.progress === 'number') {
            pct = progress.progress > 1 ? progress.progress : progress.progress * 100;
          }
          post({
            type: 'LOAD_PROGRESS',
            progress: pct,
            status: progress.status || 'loading',
            device,
          });
        },
      });
      post({ type: 'LOAD_COMPLETE', device });
    } catch (err) {
      post({ type: 'LOAD_ERROR', error: String(err) });
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

// ── Audio cache ──
const audioCache = new Map<string, ArrayBuffer>();

const PRECACHE_LIST = [
  'I', 'want', 'go', 'more', 'stop', 'help', 'no', 'yes', 'done',
  'like', 'not', 'please', 'here', 'good', 'again', 'look', 'big',
  'I need help', 'Wait please', "I'm done", 'More please',
  'I need a break', 'I love you', 'Thank you', 'Good job!',
  'Stop', 'Look at me', 'I do not understand',
  'I am frustrated', 'Say that again',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function preCacheCommonWords(voice: string, speed: number): Promise<void> {
  for (const word of PRECACHE_LIST) {
    const key = `${voice}:${word}`;
    if (audioCache.has(key)) continue;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const audio = await tts!.generate(word, { voice: voice as any, speed });
      const wav = audio.toWav();
      audioCache.set(key, wav);
    } catch {
      // Non-fatal
    }
    await new Promise(r => setTimeout(r, 0));
  }
  post({ type: 'PRECACHE_COMPLETE' });
}

// ── Message handler ──
ctx.onmessage = async (e: MessageEvent) => {
  const msg = e.data;

  switch (msg.type) {
    case 'LOAD': {
      await loadModel(msg.dtype);
      if (tts) {
        const voice = msg.voice ?? 'af_heart';
        const speed = msg.speed ?? 0.9;
        preCacheCommonWords(voice, speed).catch(() => {});
      }
      break;
    }

    case 'SPEAK': {
      if (!tts) {
        post({ type: 'SPEAK_ERROR', id: msg.id, error: 'Model not loaded' });
        return;
      }
      const cacheKey = `${msg.voice}:${msg.text}`;
      try {
        let wav: ArrayBuffer;
        if (audioCache.has(cacheKey)) {
          wav = audioCache.get(cacheKey)!.slice(0);
        } else {
          const audio = await tts.generate(msg.text, {
            voice: msg.voice,
            speed: msg.speed,
          });
          wav = audio.toWav();
          audioCache.set(cacheKey, wav.slice(0));
        }
        post({ type: 'AUDIO_READY', id: msg.id, buffer: wav }, [wav]);
      } catch (err) {
        post({ type: 'SPEAK_ERROR', id: msg.id, error: String(err) });
      }
      break;
    }

    case 'SPEAK_AND_CACHE': {
      if (!tts) return;
      const ck = `${msg.voice}:${msg.text}`;
      if (audioCache.has(ck)) return;
      try {
        const audio = await tts.generate(msg.text, { voice: msg.voice, speed: msg.speed });
        const wav = audio.toWav();
        audioCache.set(ck, wav);
      } catch {
        // Non-fatal
      }
      break;
    }

    case 'CLEAR_CACHE': {
      audioCache.clear();
      break;
    }

    case 'LIST_VOICES': {
      if (!tts) return;
      const voices = tts.list_voices();
      post({ type: 'VOICES_LIST', voices });
      break;
    }
  }
};
