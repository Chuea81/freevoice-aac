import { useCallback, useEffect, useRef } from 'react';
import { useTTSStore, CHILD_VOICE_PRESETS, type KokoroVoice } from '../../store/ttsStore';
import { useTTS } from '../../hooks/useTTS';

const PREVIEW_PHRASE = 'Hi, I want to play outside please';

interface VoiceTile {
  id: KokoroVoice;
  label: string;
  description: string;
}

const AMERICAN_FEMALE: VoiceTile[] = [
  { id: 'af_heart',   label: 'Heart',   description: 'Warm · Recommended' },
  { id: 'af_bella',   label: 'Bella',   description: 'Bright · Premium' },
  { id: 'af_nicole',  label: 'Nicole',  description: 'Calm · ASMR-style' },
  { id: 'af_aoede',   label: 'Aoede',   description: 'Smooth' },
  { id: 'af_kore',    label: 'Kore',    description: 'Clear' },
  { id: 'af_sarah',   label: 'Sarah',   description: 'Natural' },
  { id: 'af_alloy',   label: 'Alloy',   description: 'Bright' },
  { id: 'af_nova',    label: 'Nova',    description: 'Energetic' },
  { id: 'af_sky',     label: 'Sky',     description: 'Soft, airy' },
  { id: 'af_jessica', label: 'Jessica', description: 'Light' },
  { id: 'af_river',   label: 'River',   description: 'Mellow' },
];

const AMERICAN_MALE: VoiceTile[] = [
  { id: 'am_michael', label: 'Michael', description: 'Deep' },
  { id: 'am_adam',    label: 'Adam',    description: 'Warm' },
  { id: 'am_fenrir',  label: 'Fenrir',  description: 'Strong' },
  { id: 'am_puck',    label: 'Puck',    description: 'Energetic' },
  { id: 'am_echo',    label: 'Echo',    description: 'Smooth' },
  { id: 'am_eric',    label: 'Eric',    description: 'Clear' },
  { id: 'am_liam',    label: 'Liam',    description: 'Friendly' },
  { id: 'am_onyx',    label: 'Onyx',    description: 'Resonant' },
];

const BRITISH_FEMALE: VoiceTile[] = [
  { id: 'bf_emma',     label: 'Emma',     description: 'Clear' },
  { id: 'bf_isabella', label: 'Isabella', description: 'Polished' },
  { id: 'bf_alice',    label: 'Alice',    description: 'Soft' },
  { id: 'bf_lily',     label: 'Lily',     description: 'Light' },
];

const BRITISH_MALE: VoiceTile[] = [
  { id: 'bm_george', label: 'George', description: 'Warm' },
  { id: 'bm_fable',  label: 'Fable',  description: 'Narrator' },
  { id: 'bm_daniel', label: 'Daniel', description: 'Friendly' },
  { id: 'bm_lewis',  label: 'Lewis',  description: 'Deep' },
];

