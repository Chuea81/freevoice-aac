import { useEffect, useState, useCallback } from 'react';
import { useTTSStore, type KokoroVoice } from '../../store/ttsStore';
import { classifyWebSpeechVoices } from '../../utils/voiceDetection';
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
    activeTier, setActiveTier,
    kokoroStatus, kokoroVoice, setKokoroVoice,
    kokoroDevice,
    webSpeechVoiceURI, setWebSpeechVoiceURI,
    personalVoiceAvailable, setPersonalVoiceAvailable,
    speechRate, setSpeechRate,
    speechPitch, setSpeechPitch,
    speechVolume, setSpeechVolume,
  } = useTTSStore();

  const { speak, downloadKokoro, cancel } = useTTS();
  const [webVoices, setWebVoices] = useState<ReturnType<typeof classifyWebSpeechVoices>>([]);

  // Preview voice on selection — like picking an alarm sound
  const previewVoice = useCallback((delay = 100) => {
    cancel();
    setTimeout(() => speak(PREVIEW_PHRASE), delay);
  }, [speak, cancel]);

  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      const classified = classifyWebSpeechVoices(voices);
      setWebVoices(classified);
      setPersonalVoiceAvailable(classified.some((v) => v.tier === 'personal'));
    };
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, [setPersonalVoiceAvailable]);

  return (
    <div className="voice-selector">

      {/* ── TIER 1: Kokoro AI Voices ── */}
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
          {kokoroStatus === 'idle' && (
            <button className="voice-download-pill" onClick={downloadKokoro}>
              Download Free (80MB)
            </button>
          )}
          {kokoroStatus === 'downloading' && (
            <span className="voice-status downloading">Downloading…</span>
          )}
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
                onClick={() => { setKokoroVoice(v.id); setActiveTier('kokoro'); previewVoice(200); }}
                className={`voice-option${activeTier === 'kokoro' && kokoroVoice === v.id ? ' active' : ''}`}
              >
                <div className="voice-option-name">{v.label}</div>
                <div className="voice-option-desc">{v.description}</div>
              </button>
            ))}
          </div>
        ) : (
          <p className="voice-placeholder">
            Download the AI voice model to unlock natural, human-sounding voices.
            Works offline after download. Free forever.
          </p>
        )}
      </section>

      {/* ── TIER 2: Personal Voice (iOS 17+ only) ── */}
      {personalVoiceAvailable && (
        <section className="settings-section">
          <h2 className="settings-section-title">⭐ Your Personal Voice</h2>
          {webVoices
            .filter((v) => v.tier === 'personal')
            .map((v) => (
              <button
                key={v.voice.voiceURI}
                onClick={() => {
                  setWebSpeechVoiceURI(v.voice.voiceURI);
                  setActiveTier('personal');
                  previewVoice();
                }}
                className={`voice-option wide${activeTier === 'personal' ? ' active' : ''}`}
              >
                <div className="voice-option-name">{v.label}</div>
                <div className="voice-option-desc">{v.description}</div>
              </button>
            ))}
        </section>
      )}

      {/* ── TIER 3: Web Speech / Device Voices ── */}
      <section className="settings-section">
        <h2 className="settings-section-title">Device Voices</h2>
        <div className="voice-list">
          {webVoices
            .filter((v) => v.tier !== 'personal')
            .map((v) => (
              <button
                key={v.voice.voiceURI}
                onClick={() => {
                  setWebSpeechVoiceURI(v.voice.voiceURI);
                  setActiveTier('webspeech');
                  previewVoice();
                }}
                className={`voice-option wide${activeTier === 'webspeech' && webSpeechVoiceURI === v.voice.voiceURI ? ' active' : ''}`}
              >
                <div className="voice-option-name">{v.label}</div>
                <div className="voice-option-desc">{v.description}</div>
              </button>
            ))}
          {webVoices.filter((v) => v.tier !== 'personal').length === 0 && (
            <p className="voice-placeholder">No English device voices found.</p>
          )}
        </div>
      </section>

      {/* ── Speech Controls ── */}
      <section className="settings-section">
        <h2 className="settings-section-title">Speech Settings</h2>
        <div className="settings-row">
          <label>Speed: {speechRate.toFixed(2)}×</label>
          <input type="range" min="0.5" max="1.5" step="0.05" value={speechRate} onChange={(e) => setSpeechRate(parseFloat(e.target.value))} />
        </div>
        <div className="settings-row">
          <label>Pitch: {speechPitch.toFixed(2)}</label>
          <input type="range" min="0.5" max="2.0" step="0.05" value={speechPitch} onChange={(e) => setSpeechPitch(parseFloat(e.target.value))} />
        </div>
        <div className="settings-row">
          <label>Volume: {speechVolume.toFixed(2)}</label>
          <input type="range" min="0" max="1" step="0.05" value={speechVolume} onChange={(e) => setSpeechVolume(parseFloat(e.target.value))} />
        </div>
      </section>

      {/* ── Test Button ── */}
      <button
        className="voice-test-btn"
        onClick={() => speak('I want to go to the park please')}
      >
        🔊 Test Voice
      </button>
    </div>
  );
}
