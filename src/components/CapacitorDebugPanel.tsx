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

    // Only show debug panel in Capacitor
    if (!inCapacitor) return;

    // Check Web Audio API availability
    const hasWebAudio = !!(
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: AudioContext }).webkitAudioContext
    );
    setWebAudioAvailable(hasWebAudio);

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

  if (!isCapacitor) {
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

          {/* Instructions */}
          <div className="debug-footer">
            Check Chrome DevTools at chrome://inspect for full logs
          </div>
        </div>
      )}
    </div>
  );
}
