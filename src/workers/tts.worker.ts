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

// ── IndexedDB model cache (Android-safe, won't be evicted) ──
const IDB_NAME = 'FreeVoiceModelCache';
const IDB_STORE = 'models';
const IDB_VERSION = 1;

function openModelIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Copy model files from Cache Storage → IndexedDB for Android persistence */
async function backupCacheToIDB(): Promise<void> {
  try {
    const cacheNames = await caches.keys();
    const tfCacheName = cacheNames.find(n => n.includes('transformers'));
    if (!tfCacheName) return;

    const cache = await caches.open(tfCacheName);
    const keys = await cache.keys();
    const kokoroKeys = keys.filter(req => req.url.includes('Kokoro'));
    if (kokoroKeys.length === 0) return;

    const db = await openModelIDB();

    // Check if already backed up
    const marker = await idbGet(db, '__kokoro_cached');
    if (marker) { db.close(); return; }

    for (const req of kokoroKeys) {
      const resp = await cache.match(req);
      if (!resp) continue;
      const blob = await resp.blob();
      await idbPut(db, req.url, {
        blob,
        headers: Object.fromEntries(resp.headers.entries()),
      });
    }
    await idbPut(db, '__kokoro_cached', true);
    db.close();
  } catch {
    // Non-fatal
  }
}

/** Restore model files from IndexedDB → Cache Storage (for Android re-sessions) */
async function restoreCacheFromIDB(): Promise<boolean> {
  try {
    const db = await openModelIDB();
    const marker = await idbGet(db, '__kokoro_cached');
    if (!marker) { db.close(); return false; }

    // Check if Cache Storage already has the model
    const cacheNames = await caches.keys();
    const tfCacheName = cacheNames.find(n => n.includes('transformers'));
    if (tfCacheName) {
      const cache = await caches.open(tfCacheName);
      const keys = await cache.keys();
      if (keys.some(req => req.url.includes('Kokoro'))) {
        db.close();
        return true; // Already in Cache Storage
      }
    }

    // Restore from IDB to Cache Storage
    const cacheName = tfCacheName || 'transformers-cache';
    const cache = await caches.open(cacheName);

    // Get all keys from IDB
    const allKeys: string[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror = () => reject(req.error);
    });

    const urlKeys = allKeys.filter(k => k.startsWith('http'));
    for (const url of urlKeys) {
      const entry = await idbGet(db, url) as { blob: Blob; headers: Record<string, string> } | null;
      if (!entry) continue;
      const resp = new Response(entry.blob, { headers: entry.headers });
      await cache.put(new Request(url), resp);
    }

    db.close();
    return urlKeys.length > 0;
  } catch {
    return false;
  }
}

/** Check if model is available (Cache Storage or IndexedDB) */
async function isModelCached(): Promise<boolean> {
  try {
    // First check Cache Storage
    const cacheNames = await caches.keys();
    const tfCache = cacheNames.find(n => n.includes('transformers'));
    if (tfCache) {
      const cache = await caches.open(tfCache);
      const keys = await cache.keys();
      if (keys.some(req => req.url.includes('Kokoro'))) return true;
    }
    // Then check IndexedDB backup
    const db = await openModelIDB();
    const marker = await idbGet(db, '__kokoro_cached');
    db.close();
    return !!marker;
  } catch {
    return false;
  }
}

/** Request persistent storage so the browser doesn't evict caches */
async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist) {
      const persisted = await navigator.storage.persisted();
      if (!persisted) {
        await navigator.storage.persist();
      }
    }
  } catch {
    // Non-fatal
  }
}

