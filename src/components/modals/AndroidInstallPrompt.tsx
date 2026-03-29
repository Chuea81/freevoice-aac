import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AndroidInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const androidInstallDismissed = useSettingsStore((s) => s.androidInstallDismissed);
  const setAndroidInstallDismissed = useSettingsStore((s) => s.setAndroidInstallDismissed);

  useEffect(() => {
    if (androidInstallDismissed) return;

    // Check if device is Android
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = ua.includes('android');
    if (!isAndroid) return;

    // Listen for beforeinstallprompt event (PWA install)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [androidInstallDismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setAndroidInstallDismissed(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setAndroidInstallDismissed(true);
  };

  if (!visible || !deferredPrompt) return null;

  return (
    <div className="android-install-banner">
      <div className="android-install-content">
        <span className="android-install-icon">📱</span>
        <div className="android-install-text">
          <strong>Install FreeVoice as an app</strong>
          <span className="android-install-sub">
            Works offline and loads faster. Add to home screen in one tap.
          </span>
        </div>
      </div>
      <div className="android-install-actions">
        <button className="android-install-btn primary" onClick={handleInstall}>
          Install App
        </button>
        <button className="android-install-btn dismiss" onClick={handleDismiss}>
          Not Now
        </button>
      </div>
    </div>
  );
}
