import { useCallback, useEffect, useRef } from 'react';
import { useTTSStore, type KokoroVoice } from '../../store/ttsStore';
import { useTTS } from '../../hooks/useTTS';

const PREVIEW_PHRASE = 'Hi, I want to play outside please';

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
    kokoroStatus, kokoroVoice, setKokoroVoice,
    kokoroDevice,
    speechRate, setSpeechRate,
    speechPitch, setSpeechPitch,
    speechVolume, setSpeechVolume,
  } = useTTSStore();

  const { speak, cancel, isSpeaking } = useTTS();

  // Test Voice routes through the centralized speak() so it honors whichever
  // tier the user has selected — Kokoro uses Kokoro only, Web Speech uses
  // speechSynthesis only, and the two engines never overlap. cancel() is
  // called first so any lingering audio from a previous voice-tile preview
  // (which could still be mid-synthesis on the worker) is stopped before
  // the test fires.
  const handleTestVoice = useCallback(() => {
    cancel();
    speak('I want to go to the park please');
  }, [cancel, speak]);
  // Both preview paths (voice tile click, rate slider drag) defer the actual
  // speak through setTimeout. If the user closes Settings before the timer
  // fires, the deferred speak would play while they're back on the main board
  // — perceived as "random unprompted speech". Track every timer in a ref so
  // we can clear them on unmount.
  const ratePreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pitchPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voicePreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preview voice on selection — like picking an alarm sound
  const previewVoice = useCallback((delay = 100) => {
    cancel();
    if (voicePreviewTimerRef.current) clearTimeout(voicePreviewTimerRef.current);
    voicePreviewTimerRef.current = setTimeout(() => {
      voicePreviewTimerRef.current = null;
      speak(PREVIEW_PHRASE);
    }, delay);
  }, [speak, cancel]);

  // Debounced preview triggered while the speed slider is dragged so the user
  // hears the new rate in real time without a flood of overlapping utterances.
  const handleRateChange = useCallback((value: number) => {
    setSpeechRate(value);
    if (ratePreviewTimerRef.current) clearTimeout(ratePreviewTimerRef.current);
    ratePreviewTimerRef.current = setTimeout(() => {
      ratePreviewTimerRef.current = null;
      cancel();
      speak(PREVIEW_PHRASE);
    }, 350);
  }, [setSpeechRate, speak, cancel]);

  // Same debounced pattern for pitch so the user hears the selected pitch
  // after they settle the slider.
  const handlePitchChange = useCallback((value: number) => {
    setSpeechPitch(value);
    if (pitchPreviewTimerRef.current) clearTimeout(pitchPreviewTimerRef.current);
    pitchPreviewTimerRef.current = setTimeout(() => {
      pitchPreviewTimerRef.current = null;
      cancel();
      speak(PREVIEW_PHRASE);
    }, 350);
  }, [setSpeechPitch, speak, cancel]);

  // Cancel any pending preview + in-flight speech when the Settings panel
  // closes so nothing speaks after the user has navigated away.
  useEffect(() => () => {
    if (ratePreviewTimerRef.current) clearTimeout(ratePreviewTimerRef.current);
    if (pitchPreviewTimerRef.current) clearTimeout(pitchPreviewTimerRef.current);
    if (voicePreviewTimerRef.current) clearTimeout(voicePreviewTimerRef.current);
    cancel();
  }, [cancel]);

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
          <div className="voice-grid">
            {KOKORO_VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => { setKokoroVoice(v.id); previewVoice(200); }}
                className={`voice-option${kokoroVoice === v.id ? ' active' : ''}`}
              >
                <div className="voice-option-name">{v.label}</div>
                <div className="voice-option-desc">{v.description}</div>
              </button>
            ))}
          </div>
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
