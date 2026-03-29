import { useState, useEffect, useCallback } from 'react';
import { useTTSStore } from '../../store/ttsStore';
import { useTTS } from '../../hooks/useTTS';

export function VoiceDownloadPrompt() {
  const { kokoroStatus, kokoroDeclined, kokoroDownloaded } = useTTSStore();
  const setKokoroDeclined = useTTSStore((s) => s.setKokoroDeclined);
  const { downloadKokoro } = useTTS();
  const [visible, setVisible] = useState(false);

  // Don't show if already downloaded (persisted), declined, or currently downloading/ready
  useEffect(() => {
    if (kokoroStatus === 'idle' && !kokoroDeclined && !kokoroDownloaded) {
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [kokoroStatus, kokoroDeclined, kokoroDownloaded]);

  const handleDismiss = useCallback(() => {
    setKokoroDeclined(true);
    setVisible(false);
  }, [setKokoroDeclined]);

  if (!visible || kokoroStatus !== 'idle' || kokoroDeclined || kokoroDownloaded) return null;

  return (
    <div className="voice-download-banner">
      <div className="voice-download-content">
        <span className="voice-download-icon">🎙️</span>
        <div className="voice-download-text">
          <strong>Better voices available</strong>
          <span className="voice-download-sub">
            Download natural AI voices (80MB, one time, then works offline forever).
            The app works right now without this.
          </span>
        </div>
      </div>
      <div className="voice-download-actions">
        <button className="voice-download-btn primary" onClick={downloadKokoro}>
          Download Free Voices
        </button>
        <button className="voice-download-btn dismiss" onClick={handleDismiss}>
          Not Now
        </button>
      </div>
    </div>
  );
}

export function KokoroDownloadProgress() {
  const kokoroStatus = useTTSStore((s) => s.kokoroStatus);
  const kokoroProgress = useTTSStore((s) => s.kokoroProgress);
  const kokoroError = useTTSStore((s) => s.kokoroError);
  const loadingFromCache = useTTSStore((s) => s.kokoroLoadingFromCache);
  const { downloadKokoro } = useTTS();
  const setKokoroDeclined = useTTSStore((s) => s.setKokoroDeclined);
  const [showReady, setShowReady] = useState(false);
  const [prevStatus, setPrevStatus] = useState(kokoroStatus);

  // Show "Ready" indicator briefly when Kokoro finishes loading
  useEffect(() => {
    if (prevStatus === 'downloading' && kokoroStatus === 'ready') {
      setShowReady(true);
      const timer = setTimeout(() => setShowReady(false), 3000);
      return () => clearTimeout(timer);
    }
    setPrevStatus(kokoroStatus);
  }, [kokoroStatus, prevStatus]);

  if (showReady) {
    return (
      <div className="voice-download-banner ready">
        <div className="voice-download-content">
          <span className="voice-download-icon">🎙️</span>
          <div className="voice-download-text">
            <strong>AI voice ready</strong>
          </div>
        </div>
      </div>
    );
  }

  if (kokoroStatus === 'downloading') {
    return (
      <div className="voice-download-banner downloading">
        <div className="voice-download-content">
          <span className="voice-download-icon">{loadingFromCache ? '🎙️' : '⬇️'}</span>
          <div className="voice-download-text">
            <strong>
              {loadingFromCache
                ? 'Loading AI voice…'
                : `Downloading AI voices… ${kokoroProgress}%`}
            </strong>
            {!loadingFromCache && (
              <div className="voice-progress-bar">
                <div
                  className="voice-progress-fill"
                  style={{ width: `${Math.max(kokoroProgress, 2)}%` }}
                />
              </div>
            )}
            <span className="voice-download-sub">
              {loadingFromCache
                ? 'Using device voice until ready'
                : 'One time only · Works offline after this'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (kokoroStatus === 'error') {
    return (
      <div className="voice-download-banner error">
        <div className="voice-download-content">
          <span className="voice-download-icon">⚠️</span>
          <div className="voice-download-text">
            <strong>Voice download failed</strong>
            <span className="voice-download-sub">{kokoroError}</span>
          </div>
        </div>
        <div className="voice-download-actions">
          <button className="voice-download-btn primary" onClick={downloadKokoro}>
            Retry
          </button>
          <button className="voice-download-btn dismiss" onClick={() => setKokoroDeclined(true)}>
            Skip
          </button>
        </div>
      </div>
    );
  }

  return null;
}
