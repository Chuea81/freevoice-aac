# FreeVoice AAC — TTS Voice System Implementation
## Claude Code Prompt

---

Read `freevoice-prd.md` before starting. This prompt implements and replaces the TTS section of that PRD entirely. Everything here supersedes the original single-tier Web Speech API spec.

---

## What You Are Building

A three-tier voice system for FreeVoice AAC. The goal is natural, human-sounding speech at zero cost, working fully offline, on any device. No API keys. No subscriptions. No server calls. Ever.

The three tiers in priority order:

1. **Kokoro** — AI voice model runs 100% in the browser via WebAssembly. Natural, warm, human-sounding. ~80MB one-time download then permanently cached and offline. Apache 2.0 licensed.
2. **Apple Personal Voice** — If the user is on iOS 17+ and has set up Personal Voice in their device settings, it appears in the Web Speech API voice list automatically. We detect and surface it.
3. **Web Speech API** — The browser's built-in TTS. Zero download, works instantly on first load. Quality varies by device (excellent on iPad with Siri voices, robotic on older Android). Always-present fallback.

---

## File Structure for This Feature

```
src/
├── workers/
│   └── tts.worker.ts          # Kokoro runs here — never on main thread
├── hooks/
│   └── useTTS.ts              # Unified TTS hook — all three tiers
├── utils/
│   └── voiceDetection.ts      # Detects Personal Voice, classifies Web Speech voices
├── components/
│   └── VoiceSelector/
│       ├── VoiceSelector.tsx  # Settings UI for picking voice
│       └── VoiceDownloadPrompt.tsx  # First-run Kokoro download prompt
└── store/
    └── ttsStore.ts            # Voice preference, Kokoro load state
```

---

## Implementation Spec

### 1. Install Dependencies

```bash
npm install kokoro-js
```

`kokoro-js` is the official JavaScript library for the Kokoro-82M ONNX model. It handles model loading, phonemization, inference, and audio output. Apache 2.0 license.

---

### 2. `src/workers/tts.worker.ts`

Kokoro inference MUST run in a Web Worker. It blocks the JS thread during synthesis — running it on the main thread freezes the UI mid-tap, which is catastrophic for an AAC app where every tap must feel instant.

```typescript
import { KokoroTTS } from 'kokoro-js';

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

let tts: KokoroTTS | null = null;
let loadingPromise: Promise<void> | null = null;

type WorkerMessage =
  | { type: 'LOAD'; dtype?: string }
  | { type: 'SPEAK'; text: string; voice: string; speed: number; id: string }
  | { type: 'LIST_VOICES' };

type WorkerResponse =
  | { type: 'LOAD_PROGRESS'; progress: number; status: string }
  | { type: 'LOAD_COMPLETE' }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'AUDIO_READY'; id: string; buffer: ArrayBuffer }
  | { type: 'SPEAK_ERROR'; id: string; error: string }
  | { type: 'VOICES_LIST'; voices: string[] };

async function loadModel(dtype = 'q8') {
  if (tts) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      tts = await KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: dtype as 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16',
        device: 'wasm',
        progress_callback: (progress: { status: string; progress?: number }) => {
          self.postMessage({
            type: 'LOAD_PROGRESS',
            progress: progress.progress ?? 0,
            status: progress.status,
          } satisfies WorkerResponse);
        },
      });
      self.postMessage({ type: 'LOAD_COMPLETE' } satisfies WorkerResponse);
    } catch (err) {
      self.postMessage({
        type: 'LOAD_ERROR',
        error: String(err),
      } satisfies WorkerResponse);
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'LOAD': {
      await loadModel(msg.dtype);
      break;
    }

    case 'SPEAK': {
      if (!tts) {
        self.postMessage({
          type: 'SPEAK_ERROR',
          id: msg.id,
          error: 'Model not loaded',
        } satisfies WorkerResponse);
        return;
      }
      try {
        const audio = await tts.generate(msg.text, {
          voice: msg.voice,
          speed: msg.speed,
        });
        // Convert to WAV ArrayBuffer for transfer back to main thread
        const wav = audio.toWav();
        self.postMessage(
          { type: 'AUDIO_READY', id: msg.id, buffer: wav } satisfies WorkerResponse,
          [wav] // Transfer ownership — zero copy
        );
      } catch (err) {
        self.postMessage({
          type: 'SPEAK_ERROR',
          id: msg.id,
          error: String(err),
        } satisfies WorkerResponse);
      }
      break;
    }

    case 'LIST_VOICES': {
      if (!tts) return;
      const voices = tts.list_voices();
      self.postMessage({ type: 'VOICES_LIST', voices } satisfies WorkerResponse);
      break;
    }
  }
};
```

