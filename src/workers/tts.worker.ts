// TTS Web Worker — Kokoro inference runs here, never on main thread.
// Fixes: WebGPU detection, ONNX threading/SIMD, audio cache + pre-cache.

import { KokoroTTS } from 'kokoro-js';

// ── Fix 2: ONNX threading + SIMD — set BEFORE model loads ──
// Access env via dynamic import to set ONNX runtime options.
// These are safe no-ops if the browser doesn't support them.
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kokoroModule = await import('kokoro-js') as any;
  if (kokoroModule.env?.backends?.onnx?.wasm) {
    kokoroModule.env.backends.onnx.wasm.numThreads = Math.min(navigator.hardwareConcurrency ?? 4, 8);
    kokoroModule.env.backends.onnx.wasm.simd = true;
  }
} catch {
  // Safe fallback — threading/SIMD just won't be enabled
}

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

// ── Fix 1: WebGPU detection ──
async function detectWebGPU(): Promise<boolean> {
  try {
    if (!('gpu' in navigator)) return false;
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
      // fp32 with WebGPU is faster AND better than q8 with WASM
      const dtype = hasWebGPU ? 'fp32' : (dtypeHint as 'q8');

      tts = await KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: dtype as 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16',
        device: device as 'webgpu' | 'wasm',
        progress_callback: (progress: { status: string; progress?: number }) => {
          post({
            type: 'LOAD_PROGRESS',
            progress: progress.progress ?? 0,
            status: progress.status,
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

// ── Fix 3: Audio cache ──
const audioCache = new Map<string, ArrayBuffer>();

const PRECACHE_LIST = [
  // Core words
  'I', 'want', 'go', 'more', 'stop', 'help', 'no', 'yes', 'done',
  'like', 'not', 'please', 'here', 'good', 'again', 'look', 'big',
  // Fast phrases
  'I need help',
  'Wait please',
  "I'm done",
  'More please',
  'I need a break',
  'I love you',
  'Thank you',
  'Good job!',
  'Stop',
  'Look at me',
  'I do not understand',
  'I am frustrated',
  'Say that again',
];

async function preCacheCommonWords(voice: string, speed: number): Promise<void> {
  for (const word of PRECACHE_LIST) {
    const key = `${voice}:${word}`;
    if (audioCache.has(key)) continue;

    try {
      const audio = await tts!.generate(word, { voice: voice as any, speed });
      const wav = audio.toWav();
      audioCache.set(key, wav);
      post({ type: 'AUDIO_CACHED', text: word, voice });
    } catch {
      // Non-fatal — skip and continue
    }

    // Yield between words so SPEAK messages aren't blocked
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
      // After model loads, start pre-caching in background
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
          // CACHE HIT — zero inference, instant response
          // .slice(0) copies so cache entry stays valid after transfer
          wav = audioCache.get(cacheKey)!.slice(0);
        } else {
          // CACHE MISS — synthesize and cache for next time
          const audio = await tts.generate(msg.text, {
            voice: msg.voice,
            speed: msg.speed,
          });
          wav = audio.toWav();
          audioCache.set(cacheKey, wav.slice(0)); // keep a copy in cache
        }

        post({ type: 'AUDIO_READY', id: msg.id, buffer: wav }, [wav]);
      } catch (err) {
        post({ type: 'SPEAK_ERROR', id: msg.id, error: String(err) });
      }
      break;
    }

    case 'SPEAK_AND_CACHE': {
      if (!tts) return;
      const cacheKey = `${msg.voice}:${msg.text}`;
      if (audioCache.has(cacheKey)) return;

      try {
        const audio = await tts.generate(msg.text, {
          voice: msg.voice,
          speed: msg.speed,
        });
        const wav = audio.toWav();
        audioCache.set(cacheKey, wav);
        post({ type: 'AUDIO_CACHED', text: msg.text, voice: msg.voice });
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
