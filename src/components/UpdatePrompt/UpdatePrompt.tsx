import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[FreeVoice] Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('[FreeVoice] Service Worker registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(72px + env(safe-area-inset-bottom) + 12px)',
      left: '12px', right: '12px',
      zIndex: 199,
      background: '#1B2845',
      border: '1px solid rgba(79,195,247,0.3)',
      borderRadius: '16px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <span style={{ fontSize: '24px' }}>✨</span>
      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900, fontSize: '14px',
          color: 'rgba(255,255,255,0.92)', marginBottom: '2px',
        }}>
          Update available
        </p>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700, fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
        }}>
          New symbols and improvements ready
        </p>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: '#4FC3F7', color: '#0C1428',
          border: 'none', borderRadius: '10px',
          padding: '8px 14px',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900, fontSize: '13px',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        Update
      </button>
    </div>
  );
}