---

### 3. `src/store/ttsStore.ts`

Zustand store. Tracks Kokoro load state, active voice tier, and voice preference.

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VoiceTier = 'kokoro' | 'personal' | 'webspeech';

export type KokoroVoice =
  | 'af_heart'    // Warm, gentle American female — RECOMMENDED DEFAULT for AAC
  | 'af_bella'    // Bright, clear American female
  | 'af_sky'      // Soft, airy American female
  | 'af_sarah'    // Natural American female
  | 'af_nicole'   // Calm American female
  | 'af_nova'     // Energetic American female
  | 'am_adam'     // Warm American male
  | 'am_michael'  // Deep American male
  | 'bf_emma'     // Clear British female
  | 'bm_george';  // Warm British male

export interface TTSState {
  // Kokoro model state
  kokoroStatus: 'idle' | 'downloading' | 'ready' | 'error';
  kokoroProgress: number; // 0–100
  kokoroError: string | null;
  kokoroDeclined: boolean; // User said "not now" to download prompt

  // Voice selection
  activeTier: VoiceTier;
  kokoroVoice: KokoroVoice;
  webSpeechVoiceURI: string | null; // null = use best available
  personalVoiceAvailable: boolean;

  // Settings
  speechRate: number;   // 0.5–1.5, default 0.9
  speechPitch: number;  // 0.5–2.0, default 1.1
  speechVolume: number; // 0–1, default 1.0

  // Actions
  setKokoroStatus: (status: TTSState['kokoroStatus']) => void;
  setKokoroProgress: (p: number) => void;
  setKokoroError: (e: string | null) => void;
  setKokoroDeclined: (v: boolean) => void;
  setActiveTier: (tier: VoiceTier) => void;
  setKokoroVoice: (voice: KokoroVoice) => void;
  setWebSpeechVoiceURI: (uri: string | null) => void;
  setPersonalVoiceAvailable: (v: boolean) => void;
  setSpeechRate: (r: number) => void;
  setSpeechPitch: (p: number) => void;
  setSpeechVolume: (v: number) => void;
}

export const useTTSStore = create<TTSState>()(
  persist(
    (set) => ({
      kokoroStatus: 'idle',
      kokoroProgress: 0,
      kokoroError: null,
      kokoroDeclined: false,
      activeTier: 'webspeech', // Start on Web Speech; upgrade to Kokoro after download
      kokoroVoice: 'af_heart', // Warmest, most natural — best default for a child's AAC
      webSpeechVoiceURI: null,
      personalVoiceAvailable: false,
      speechRate: 0.9,
      speechPitch: 1.1,
      speechVolume: 1.0,

      setKokoroStatus: (status) => set({ kokoroStatus: status }),
      setKokoroProgress: (p) => set({ kokoroProgress: p }),
      setKokoroError: (e) => set({ kokoroError: e }),
      setKokoroDeclined: (v) => set({ kokoroDeclined: v }),
      setActiveTier: (tier) => set({ activeTier: tier }),
      setKokoroVoice: (voice) => set({ kokoroVoice: voice }),
      setWebSpeechVoiceURI: (uri) => set({ webSpeechVoiceURI: uri }),
      setPersonalVoiceAvailable: (v) => set({ personalVoiceAvailable: v }),
      setSpeechRate: (r) => set({ speechRate: r }),
      setSpeechPitch: (p) => set({ speechPitch: p }),
      setSpeechVolume: (v) => set({ speechVolume: v }),
    }),
    {
      name: 'freevoice-tts',
      // Don't persist runtime state
      partialize: (s) => ({
        activeTier: s.activeTier,
        kokoroVoice: s.kokoroVoice,
        webSpeechVoiceURI: s.webSpeechVoiceURI,
        kokoroDeclined: s.kokoroDeclined,
        speechRate: s.speechRate,
        speechPitch: s.speechPitch,
        speechVolume: s.speechVolume,
      }),
    }
  )
);
```

---

### 4. `src/utils/voiceDetection.ts`

Detects Apple Personal Voice and classifies Web Speech voices into quality tiers.

```typescript
/**
 * Apple Personal Voice appears in speechSynthesis.getVoices() on iOS 17+.
 * It's identified by name containing "Personal Voice" or voiceURI matching
 * the personal voice pattern. We detect it and surface it prominently.
 */
