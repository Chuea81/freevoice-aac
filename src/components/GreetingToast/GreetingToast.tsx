import { useEffect, useState } from 'react';
import { useUserProfileStore } from '../../store/userProfileStore';

const SHOW_DURATION_MS = 2800;
const FADE_DURATION_MS = 400;

// Module-level — survives component remounts within a single page load,
// so navigating Board ↔ Profile ↔ ParentMode doesn't replay the greeting.
let alreadyShown = false;

export function GreetingToast() {
  const loaded = useUserProfileStore((s) => s.loaded);
  const preferredName = useUserProfileStore((s) => s.profile.preferredName.trim());
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!loaded || alreadyShown) return;
    alreadyShown = true;
    setVisible(true);
    const fadeTimer = window.setTimeout(() => setFading(true), SHOW_DURATION_MS);
    const hideTimer = window.setTimeout(() => setVisible(false), SHOW_DURATION_MS + FADE_DURATION_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [loaded]);

  if (!visible) return null;

  const message = preferredName
    ? `Hi ${preferredName}! 👋`
    : 'Welcome back! 👋';

  return (
    <div
      className={`greeting-toast${fading ? ' fading' : ''}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
