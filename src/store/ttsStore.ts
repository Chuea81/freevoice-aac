import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VoiceTier = 'kokoro' | 'personal' | 'webspeech';

export type KokoroVoice =
  | 'af_heart'    // Warm, gentle American female — DEFAULT for AAC
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
  kokoroProgress: number; // 0-100
  kokoroError: string | null;
  kokoroDeclined: boolean; // User said "not now" to download prompt
  kokoroDownloaded: boolean; // Model was successfully downloaded (persisted)
  kokoroDevice: 'webgpu' | 'wasm' | null; // Which device loaded
  kokoroLoadingFromCache: boolean; // True when reloading cached model (not fresh download)

  // Voice selection
  activeTier: VoiceTier;
  kokoroVoice: KokoroVoice;
  webSpeechVoiceURI: string | null; // null = use best available
  personalVoiceAvailable: boolean;

  // Settings
  speechRate: number;   // 0.5-1.5, default 0.9
  speechPitch: number;  // 0.5-2.0, default 1.1
  speechVolume: number; // 0-1, default 1.0

  // Actions
  setKokoroStatus: (status: TTSState['kokoroStatus']) => void;
  setKokoroProgress: (p: number) => void;
  setKokoroError: (e: string | null) => void;
  setKokoroDeclined: (v: boolean) => void;
  setKokoroDownloaded: (v: boolean) => void;
  setKokoroDevice: (d: 'webgpu' | 'wasm') => void;
  setKokoroLoadingFromCache: (v: boolean) => void;
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
      kokoroDownloaded: false,
      kokoroDevice: null,
      kokoroLoadingFromCache: false,
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
      setKokoroDownloaded: (v) => set({ kokoroDownloaded: v }),
      setKokoroDevice: (d) => set({ kokoroDevice: d }),
      setKokoroLoadingFromCache: (v) => set({ kokoroLoadingFromCache: v }),
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
        kokoroDownloaded: s.kokoroDownloaded,
        speechRate: s.speechRate,
        speechPitch: s.speechPitch,
        speechVolume: s.speechVolume,
      }),
    }
  )
);
