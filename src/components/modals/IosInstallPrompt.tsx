import { useState, useEffect, useCallback } from 'react';

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches;
}

const STORAGE_KEY = 'fv_ios_prompt';

export function IosInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on iOS Safari, not if already installed (PRD 6.3)
    if (!isIosSafari() || isStandalone()) return;

    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"sessions":0,"dismissed":false}');
    if (data.dismissed) return;

    data.sessions = (data.sessions || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // Show after 2 sessions (PRD 6.3)
    if (data.sessions >= 2) {
      setShow(true);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setShow(false);
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data.dismissed = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  if (!show) return null;

  return (
    <div className="ios-install-banner">
      <div className="ios-install-content">
        <span className="ios-install-icon">📲</span>
        <div className="ios-install-text">
          <strong>Add FreeVoice to Home Screen</strong>
          <span className="ios-install-sub">
            Tap <span className="ios-share-icon">⎙</span> then "Add to Home Screen" for the best experience
          </span>
        </div>
      </div>
      <button className="ios-install-close" onClick={handleDismiss}>✕</button>
    </div>
  );
}
