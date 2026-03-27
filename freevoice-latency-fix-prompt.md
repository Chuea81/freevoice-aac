# FreeVoice AAC — TTS Latency Fix
## Claude Code Prompt — Zero-Delay Voice for AAC

---

Read `freevoice-prd.md` before starting. This prompt fixes the 1–2 second
delay between a child tapping a symbol and hearing the voice. That delay is
unacceptable in an AAC app. Every fix here is surgical — logic and worker
files only. Do not touch UI components, stores unrelated to TTS, or any
board/symbol code.

---

## Root Cause

The delay is WASM CPU inference. Each tap triggers:
phonemize → model inference → waveform generation → buffer transfer →
AudioContext decode → playback.

On an iPad CPU via WebAssembly this pipeline takes 800ms–2000ms per word.

Four independent fixes eliminate this. Apply all four.

---

## Fix 1 — WebGPU Device Selection (2–5× faster on iPad)

iPad (Apple Silicon) and all modern devices support WebGPU in Safari 17+
and Chrome 120+. WebGPU offloads inference to the GPU instead of the CPU.
This is the single biggest latency win.

### Current code (wrong):
```typescript
tts = await KokoroTTS.from_pretrained(MODEL_ID, {
  dtype: 'q8',
  device: 'wasm',
});
```

### Replace with:
```typescript
// At top of worker, exported for reuse
async function detectWebGPU(): Promise<boolean> {
  try {
    if (!('gpu' in navigator)) return false;
    const adapter = await (navigator as any).gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

// In loadModel():
const hasWebGPU = await detectWebGPU();
const device = hasWebGPU ? 'webgpu' : 'wasm';
const dtype  = hasWebGPU ? 'fp32'   : 'q8';
// IMPORTANT: Never use q8/q4 with WebGPU — quality degrades badly.
// fp32 with WebGPU is faster AND better quality than q8 with WASM.

tts = await KokoroTTS.from_pretrained(MODEL_ID, {
  dtype: dtype as 'fp32' | 'q8',
  device: device as 'webgpu' | 'wasm',
  progress_callback: (p: any) => {
    self.postMessage({
      type: 'LOAD_PROGRESS',
      progress: p.progress ?? 0,
      status: p.status,
      device, // NEW — tell the UI which device loaded
    });
  },
});

// Include device in LOAD_COMPLETE so UI can display GPU/CPU badge
self.postMessage({ type: 'LOAD_COMPLETE', device });
```

### Update WorkerResponse types:
```typescript
type WorkerResponse =
  | { type: 'LOAD_PROGRESS'; progress: number; status: string; device: string }
  | { type: 'LOAD_COMPLETE'; device: 'webgpu' | 'wasm' }  // ADD device
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'AUDIO_READY'; id: string; buffer: ArrayBuffer }
  | { type: 'AUDIO_CACHED'; text: string; voice: string }  // NEW
  | { type: 'SPEAK_ERROR'; id: string; error: string }
  | { type: 'PRECACHE_COMPLETE' }                          // NEW
  | { type: 'VOICES_LIST'; voices: string[] };
```

### Update ttsStore.ts — add kokoroDevice field:
```typescript
// Add to TTSState interface:
kokoroDevice: 'webgpu' | 'wasm' | null;

// Add to initial state:
kokoroDevice: null,

// Add setter:
setKokoroDevice: (d: 'webgpu' | 'wasm') => set({ kokoroDevice: d }),
```

### Wire it up in useTTS.ts worker message handler:
```typescript
if (msg.type === 'LOAD_COMPLETE') {
  useTTSStore.getState().setKokoroStatus('ready');
  useTTSStore.getState().setKokoroDevice(msg.device);
  useTTSStore.getState().setActiveTier('kokoro');
}
```

---

## Fix 2 — ONNX WASM Threading + SIMD (free win, 2–3× faster on CPU path)

This applies when WebGPU is unavailable (older Android, Firefox).
iPad has 6–10 CPU cores. ONNX Runtime Web uses 1 by default. Fix it.

### Add at the very top of tts.worker.ts, before any other imports:
```typescript
import { env } from 'kokoro-js';

// Enable multi-threading and SIMD before model loads.
// These are safe no-ops if the browser doesn't support them.
// navigator.hardwareConcurrency = number of logical CPU cores.
// Cap at 8 — diminishing returns above that, and some iPads report high counts.
env.backends.onnx.wasm.numThreads = Math.min(navigator.hardwareConcurrency ?? 4, 8);
env.backends.onnx.wasm.simd = true;
```

This must be set BEFORE `KokoroTTS.from_pretrained` is called.
Place it at module level — not inside loadModel() — so it runs immediately
when the worker initializes.

---

## Fix 3 — Audio Cache (eliminates delay entirely after first tap)