async function loadModel(dtypeHint = 'q8') {
  if (tts) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      await requestPersistentStorage();

      const hasWebGPU = await detectWebGPU();
      const device = hasWebGPU ? 'webgpu' : 'wasm';
      // Restore model from IndexedDB → Cache Storage if Android evicted it
      const restoredFromIDB = await restoreCacheFromIDB();
      const cached = restoredFromIDB || await isModelCached();
      if (cached) {
        post({ type: 'LOAD_PROGRESS', progress: 95, status: restoredFromIDB ? 'restored' : 'cached', device });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const progressCb = (progress: any) => {
        let pct = 0;
        if (typeof progress.progress === 'number') {
          pct = progress.progress > 1 ? progress.progress : progress.progress * 100;
        }
        if (progress.status === 'initiate' && pct === 0) pct = 1;
        if (cached && pct < 95) pct = 95;
        post({
          type: 'LOAD_PROGRESS',
          progress: Math.round(pct),
          status: cached ? 'cached' : (progress.status || 'loading'),
          device,
        });
      };

      // Try WebGPU first if available, fall back to WASM on any error
      let loadDevice = device;
      if (hasWebGPU) {
        try {
          tts = await KokoroTTS.from_pretrained(MODEL_ID, {
            dtype: 'fp32',
            device: 'webgpu',
            progress_callback: progressCb,
          });
        } catch {
          // WebGPU failed (e.g. "No available adapters") — fall back to WASM
          tts = null;
          loadDevice = 'wasm';
        }
      }

      if (!tts) {
        tts = await KokoroTTS.from_pretrained(MODEL_ID, {
          dtype: (dtypeHint as 'q8') as 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16',
          device: 'wasm',
          progress_callback: progressCb,
        });
        loadDevice = 'wasm';
      }

      post({ type: 'LOAD_COMPLETE', device: loadDevice });

      // Backup model to IndexedDB so Android can't evict it
      backupCacheToIDB().catch(() => {});
    } catch (err) {
      post({ type: 'LOAD_ERROR', error: String(err) });
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

// ── Audio cache ──
const audioCache = new Map<string, ArrayBuffer>();

// Cache keys must include speed — otherwise changing the rate slider returns
// stale audio at the old speed because the cache hits before re-synthesis.
function cacheKey(voice: string, speed: number, text: string): string {
  return `${voice}:${speed.toFixed(2)}:${text}`;
}

const PRECACHE_LIST = [
  // Core words (immediate recognition)
  'I', 'want', 'go', 'more', 'stop', 'help', 'no', 'yes', 'done',
  'like', 'not', 'please', 'here', 'good', 'again', 'look', 'big',

  // Common phrases
  'I need help', 'Wait please', "I'm done", 'More please',
  'I need a break', 'I love you', 'Thank you', 'Good job!',
  'Stop', 'Look at me', 'I do not understand',
  'I am frustrated', 'Say that again',

  // Body parts (medical/safety critical)
  'arm', 'leg', 'hand', 'head', 'eye', 'mouth', 'pain', 'hurt',

  // Emotions
  'happy', 'sad', 'angry', 'tired', 'scared', 'sick',

  // Actions
  'run', 'walk', 'sit', 'stand', 'jump', 'eat', 'drink', 'sleep', 'play',

  // Communication
  'hello', 'goodbye', 'okay', 'wait', 'come', 'go away',

  // Numbers
  'one', 'two', 'three', 'four', 'five',
];

let precachePaused = false;

async function preCacheCommonWords(voice: string, speed: number): Promise<void> {
  precachePaused = false;
  for (const word of PRECACHE_LIST) {
    // Pause precaching if a SPEAK request came in — don't block the user
    if (precachePaused) break;
    const key = cacheKey(voice, speed, word);
    if (audioCache.has(key)) continue;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const audio = await tts!.generate(word, { voice: voice as any, speed });
      const wav = audio.toWav();
      audioCache.set(key, wav);
    } catch {
      // Non-fatal
    }
    // Yield to let SPEAK messages be processed
    await new Promise(r => setTimeout(r, 10));
  }
  post({ type: 'PRECACHE_COMPLETE' });
}

/** Delete Kokoro model from Cache Storage and IndexedDB */
async function deleteModel(): Promise<void> {
  try {
    // Clear Cache Storage
    const cacheNames = await caches.keys();
    const tfCacheName = cacheNames.find(n => n.includes('transformers'));
    if (tfCacheName) {
      const cache = await caches.open(tfCacheName);
      const keys = await cache.keys();
      const kokoroKeys = keys.filter(req => req.url.includes('Kokoro'));
      for (const req of kokoroKeys) {
        await cache.delete(req);
      }
    }
    // Clear IndexedDB
    const db = await openModelIDB();
    const allKeys: string[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror = () => reject(tx.error);
    });
    const deleteTx = db.transaction(IDB_STORE, 'readwrite');
    for (const key of allKeys) {
      deleteTx.objectStore(IDB_STORE).delete(key);
    }
    await new Promise<void>((resolve, reject) => {
      deleteTx.oncomplete = () => resolve();
      deleteTx.onerror = () => reject(deleteTx.error);
    });
    db.close();
    // Clear audio cache
    audioCache.clear();
    // Unload model
    tts = null;
  } catch (err) {
    console.error('Error deleting model:', err);
  }
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

        // Pre-warm the TTS pipeline with a silent string to avoid initialization latency
        // on the first real speech request. This primes the inference engine.
        try {
          // Silent pre-warm: generate a very short string to initialize everything
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const warmupAudio = await tts.generate('', { voice: voice as any, speed });
          warmupAudio.toWav(); // Ensure full pipeline is initialized
        } catch {
          // Non-fatal if pre-warm fails
        }

        // Then start background precaching of common words
        preCacheCommonWords(voice, speed).catch(() => {});
      }
      break;
    }

    case 'SPEAK': {
      if (!tts) {
        post({ type: 'SPEAK_ERROR', id: msg.id, error: 'Model not loaded' });
        return;
      }
      // Pause any background precaching so this request gets priority
      precachePaused = true;
      const ck = cacheKey(msg.voice, msg.speed, msg.text);
      try {
        let wav: ArrayBuffer;
        if (audioCache.has(ck)) {
          wav = audioCache.get(ck)!.slice(0);
        } else {
          const audio = await tts.generate(msg.text, {
            voice: msg.voice,
            speed: msg.speed,
          });
          wav = audio.toWav();
          audioCache.set(ck, wav.slice(0));
        }
        post({ type: 'AUDIO_READY', id: msg.id, buffer: wav }, [wav]);
      } catch (err) {
        post({ type: 'SPEAK_ERROR', id: msg.id, error: String(err) });
      }
      break;
    }

    case 'SPEAK_AND_CACHE': {
      if (!tts) return;
      const ck = cacheKey(msg.voice, msg.speed, msg.text);
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

    case 'RECACHE': {
      // Re-run the common-words precache for a new (voice, speed) pair so the
      // first tap at the new rate doesn't pay the full ML inference cost.
      // No-op if the model isn't loaded yet — LOAD handles its own precache.
      if (!tts) break;
      preCacheCommonWords(msg.voice, msg.speed).catch(() => {});
      break;
    }

    case 'LIST_VOICES': {
      if (!tts) return;
      const voices = tts.list_voices();
      post({ type: 'VOICES_LIST', voices });
      break;
    }

    case 'DELETE_MODEL': {
      await deleteModel();
      post({ type: 'MODEL_DELETED' });
      break;
    }
  }
};