export function detectPersonalVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return voices.find(
    (v) =>
      v.name.toLowerCase().includes('personal voice') ||
      v.voiceURI.toLowerCase().includes('personal') ||
      // Some iOS versions use this pattern
      v.name.toLowerCase().includes('personalvoice')
  ) ?? null;
}

/**
 * iOS Siri voices (the good ones) — clear, warm, natural.
 * These are the voices you hear when Siri speaks.
 */
export function isHighQualityIOSVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  return (
    voice.localService === true &&
    (name.includes('siri') ||
      name.includes('samantha') ||
      name.includes('karen') ||
      name.includes('daniel') ||
      name.includes('moira'))
  );
}

export interface ClassifiedVoice {
  voice: SpeechSynthesisVoice;
  tier: 'personal' | 'siri' | 'standard' | 'network';
  label: string;
  description: string;
}

export function classifyWebSpeechVoices(voices: SpeechSynthesisVoice[]): ClassifiedVoice[] {
  return voices
    .filter((v) => v.lang.startsWith('en'))
    .map((v) => {
      const isPersonal = !!detectPersonalVoice([v]);
      const isHighQuality = isHighQualityIOSVoice(v);
      const isNetwork = !v.localService;

      if (isPersonal) {
        return {
          voice: v,
          tier: 'personal' as const,
          label: '⭐ Your Personal Voice',
          description: 'Your own voice, recorded in Accessibility settings',
        };
      }
      if (isHighQuality) {
        return {
          voice: v,
          tier: 'siri' as const,
          label: v.name,
          description: 'High quality · Works offline',
        };
      }
      if (isNetwork) {
        return {
          voice: v,
          tier: 'network' as const,
          label: v.name,
          description: 'Requires internet connection',
        };
      }
      return {
        voice: v,
        tier: 'standard' as const,
        label: v.name,
        description: 'Built-in · Works offline',
      };
    })
    .sort((a, b) => {
      const order = { personal: 0, siri: 1, standard: 2, network: 3 };
      return order[a.tier] - order[b.tier];
    });
}

/**
 * iOS SpeechSynthesis unlock.
 * CRITICAL: On iOS, Web Speech API is locked until a user gesture fires.
 * Call this on the first touchstart event or speech will silently fail.
 */