Every synthesized word gets cached in the worker as an ArrayBuffer.
Second tap of the same word = zero inference, instant playback.

Pre-cache the most common AAC words immediately after the model loads,
so even the first tap of these words is instant.

### Add to tts.worker.ts:

```typescript
// ── AUDIO CACHE ──────────────────────────────────────────────
// Key format: `${voice}:${text}` — unique per voice + content combination
const audioCache = new Map<string, ArrayBuffer>();

// Words to pre-cache immediately after model loads.
// These are the highest-frequency taps in any AAC session.
const PRECACHE_LIST = [
  // Core words (always visible bar)
  'I', 'want', 'go', 'more', 'stop', 'help', 'no', 'yes', 'done',
  'like', 'not', 'please', 'here', 'good', 'again', 'look', 'big',
  // QuickFires / fast phrases
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

// Called immediately after LOAD_COMPLETE.
// Runs in background — yields between words so SPEAK messages
// can still be handled immediately during pre-caching.
async function preCacheCommonWords(voice: string, speed: number): Promise<void> {
  for (const word of PRECACHE_LIST) {
    const key = `${voice}:${word}`;
    if (audioCache.has(key)) continue; // already cached

    try {
      const audio = await tts!.generate(word, { voice, speed });
      const wav = audio.toWav();
      audioCache.set(key, wav);
      self.postMessage({ type: 'AUDIO_CACHED', text: word, voice });
    } catch {
      // Non-fatal — skip and continue
    }

    // Yield between each word so incoming SPEAK messages aren't blocked
    await new Promise(r => setTimeout(r, 0));
  }
  self.postMessage({ type: 'PRECACHE_COMPLETE' });
}
```

### Update the LOAD message handler to trigger pre-caching:
```typescript
case 'LOAD': {
  await loadModel(msg.dtype);
  // After model loads, start pre-caching in background.
  // Don't await — this runs concurrently with normal use.
  if (tts) {
    const voice = msg.voice ?? 'af_heart';
    const speed = msg.speed ?? 0.9;
    preCacheCommonWords(voice, speed).catch(() => {});
  }
  break;
}
```

### Update LOAD message type to include voice + speed:
```typescript
type WorkerMessage =
  | { type: 'LOAD'; dtype?: string; voice?: string; speed?: number }
  | { type: 'SPEAK'; text: string; voice: string; speed: number; id: string }
  | { type: 'SPEAK_AND_CACHE'; text: string; voice: string; speed: number } // NEW
  | { type: 'CLEAR_CACHE' }  // NEW — called when voice/speed changes
  | { type: 'LIST_VOICES' };
```

### Update the SPEAK handler to check cache first:
```typescript
case 'SPEAK': {
  if (!tts) {
    self.postMessage({
      type: 'SPEAK_ERROR',
      id: msg.id,
      error: 'Model not loaded',
    });
    return;
  }

  const cacheKey = `${msg.voice}:${msg.text}`;

  try {
    let wav: ArrayBuffer;

    if (audioCache.has(cacheKey)) {
      // CACHE HIT — zero inference, instant response
      // .slice(0) copies the buffer so cache entry remains valid
      // after transfer (Transferable takes ownership)
      wav = audioCache.get(cacheKey)!.slice(0);
    } else {
      // CACHE MISS — synthesize and cache for next time
      const audio = await tts.generate(msg.text, {
        voice: msg.voice,
        speed: msg.speed,
      });
      wav = audio.toWav();
      // Cache it — next tap of this symbol is instant
      audioCache.set(cacheKey, wav.slice(0)); // slice = keep a copy in cache
    }

    self.postMessage(
      { type: 'AUDIO_READY', id: msg.id, buffer: wav },
      [wav] // Transfer ownership — zero copy to main thread
    );
  } catch (err) {
    self.postMessage({ type: 'SPEAK_ERROR', id: msg.id, error: String(err) });
  }
  break;
}

// NEW: Synthesize and cache without playing — used for background warming
case 'SPEAK_AND_CACHE': {
  if (!tts) return;
  const cacheKey = `${msg.voice}:${msg.text}`;
  if (audioCache.has(cacheKey)) return; // already cached

  try {
    const audio = await tts.generate(msg.text, {
      voice: msg.voice,
      speed: msg.speed,
    });
    const wav = audio.toWav();
    audioCache.set(cacheKey, wav);
    self.postMessage({ type: 'AUDIO_CACHED', text: msg.text, voice: msg.voice });
  } catch {
    // Non-fatal
  }
  break;
}

// NEW: Clear cache when voice or speed changes
case 'CLEAR_CACHE': {
  audioCache.clear();
  break;
}
```

