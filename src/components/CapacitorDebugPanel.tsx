import { useState, useEffect } from 'react';
import { useTTSStore } from '../store/ttsStore';
import './CapacitorDebugPanel.css';

/**
 * Debug panel for Capacitor WebView — shows TTS/audio errors on screen
 * Only visible when running inside Capacitor (window.Capacitor !== undefined)
 * Remove before production release
 */
export function CapacitorDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [webAudioAvailable, setWebAudioAvailable] = useState(false);
  const [webSpeechAvailable, setWebSpeechAvailable] = useState(false);
  const [sharedArrayBufferAvailable, setSharedArrayBufferAvailable] = useState(false);
  const [workerStatus, setWorkerStatus] = useState<'unknown' | 'initialized' | 'error'>('unknown');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const {
    kokoroStatus,
    kokoroError,
    kokoroDevice,
    activeTier,
  } = useTTSStore();

  // Check if running in Capacitor and detect capabilities
  useEffect(() => {
    const inCapacitor = (window as unknown as { Capacitor?: object }).Capacitor !== undefined;
    setIsCapacitor(inCapacitor);

    // Show debug panel in Capacitor OR if ?debug query param is set
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true';
    if (!inCapacitor && !debugMode) return;

    // Check Web Audio API availability
    const hasWebAudio = !!(
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: AudioContext }).webkitAudioContext
    );
    setWebAudioAvailable(hasWebAudio);

    // Check Web Speech API availability
    // Note: speechSynthesis might not be initialized until first use
    const hasWebSpeech = !!(
      window.speechSynthesis ||
      (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis
    );
    setWebSpeechAvailable(hasWebSpeech);

    // Check SharedArrayBuffer availability
    const hasSAB = typeof SharedArrayBuffer !== 'undefined';
    setSharedArrayBufferAvailable(hasSAB);

    // Detect worker errors via global error handler
    const handleError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('Worker')) {
        setWorkerStatus('error');
        setErrorMessages((prev) => [
          ...prev.slice(-4), // Keep last 5 errors
          `[Worker Error] ${event.message}`,
        ]);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Update worker status when Kokoro status changes
  useEffect(() => {
    if (kokoroStatus === 'ready') {
      setWorkerStatus('initialized');
    } else if (kokoroStatus === 'error') {
      setWorkerStatus('error');
      if (kokoroError) {
        setErrorMessages((prev) => [
          ...prev.slice(-4),
          `[Kokoro Error] ${kokoroError}`,
        ]);
      }
    }
  }, [kokoroStatus, kokoroError]);

  // Check if we should show the panel
  const showPanel = isCapacitor || (typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === 'true');

  if (!showPanel) {
    return null; // Don't show in browser or production
  }

  return (
    <div className="capacitor-debug-panel">
      {/* Toggle Button */}
      <button
        className="debug-toggle"
        onClick={() => setIsVisible(!isVisible)}
        title="Toggle debug panel"
        aria-label="Toggle Capacitor debug panel"
      >
        {isVisible ? '✕' : '🐛'}
      </button>

      {/* Debug Panel Content */}
      {isVisible && (
        <div className="debug-content">
          <h3>🔧 TTS Debug</h3>

          {/* Web Audio API Status */}
          <div className="debug-item">
            <span className="label">Web Audio:</span>
            <span className={webAudioAvailable ? 'status-ok' : 'status-error'}>
              {webAudioAvailable ? '✓ Available' : '✗ Missing'}
            </span>
          </div>

          {/* Web Speech API Status */}
          <div className="debug-item">
            <span className="label">Web Speech:</span>
            <span className={webSpeechAvailable ? 'status-ok' : 'status-error'}>
              {webSpeechAvailable ? '✓ Available' : '✗ Missing'}
            </span>
          </div>

          {/* SharedArrayBuffer Status */}
          <div className="debug-item">
            <span className="label">SharedArrayBuffer:</span>
            <span className={sharedArrayBufferAvailable ? 'status-ok' : 'status-error'}>
              {sharedArrayBufferAvailable ? '✓ Available' : '✗ Blocked'}
            </span>
          </div>

          {/* Worker Status */}
          <div className="debug-item">
            <span className="label">Worker:</span>
            <span
              className={
                workerStatus === 'initialized'
                  ? 'status-ok'
                  : workerStatus === 'error'
                    ? 'status-error'
                    : 'status-unknown'
              }
            >
              {workerStatus === 'initialized'
                ? '✓ Ready'
                : workerStatus === 'error'
                  ? '✗ Error'
                  : '? Unknown'}
            </span>
          </div>

          {/* Kokoro Status */}
          <div className="debug-item">
            <span className="label">Kokoro:</span>
            <span
              className={
                kokoroStatus === 'ready'
                  ? 'status-ok'
                  : kokoroStatus === 'error'
                    ? 'status-error'
                    : kokoroStatus === 'downloading'
                      ? 'status-loading'
                      : 'status-unknown'
              }
            >
              {kokoroStatus === 'ready'
                ? `✓ Ready (${kokoroDevice})`
                : kokoroStatus === 'downloading'
                  ? '⟳ Downloading'
                  : kokoroStatus === 'error'
                    ? '✗ Error'
                    : '? Idle'}
            </span>
          </div>

          {/* Active Voice Tier */}
          <div className="debug-item">
            <span className="label">Active Tier:</span>
            <span className={activeTier === 'kokoro' ? 'status-ok' : 'status-fallback'}>
              {activeTier === 'kokoro' ? '🎤 Kokoro' : '📱 Device'}
            </span>
          </div>

          {/* Error Log */}
          {errorMessages.length > 0 && (
            <div className="debug-errors">
              <div className="errors-header">Recent Errors:</div>
              <div className="errors-list">
                {errorMessages.map((msg, idx) => (
                  <div key={idx} className="error-item">
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Audio Button */}
          <button
            onClick={() => {
              const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
              const audioCtx = new AudioContextClass();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.frequency.value = 440; // A4 note
              gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
              osc.start(audioCtx.currentTime);
              osc.stop(audioCtx.currentTime + 0.5);
            }}
            style={{
              width: '100%',
              padding: '4px',
              marginTop: '8px',
              marginBottom: '4px',
              backgroundColor: '#f59e0b',
              color: '#0a1628',
              border: 'none',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Test Audio (Beep)
          </button>

          {/* Force Switch to Kokoro Button */}
          {kokoroStatus === 'ready' && activeTier !== 'kokoro' && (
            <button
              onClick={() => {
                useTTSStore.getState().setActiveTier('kokoro');
              }}
              style={{
                width: '100%',
                padding: '4px',
                backgroundColor: '#10b981',
                color: '#0a1628',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Switch to Kokoro ✓
            </button>
          )}

          {/* Device Info */}
          <div className="debug-item" style={{ fontSize: '9px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <span className="label">Android:</span>
            <span style={{ fontSize: '9px', color: '#9ca3af' }}>
              {navigator.userAgent.split('Android ')[1]?.split(';')[0] || 'Unknown'}
            </span>
          </div>

          {/* Instructions */}
          <div className="debug-footer">
            Report: Android version + device model if no sound
          </div>
        </div>
      )}
    </div>
  );
}