export function unlockIOSSpeech(): void {
  if (typeof window === 'undefined') return;
  const unlock = () => {
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('touchstart', unlock, { once: true });
}
```

---

### 5. `src/hooks/useTTS.ts`

The unified TTS hook. All components call this — they never touch Kokoro or Web Speech directly. This hook picks the right tier, manages the worker, queues requests, and handles fallback.

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { useTTSStore } from '../store/ttsStore';
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
      if (msg.type === 'LOAD_PROGRESS') {
        useTTSStore.getState().setKokoroProgress(Math.round(msg.progress * 100));
      }
      if (msg.type === 'LOAD_COMPLETE') {
        useTTSStore.getState().setKokoroStatus('ready');
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
  const audioBuffer = await audioCtx.decodeAudioData(buffer.slice(0)); // slice = copy
  const source = audioCtx.createBufferSource();
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = volume;
  source.buffer = audioBuffer;
  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  source.start(0);
  return new Promise((resolve) => { source.onended = () => resolve(); });
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
    utterance.onerror = () => resolve(); // Don't reject — always resolve for AAC reliability
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

  // Unlock iOS speech synthesis on mount
  useEffect(() => {
    unlockIOSSpeech();
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;

    // Tier 1: Kokoro (best quality)
    if (activeTier === 'kokoro' && kokoroStatus === 'ready') {
      const id = String(++callbackIdCounter);
      const w = getWorker();

      return new Promise((resolve) => {
        pendingCallbacks.set(id, async (buffer) => {
          try {
            await playArrayBuffer(buffer, speechVolume);
          } catch {
            // AudioContext failed — fall through to Web Speech
            await speakWithWebSpeech(text, webSpeechVoiceURI, speechRate, speechPitch, speechVolume);
          }
          resolve();
        });

        w.postMessage({
          type: 'SPEAK',
          text,
          voice: kokoroVoice,
          speed: speechRate,
          id,
        });
      });
    }

    // Tier 2 & 3: Web Speech API (Personal Voice or standard)
    // Both surface through the same API — voice selection handles the distinction
    return speakWithWebSpeech(text, webSpeechVoiceURI, speechRate, speechPitch, speechVolume);
  }, [activeTier, kokoroStatus, kokoroVoice, webSpeechVoiceURI, speechRate, speechPitch, speechVolume]);

  const downloadKokoro = useCallback(() => {
    useTTSStore.getState().setKokoroStatus('downloading');
    useTTSStore.getState().setKokoroDeclined(false);
    getWorker().postMessage({ type: 'LOAD', dtype: 'q8' });
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
    // Note: Can't cancel mid-word in Kokoro — it synthesizes whole phrases.
    // For AAC single-word taps this is fine.
  }, []);

  return { speak, downloadKokoro, cancel };
}
```

---

### 6. `src/components/VoiceDownloadPrompt/VoiceDownloadPrompt.tsx`

First-run prompt. Shown once after the app loads, asking if the user wants to download the AI voice model. Non-blocking — the app works fine without it.

```tsx
import { useTTSStore } from '../../store/ttsStore';
import { useTTS } from '../../hooks/useTTS';

export function VoiceDownloadPrompt() {
  const { kokoroStatus, kokoroDeclined, kokoroProgress, setKokoroDeclined } = useTTSStore();
  const { downloadKokoro } = useTTS();

  // Only show if: idle (never downloaded) AND user hasn't declined
  if (kokoroStatus !== 'idle' || kokoroDeclined) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border-2 border-amber-200 p-4">
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0">🎙️</span>
        <div className="flex-1">
          <p className="font-black text-navy-900 text-base leading-tight mb-1">
            Better voices available
          </p>
          <p className="text-sm text-gray-500 leading-snug mb-3">
            Download natural AI voices (80MB, one time, then works offline forever).
            The app works right now without this.
          </p>
          <div className="flex gap-2">
            <button
              onClick={downloadKokoro}
              className="flex-1 bg-amber-400 text-navy-900 font-black text-sm py-2 px-4 rounded-xl"
            >
              Download Free Voices
            </button>
            <button
              onClick={() => setKokoroDeclined(true)}
              className="text-gray-400 font-bold text-sm py-2 px-3 rounded-xl"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function KokoroDownloadProgress() {
  const { kokoroStatus, kokoroProgress } = useTTSStore();
  if (kokoroStatus !== 'downloading') return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border-2 border-sky-200 p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⬇️</span>
        <div className="flex-1">
          <p className="font-black text-sm mb-2">Downloading AI voices… {kokoroProgress}%</p>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-sky-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${kokoroProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">One time only · Works offline after this</p>
        </div>
      </div>
    </div>
  );
}
```

---

### 7. `src/components/VoiceSelector/VoiceSelector.tsx`

Settings UI for choosing voice. Shows all three tiers clearly labeled.

```tsx
import { useEffect, useState } from 'react';
import { useTTSStore, KokoroVoice } from '../../store/ttsStore';
import { classifyWebSpeechVoices } from '../../utils/voiceDetection';
import { useTTS } from '../../hooks/useTTS';

const KOKORO_VOICES: Array<{ id: KokoroVoice; label: string; description: string }> = [
  { id: 'af_heart',   label: 'Heart',   description: 'Warm · American Female · Recommended' },
  { id: 'af_bella',   label: 'Bella',   description: 'Bright · American Female' },
  { id: 'af_sky',     label: 'Sky',     description: 'Soft · American Female' },
  { id: 'af_sarah',   label: 'Sarah',   description: 'Natural · American Female' },
  { id: 'af_nicole',  label: 'Nicole',  description: 'Calm · American Female' },
  { id: 'am_adam',    label: 'Adam',    description: 'Warm · American Male' },
  { id: 'am_michael', label: 'Michael', description: 'Deep · American Male' },
  { id: 'bf_emma',    label: 'Emma',    description: 'Clear · British Female' },
  { id: 'bm_george',  label: 'George',  description: 'Warm · British Male' },
];

export function VoiceSelector() {
  const {
    activeTier, setActiveTier,
    kokoroStatus, kokoroVoice, setKokoroVoice,
    webSpeechVoiceURI, setWebSpeechVoiceURI,
    personalVoiceAvailable, setPersonalVoiceAvailable,
    speechRate, setSpeechRate,
    speechPitch, setSpeechPitch,
    speechVolume, setSpeechVolume,
  } = useTTSStore();

  const { speak, downloadKokoro } = useTTS();
  const [webVoices, setWebVoices] = useState<ReturnType<typeof classifyWebSpeechVoices>>([]);

  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      const classified = classifyWebSpeechVoices(voices);
      setWebVoices(classified);
      setPersonalVoiceAvailable(classified.some((v) => v.tier === 'personal'));
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  return (
    <div className="space-y-6 p-4">

      {/* TIER 1: Kokoro AI Voices */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-navy-900">🤖 AI Voices (Best Quality)</h3>
          {kokoroStatus === 'idle' && (
            <button
              onClick={downloadKokoro}
              className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full"
            >
              Download Free (80MB)
            </button>
          )}
          {kokoroStatus === 'downloading' && (
            <span className="text-xs text-sky-600 font-bold">Downloading…</span>
          )}
          {kokoroStatus === 'ready' && (
            <span className="text-xs text-green-600 font-bold">✓ Ready · Offline</span>
          )}
        </div>

        {kokoroStatus === 'ready' ? (
          <div className="grid grid-cols-2 gap-2">
            {KOKORO_VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => { setKokoroVoice(v.id); setActiveTier('kokoro'); }}
                className={`p-3 rounded-xl text-left border-2 transition-all ${
                  activeTier === 'kokoro' && kokoroVoice === v.id
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="font-black text-sm text-navy-900">{v.label}</div>
                <div className="text-xs text-gray-500 leading-tight mt-0.5">{v.description}</div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-3">
            Download the AI voice model to unlock natural, human-sounding voices.
            Works offline after download. Free forever.
          </p>
        )}
      </section>

      {/* TIER 2: Personal Voice (iOS 17+ only) */}
      {personalVoiceAvailable && (
        <section>
          <h3 className="font-black text-navy-900 mb-3">⭐ Your Personal Voice</h3>
          {webVoices
            .filter((v) => v.tier === 'personal')
            .map((v) => (
              <button
                key={v.voice.voiceURI}
                onClick={() => {
                  setWebSpeechVoiceURI(v.voice.voiceURI);
                  setActiveTier('personal');
                }}
                className={`w-full p-3 rounded-xl text-left border-2 transition-all ${
                  activeTier === 'personal'
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="font-black text-sm text-navy-900">{v.label}</div>
                <div className="text-xs text-gray-500">{v.description}</div>
              </button>
            ))}
        </section>
      )}

      {/* TIER 3: Web Speech / System Voices */}
      <section>
        <h3 className="font-black text-navy-900 mb-3">📱 Device Voices</h3>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {webVoices
            .filter((v) => v.tier !== 'personal')
            .map((v) => (
              <button
                key={v.voice.voiceURI}
                onClick={() => {
                  setWebSpeechVoiceURI(v.voice.voiceURI);
                  setActiveTier('webspeech');
                }}
                className={`w-full p-2.5 rounded-xl text-left border transition-all ${
                  activeTier === 'webspeech' && webSpeechVoiceURI === v.voice.voiceURI
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="font-bold text-sm text-navy-900">{v.label}</div>
                <div className="text-xs text-gray-400">{v.description}</div>
              </button>
            ))}
        </div>
      </section>

      {/* Speech controls */}
      <section>
        <h3 className="font-black text-navy-900 mb-3">Speech Settings</h3>
        <div className="space-y-4">
          {[
            { label: 'Speed', value: speechRate, min: 0.5, max: 1.5, step: 0.05, set: setSpeechRate },
            { label: 'Pitch', value: speechPitch, min: 0.5, max: 2.0, step: 0.05, set: setSpeechPitch },
            { label: 'Volume', value: speechVolume, min: 0, max: 1, step: 0.05, set: setSpeechVolume },
          ].map(({ label, value, min, max, step, set }) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-sm">{label}</span>
                <span className="text-sm text-gray-500 font-mono">{value.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={(e) => set(parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Test button */}
      <button
        onClick={() => speak('I want to go to the park please')}
        className="w-full bg-navy-900 text-white font-black py-3 rounded-xl"
      >
        🔊 Test Voice
      </button>

    </div>
  );
}
```

---

### 8. Wire It Into the App

**In `src/App.tsx` (or your root component):**

```tsx
import { VoiceDownloadPrompt, KokoroDownloadProgress } from './components/VoiceDownloadPrompt/VoiceDownloadPrompt';

// Inside JSX, after your main board UI:
<VoiceDownloadPrompt />
<KokoroDownloadProgress />
```

**In your main symbol card tap handler (wherever you currently call TTS):**

```tsx
// Replace any direct speechSynthesis calls with:
const { speak } = useTTS();

// Single word tap:
await speak(symbol.phrase || symbol.label);

// Full sentence from speech bar:
await speak(tokens.map(t => t.text).join(' '));
```

**In Vite config — required for Web Worker bundling:**

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['kokoro-js'], // Don't pre-bundle — it's a worker module
  },
});
```

---

## Kokoro Voice Character Guide

Give Claude Code this context so voice descriptions in the UI are accurate:

| Voice ID | Character | Best for |
|---|---|---|
| `af_heart` | Warm, gentle, empathetic American female | **Default — AAC primary voice** |
| `af_bella` | Bright, clear, upbeat American female | Energetic children |
| `af_sky` | Soft, airy, calm American female | Children who prefer quiet |
| `af_sarah` | Natural, conversational American female | General use |
| `af_nicole` | Calm, measured American female | Children who need slower pace |
| `am_adam` | Warm, friendly American male | Male voice preference |
| `am_michael` | Deep, authoritative American male | Older users |
| `bf_emma` | Clear, articulate British female | UK families |
| `bm_george` | Warm, storytelling British male | UK families |

---

## Critical Implementation Rules

1. **NEVER run Kokoro on the main thread.** It will freeze the UI. Always use the Web Worker.

2. **The iOS silence bug is real.** Call `unlockIOSSpeech()` on first `touchstart` or the first speak call will silently do nothing. This is already in `voiceDetection.ts` — make sure `useTTS` calls it on mount.

3. **`q8` is the right dtype.** `fp32` is 300MB+. `q4` degrades quality noticeably. `q8` is ~80MB and sounds nearly identical to `fp32` for short phrases.

4. **Don't show the download prompt immediately on load.** Wait 3 seconds after first render so it doesn't compete with the board loading. Use a `setTimeout` in the component.

5. **Transfer ownership of the audio buffer** using the `Transferable` parameter in `postMessage`. The worker spec shows this: `[wav]` as the second argument. Without this, the buffer is copied (slow) instead of moved (zero-cost).

6. **Always resolve, never reject, in the `speak` function.** An AAC app cannot have speech silently fail. If Kokoro errors, fall back to Web Speech. If Web Speech errors, resolve anyway. Log errors but don't throw.

7. **Cancel Web Speech before speaking.** `window.speechSynthesis.cancel()` before each new utterance — otherwise queued utterances pile up on rapid taps.

8. **Preload Personal Voice detection on app mount**, not just in the Settings screen. Update `personalVoiceAvailable` in the store so the settings badge shows correctly everywhere.

---

## What NOT to Do

- Do NOT use any cloud TTS API (ElevenLabs, OpenAI, Google Cloud, AWS Polly, etc.). All require API keys, all have costs, all require internet.
- Do NOT use any service that requires user account creation.
- Do NOT use `dtype: 'fp32'` — it downloads 300MB+ and provides no audible benefit for short phrases.
- Do NOT run Kokoro synthesis on the main thread.
- Do NOT use the network tier Web Speech voices as the default — they require internet and will fail offline.
- Do NOT show the Kokoro download prompt if `kokoroDeclined` is true in the store (user already said no).

---

## Testing Checklist

After implementation, verify:

- [ ] Web Speech speaks immediately on first load, before Kokoro is downloaded
- [ ] Kokoro download prompt appears ~3 seconds after first launch (not before)
- [ ] Download progress bar shows 0–100%
- [ ] After download, active tier switches to Kokoro automatically
- [ ] `af_heart` voice sounds natural and warm on a single word tap ("Apple")
- [ ] Full sentence speaks correctly ("I want to go to the park please")
- [ ] App works fully offline after Kokoro is downloaded (airplane mode test)
- [ ] If Kokoro synthesis errors, Web Speech fallback kicks in silently
- [ ] iOS: first tap speaks correctly (iOS unlock working)
- [ ] iOS 17+: Personal Voice appears in voice selector if set up
- [ ] "Not Now" on download prompt stores `kokoroDeclined: true` — prompt never shows again
- [ ] Voice selection persists across app restarts (Zustand persist working)
- [ ] Rate/pitch/volume sliders affect speech correctly for both tiers
- [ ] Cancel (CLEAR button hold) stops current speech
- [ ] Rapid tapping multiple symbols doesn't pile up speech queue
- [ ] Web Worker doesn't cause build warnings (check vite.config.ts worker settings)

---

*FreeVoice AAC · Shellcraft Labs LLC · Free voices for every child, forever.*