### Send voice + speed when downloading the model (in useTTS.ts):
```typescript
// In downloadKokoro():
const { kokoroVoice, speechRate } = useTTSStore.getState();
getWorker().postMessage({
  type: 'LOAD',
  dtype: 'q8', // worker will override with fp32 if WebGPU detected
  voice: kokoroVoice,
  speed: speechRate,
});
```

### Clear cache when voice or speed changes (in useTTS.ts or ttsStore.ts):
```typescript
// Watch for voice/speed changes and invalidate cache.
// Add this to the setKokoroVoice and setSpeechRate actions in ttsStore,
// OR subscribe to these in useTTS.ts:

// In useTTS.ts useEffect:
useEffect(() => {
  if (kokoroStatus === 'ready') {
    // Voice changed — clear old cache and re-warm with new voice
    getWorker().postMessage({ type: 'CLEAR_CACHE' });
    getWorker().postMessage({
      type: 'LOAD',
      voice: kokoroVoice,
      speed: speechRate,
    });
  }
}, [kokoroVoice]); // trigger on voice change only, not speed
// Note: Don't clear cache on speed change — it's too disruptive.
// Speed changes are rare; voice changes warrant a fresh cache.
```

---

## Fix 4 — Instant Web Speech Bridge (eliminates perceived delay on first taps)

Even with caching, the very first tap of any uncached symbol still takes
300ms–1000ms. For a child using AAC this is noticeable and frustrating.

The solution: on a cache miss, play Web Speech immediately (it fires in
~50ms) while Kokoro synthesizes and caches in the background. The child
hears something instantly. On the next tap of the same symbol, they hear
the full Kokoro AI quality from cache.

This is the correct mental model for AAC:
- Responsiveness is more important than quality on the first tap
- Quality matters more on every subsequent tap
- Most AAC use is highly repetitive — the same symbols get tapped many times

### Update the speak() function in useTTS.ts:

```typescript
const speak = useCallback(async (text: string): Promise<void> => {
  if (!text.trim()) return;

  const cacheKey = `${kokoroVoice}:${text}`;

  // ── PATH 1: Kokoro ready AND cached — instant, best quality ──
  if (activeTier === 'kokoro' && kokoroStatus === 'ready') {

    // We don't have direct access to the worker's internal cache,
    // so we always send a SPEAK message. The worker returns instantly
    // on a cache hit. On a miss it takes 300ms–1000ms.
    //
    // To bridge that gap on a miss: play Web Speech immediately,
    // then cancel it if/when Kokoro responds quickly.
    // This requires knowing if it was a cache hit or miss.
    // Use a race between a short timeout and the worker response.

    return new Promise<void>((resolve) => {
      let webSpeechPlayed = false;
      let kokoroResponded = false;

      const id = String(++callbackIdCounter);

      // Timeout: if Kokoro hasn't responded in 300ms, it's a cache miss.
      // Play Web Speech immediately as a bridge.
      const bridgeTimer = setTimeout(() => {
        if (!kokoroResponded) {
          webSpeechPlayed = true;
          // Fire Web Speech but don't await — it runs concurrently
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.rate = speechRate;
          u.pitch = speechPitch;
          u.volume = speechVolume;
          if (webSpeechVoiceURI) {
            const voices = window.speechSynthesis.getVoices();
            const match = voices.find(v => v.voiceURI === webSpeechVoiceURI);
            if (match) u.voice = match;
          }
          window.speechSynthesis.speak(u);

          // Also send to worker for background caching (don't play)
          // Worker will cache it so next tap is instant
        }
      }, 300); // 300ms = imperceptibly short to humans, enough for cache hits

      // Register Kokoro callback
      pendingCallbacks.set(id, async (buffer: ArrayBuffer) => {
        kokoroResponded = true;
        clearTimeout(bridgeTimer);

        if (webSpeechPlayed) {
          // Web Speech already started — cancel it and play Kokoro instead
          // Small delay to avoid audio overlap
          window.speechSynthesis.cancel();
          await new Promise(r => setTimeout(r, 50));
        }

        try {
          await playArrayBuffer(buffer, speechVolume);
        } catch {
          // AudioContext failed — Web Speech already played or will play
        }
        resolve();
      });

      getWorker().postMessage({
        type: 'SPEAK',
        text,
        voice: kokoroVoice,
        speed: speechRate,
        id,
      });
    });
  }

  // ── PATH 2: Web Speech only (Kokoro not loaded) ──
  return speakWithWebSpeech(text, webSpeechVoiceURI, speechRate, speechPitch, speechVolume);

}, [activeTier, kokoroStatus, kokoroVoice, webSpeechVoiceURI, speechRate, speechPitch, speechVolume]);
```