export function VoiceSelector() {
  const {
    kokoroStatus, kokoroVoice, setKokoroVoice,
    activeChildPreset, setChildPreset,
    kokoroDevice,
    speechRate, setSpeechRate,
    speechPitch, setSpeechPitch,
    speechVolume, setSpeechVolume,
  } = useTTSStore();

  const { speak, cancel, isSpeaking } = useTTS();

  const handleTestVoice = useCallback(() => {
    cancel();
    speak('I want to go to the park please');
  }, [cancel, speak]);

  const ratePreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pitchPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voicePreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Used after committing a voice/preset to play the just-selected option.
  const previewSelected = useCallback((delay = 100) => {
    cancel();
    if (voicePreviewTimerRef.current) clearTimeout(voicePreviewTimerRef.current);
    voicePreviewTimerRef.current = setTimeout(() => {
      voicePreviewTimerRef.current = null;
      speak(PREVIEW_PHRASE);
    }, delay);
  }, [speak, cancel]);

  // Preview button on each tile — speaks the candidate voice without
  // committing it to the store. For regular voices the user's current pitch
  // and rate are used so the preview reflects what they'd actually hear; for
  // child presets the bundled pitch and rate are used.
  const previewVoiceOverride = useCallback((overrides: { voice: KokoroVoice; pitch?: number; rate?: number }) => {
    cancel();
    if (voicePreviewTimerRef.current) clearTimeout(voicePreviewTimerRef.current);
    voicePreviewTimerRef.current = setTimeout(() => {
      voicePreviewTimerRef.current = null;
      void speak(PREVIEW_PHRASE, overrides);
    }, 80);
  }, [speak, cancel]);

  const handleRateChange = useCallback((value: number) => {
    setSpeechRate(value);
    if (ratePreviewTimerRef.current) clearTimeout(ratePreviewTimerRef.current);
    ratePreviewTimerRef.current = setTimeout(() => {
      ratePreviewTimerRef.current = null;
      cancel();
      speak(PREVIEW_PHRASE);
    }, 350);
  }, [setSpeechRate, speak, cancel]);

  const handlePitchChange = useCallback((value: number) => {
    setSpeechPitch(value);
    if (pitchPreviewTimerRef.current) clearTimeout(pitchPreviewTimerRef.current);
    pitchPreviewTimerRef.current = setTimeout(() => {
      pitchPreviewTimerRef.current = null;
      cancel();
      speak(PREVIEW_PHRASE);
    }, 350);
  }, [setSpeechPitch, speak, cancel]);

  useEffect(() => () => {
    if (ratePreviewTimerRef.current) clearTimeout(ratePreviewTimerRef.current);
    if (pitchPreviewTimerRef.current) clearTimeout(pitchPreviewTimerRef.current);
    if (voicePreviewTimerRef.current) clearTimeout(voicePreviewTimerRef.current);
    cancel();
  }, [cancel]);

  const renderRegularSection = (title: string, voices: VoiceTile[]) => (
    <div className="voice-group">
      <h3 className="voice-group-title">{title}</h3>
      <div className="voice-grid">
        {voices.map((v) => {
          const active = !activeChildPreset && kokoroVoice === v.id;
          return (
            <div key={v.id} className={`voice-option${active ? ' active' : ''}`}>
              <button
                type="button"
                className="voice-option-body"
                onClick={() => { setKokoroVoice(v.id); previewSelected(150); }}
                aria-pressed={active}
                aria-label={`Select ${v.label} voice`}
              >
                <div className="voice-option-name">{v.label}</div>
                <div className="voice-option-desc">{v.description}</div>
              </button>
              <button
                type="button"
                className="voice-preview-btn"
                onClick={(e) => { e.stopPropagation(); previewVoiceOverride({ voice: v.id }); }}
                aria-label={`Preview ${v.label} voice`}
                title={`Preview ${v.label}`}
              >
                ▶
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="voice-selector">

      {/* ── Kokoro AI Voices ── */}
      <section className="settings-section">
        <div className="voice-section-header">
          <h2 className="settings-section-title">
            AI Voices
            {kokoroStatus === 'ready' && kokoroDevice && (
              <span className={`voice-device-badge ${kokoroDevice}`}>
                {kokoroDevice === 'webgpu' ? '⚡ GPU' : '🔲 CPU'}
              </span>
            )}
          </h2>
          {kokoroStatus === 'ready' && (
            <span className="voice-status ready">✓ Ready · Offline</span>
          )}
          {kokoroStatus === 'error' && (
            <span className="voice-status error">✕ Failed</span>
          )}
        </div>

        {kokoroStatus === 'ready' ? (
          <>
            {/* Children's Voices — preset bundles (voice + pitch + rate) */}
            <div className="voice-group voice-group-children">
              <h3 className="voice-group-title">
                <span className="voice-group-emoji" aria-hidden="true">🧒</span>
                Children's Voices
                <span className="voice-group-hint">Pitch &amp; rate tuned for younger sound</span>
              </h3>
              <div className="voice-grid">
                {CHILD_VOICE_PRESETS.map((p) => {
                  const active = activeChildPreset === p.id;
                  return (
                    <div key={p.id} className={`voice-option voice-option-child${active ? ' active' : ''}`}>
                      <button
                        type="button"
                        className="voice-option-body"
                        onClick={() => { setChildPreset(p.id); previewSelected(150); }}
                        aria-pressed={active}
                        aria-label={`Select ${p.label}`}
                      >
                        <div className="voice-option-name">{p.label}</div>
                        <div className="voice-option-desc">{p.description}</div>
                      </button>
                      <button
                        type="button"
                        className="voice-preview-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          previewVoiceOverride({ voice: p.voice, pitch: p.pitch, rate: p.rate });
                        }}
                        aria-label={`Preview ${p.label}`}
                        title={`Preview ${p.label}`}
                      >
                        ▶
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {renderRegularSection('American Female', AMERICAN_FEMALE)}
            {renderRegularSection('American Male', AMERICAN_MALE)}
            {renderRegularSection('British Female', BRITISH_FEMALE)}
            {renderRegularSection('British Male', BRITISH_MALE)}
          </>
        ) : (
          <p className="voice-placeholder">
            Downloading AI voice model…
          </p>
        )}
      </section>

      {/* ── Speech Controls ── */}
      <section className="settings-section">
        <h2 className="settings-section-title">Speech Settings</h2>
        <div className="settings-row">
          <label>Speed: {speechRate.toFixed(2)}×</label>
          <input type="range" min="0.5" max="1.5" step="0.05" value={speechRate} onChange={(e) => handleRateChange(parseFloat(e.target.value))} />
        </div>
        <div className="settings-row">
          <label>Pitch: {speechPitch.toFixed(2)}</label>
          <input type="range" min="0.5" max="2.0" step="0.05" value={speechPitch} onChange={(e) => handlePitchChange(parseFloat(e.target.value))} />
        </div>
        <div className="settings-row">
          <label>Volume: {speechVolume.toFixed(2)}</label>
          <input type="range" min="0" max="1" step="0.05" value={speechVolume} onChange={(e) => setSpeechVolume(parseFloat(e.target.value))} />
        </div>
      </section>

      {/* ── Test Button ── */}
      <button
        className="voice-test-btn"
        onClick={handleTestVoice}
        disabled={isSpeaking}
        aria-busy={isSpeaking}
      >
        {isSpeaking ? '🔊 Playing…' : '🔊 Test Voice'}
      </button>
    </div>
  );
}
