import { useEffect, useState } from 'react';
import { useTTSStore } from '../store/ttsStore';

/**
 * AudioCapabilityWarning - Shows when audio systems are unavailable
 * Appears only in Capacitor WebView when:
 * - Web Speech API is missing
 * - SharedArrayBuffer is blocked
 * Guides user to download Kokoro (the only working solution)
 */
export function AudioCapabilityWarning() {
  const [shouldShow, setShouldShow] = useState(false);
  const { kokoroStatus, activeTier } = useTTSStore();

  useEffect(() => {
    // Check if running in Capacitor
    const isCapacitor = (window as any).Capacitor !== undefined;
    if (!isCapacitor) return;

    // Check if Web Speech is available
    const hasWebSpeech = !!(window.speechSynthesis || (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis);

    // Check if SharedArrayBuffer is available
    const hasSAB = typeof SharedArrayBuffer !== 'undefined';

    // Show warning if both are unavailable AND user hasn't acknowledged it yet
    const warningDismissed = localStorage.getItem('audioWarningDismissed') === 'true';
    if (!hasWebSpeech && !hasSAB && !warningDismissed && kokoroStatus === 'idle') {
      setShouldShow(true);
    }
  }, [kokoroStatus]);

  if (!shouldShow) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: '#0a1628',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '2px solid #f59e0b',
        }}
      >
        <h2 style={{ color: '#f59e0b', marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>
          📢 Download Kokoro Voice
        </h2>

        <p style={{ color: '#ffffff', marginBottom: '12px', lineHeight: '1.6' }}>
          FreeVoice needs an AI voice model to speak. Your device is missing both:
        </p>

        <ul style={{ color: '#fecaca', marginBottom: '16px', paddingLeft: '20px' }}>
          <li>Web Speech API (device voice)</li>
          <li>SharedArrayBuffer (for instant Kokoro loading)</li>
        </ul>

        <p style={{ color: '#ffffff', marginBottom: '12px', lineHeight: '1.6', fontWeight: 'bold' }}>
          ✓ Good news: Kokoro AI voice works great on your device!
        </p>

        <p style={{ color: '#9ca3af', marginBottom: '20px', lineHeight: '1.6', fontSize: '14px' }}>
          First time: Tap the 🐛 debug button → tap "Test Audio (Beep)" → downloads will start automatically.
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              localStorage.setItem('audioWarningDismissed', 'true');
              setShouldShow(false);
            }}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#f59e0b',
              color: '#0a1628',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Got it, download Kokoro
          </button>

          <button
            onClick={() => {
              useTTSStore.getState().downloadKokoro();
              localStorage.setItem('audioWarningDismissed', 'true');
              setShouldShow(false);
            }}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#10b981',
              color: '#0a1628',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Start Download Now
          </button>
        </div>
      </div>
    </div>
  );
}