### Add speakPreview() for Auditory Touch (speak label on first tap, no cache):
```typescript
// Auditory Touch — fast label preview, always Web Speech (no cache needed)
const speakPreview = useCallback((text: string): void => {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = speechRate * 1.05; // very slightly faster for previews
  u.pitch = speechPitch;
  u.volume = speechVolume * 0.85; // slightly quieter than main speak
  window.speechSynthesis.speak(u);
}, [speechRate, speechPitch, speechVolume]);

// Export from useTTS:
return { speak, speakPreview, downloadKokoro, cancel };
```

---

## GPU/CPU Badge in VoiceSelector UI

After implementing the above, add a small status indicator to VoiceSelector.tsx
in the AI Voices section header. This helps users understand their device's
capability and gives them confidence the system is working optimally.

```tsx
// In VoiceSelector.tsx — update the AI Voices section header:

const { kokoroStatus, kokoroDevice } = useTTSStore();

// In the JSX:
<div className="flex items-center justify-between mb-3">
  <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
    AI Voices
    {kokoroStatus === 'ready' && (
      <span
        className="ml-2 text-xs font-black px-2 py-0.5 rounded-full"
        style={{
          background: kokoroDevice === 'webgpu'
            ? 'rgba(39,174,96,0.15)'
            : 'rgba(255,255,255,0.08)',
          color: kokoroDevice === 'webgpu'
            ? '#86EFAC'
            : 'rgba(255,255,255,0.4)',
          border: `1px solid ${kokoroDevice === 'webgpu'
            ? 'rgba(134,239,172,0.3)'
            : 'rgba(255,255,255,0.1)'}`,
        }}
      >
        {kokoroDevice === 'webgpu' ? '⚡ GPU' : '🔲 CPU'}
      </span>
    )}
  </h3>
  {/* ... rest of header (download button etc.) */}
</div>
```

---

## Files to Modify

```
src/workers/tts.worker.ts     — Fixes 1, 2, 3 (WebGPU, SIMD, cache)
src/hooks/useTTS.ts           — Fix 4 (Web Speech bridge) + downloadKokoro update
src/store/ttsStore.ts         — Add kokoroDevice field + setter
src/components/VoiceSelector/VoiceSelector.tsx  — GPU/CPU badge only
```

**Do not modify:**
- Any board, symbol, or navigation files
- settingsStore.ts
- Dexie schema
- Any component other than VoiceSelector

---

## Testing Checklist

After implementing all four fixes, verify:

**WebGPU (Fix 1)**
- [ ] Console logs which device loaded: "webgpu" or "wasm"
- [ ] VoiceSelector shows "⚡ GPU" badge on iPad (Safari 17+ or Chrome)
- [ ] VoiceSelector shows "🔲 CPU" badge on Firefox (no WebGPU support)
- [ ] Voice quality is good on WebGPU (fp32 dtype — should sound identical to WASM q8)

**Threading (Fix 2)**
- [ ] Console shows numThreads > 1 on multi-core devices
- [ ] No errors thrown on browsers that don't support SIMD

**Cache (Fix 3)**
- [ ] Second tap of any symbol is noticeably faster than first
- [ ] Core words (I, want, go, more, help) play with zero delay
- [ ] QuickFires play with zero delay
- [ ] After changing voice, cache clears and core words re-cache
- [ ] PRECACHE_COMPLETE fires in console after model loads

**Web Speech Bridge (Fix 4)**
- [ ] First tap of any symbol plays audio within ~100ms (Web Speech)
- [ ] Subsequent taps of same symbol play Kokoro AI quality
- [ ] No audio overlap (Web Speech cancels cleanly before Kokoro plays)
- [ ] Sentence speak (SPEAK button) plays from cache for cached words
- [ ] speakPreview() plays a slightly quieter version for Auditory Touch

**Regression — nothing should be broken**
- [ ] Kokoro download prompt still appears after 3 seconds on first launch
- [ ] "Not Now" still persists kokoroDeclined
- [ ] Voice selector still shows all three tiers
- [ ] Rate/pitch/volume sliders still work
- [ ] CLEAR still requires 500ms hold
- [ ] Offline mode: cached words play without any network connection

---

## Expected Latency After All Fixes

| Scenario                          | Before    | After         |
|-----------------------------------|-----------|---------------|
| First tap, uncached word          | 1–2s      | ~100ms (Web Speech bridge) |
| Second tap, any word              | 1–2s      | ~0ms (cache hit) |
| Core words / QuickFires           | 1–2s      | ~0ms (pre-cached) |
| iPad + WebGPU, uncached word      | 1–2s      | ~300ms (GPU inference) |
| iPad + WebGPU, cached word        | 1–2s      | ~0ms |
| Full sentence (all words cached)  | 2–3s      | ~0ms |

---

*FreeVoice AAC · Shellcraft Labs LLC · Every tap should feel instant.*
