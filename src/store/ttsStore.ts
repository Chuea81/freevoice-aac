import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VoiceTier = 'kokoro' | 'personal' | 'webspeech';

export type KokoroVoice =
  // American Female
  | 'af_heart' | 'af_bella' | 'af_nicole' | 'af_aoede' | 'af_kore'
  | 'af_sarah' | 'af_alloy' | 'af_nova'   | 'af_sky'   | 'af_jessica' | 'af_river'
  // American Male
  | 'am_michael' | 'am_adam' | 'am_fenrir' | 'am_puck'
  | 'am_echo'    | 'am_eric' | 'am_liam'   | 'am_onyx'
  // British Female
  | 'bf_emma' | 'bf_isabella' | 'bf_alice' | 'bf_lily'
  // British Male
  | 'bm_george' | 'bm_fable' | 'bm_daniel' | 'bm_lewis';

// Children's voice presets — bundle (base voice + pitch + rate) so caregivers
// can pick a "young" voice without manually tuning the sliders. Selecting a
// preset writes all three values into the store; manual fine-tuning of pitch
// or rate afterward is preserved (the preset stays "active" for highlighting),
// but switching to any non-preset voice clears the preset marker.
export interface ChildVoicePreset {
  id: string;
  label: string;
  description: string;
  voice: KokoroVoice;
  pitch: number;
  rate: number;
}

export const CHILD_VOICE_PRESETS: ChildVoicePreset[] = [
  { id: 'child_lily',  label: 'Lily (Child)',  description: 'Bright young girl · American', voice: 'af_alloy', pitch: 1.30, rate: 0.85 },
  { id: 'child_nova',  label: 'Nova (Child)',  description: 'Energetic young girl · American', voice: 'af_nova',  pitch: 1.30, rate: 0.85 },
  { id: 'child_sky',   label: 'Sky (Child)',   description: 'Soft young girl · American',   voice: 'af_sky',   pitch: 1.30, rate: 0.85 },
  { id: 'child_rosie', label: 'Rosie (Child)', description: 'Light young girl · British',   voice: 'bf_lily',  pitch: 1.30, rate: 0.85 },
  { id: 'child_puck',  label: 'Puck (Child)',  description: 'Lively young boy · American',  voice: 'am_puck',  pitch: 1.25, rate: 0.85 },
  { id: 'child_fable', label: 'Fable (Child)', description: 'Storyteller boy · British',    voice: 'bm_fable', pitch: 1.25, rate: 0.85 },
];

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
  activeChildPreset: string | null; // null when no child preset is selected

  // Settings
  speechRate: number;   // 0.5-1.5, default 0.9
  speechPitch: number;  // 0.5-2.0, default 1.1
  speechVolume: number; // 0-1, default 1.0

  // Initialization state (runtime only, not persisted)
  hydrated: boolean; // True when localStorage has been loaded

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
  setChildPreset: (presetId: string) => void;
  setWebSpeechVoiceURI: (uri: string | null) => void;
  setPersonalVoiceAvailable: (v: boolean) => void;
  setSpeechRate: (r: number) => void;
  setSpeechPitch: (p: number) => void;
  setSpeechVolume: (v: number) => void;
  setHydrated: (v: boolean) => void;
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
      activeTier: 'kokoro', // Use Kokoro by default (superior quality, works on all devices)
      kokoroVoice: 'af_heart', // Warmest, most natural — best default for a child's AAC
      webSpeechVoiceURI: null,
      personalVoiceAvailable: false,
      activeChildPreset: null,
      speechRate: 0.9,
      speechPitch: 1.1,
      speechVolume: 1.0,
      hydrated: false,

      setKokoroStatus: (status) => set({ kokoroStatus: status }),
      setKokoroProgress: (p) => set({ kokoroProgress: p }),
      setKokoroError: (e) => set({ kokoroError: e }),
      setKokoroDeclined: (v) => set({ kokoroDeclined: v }),
      setKokoroDownloaded: (v) => set({ kokoroDownloaded: v }),
      setKokoroDevice: (d) => set({ kokoroDevice: d }),
      setKokoroLoadingFromCache: (v) => set({ kokoroLoadingFromCache: v }),
      setActiveTier: (tier) => set({ activeTier: tier }),
      // Direct voice selection clears any active child-preset marker because
      // the user is intentionally leaving the preset's bundled pitch/rate.
      setKokoroVoice: (voice) => set({ kokoroVoice: voice, activeChildPreset: null }),
      setChildPreset: (presetId) => {
        const preset = CHILD_VOICE_PRESETS.find((p) => p.id === presetId);
        if (!preset) return;
        set({
          kokoroVoice: preset.voice,
          speechPitch: preset.pitch,
          speechRate: preset.rate,
          activeChildPreset: preset.id,
        });
      },
      setWebSpeechVoiceURI: (uri) => set({ webSpeechVoiceURI: uri }),
      setPersonalVoiceAvailable: (v) => set({ personalVoiceAvailable: v }),
      setSpeechRate: (r) => set({ speechRate: r }),
      setSpeechPitch: (p) => set({ speechPitch: p }),
      setSpeechVolume: (v) => set({ speechVolume: v }),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: 'freevoice-tts',
      // Don't persist runtime state
      partialize: (s) => ({
        activeTier: s.activeTier,
        kokoroVoice: s.kokoroVoice,
        activeChildPreset: s.activeChildPreset,
        webSpeechVoiceURI: s.webSpeechVoiceURI,
        kokoroDeclined: s.kokoroDeclined,
        kokoroDownloaded: s.kokoroDownloaded,
        speechRate: s.speechRate,
        speechPitch: s.speechPitch,
        speechVolume: s.speechVolume,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);
