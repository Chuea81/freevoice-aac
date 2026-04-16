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
      background: '#FFFFFF',
      border: '1px solid rgba(67,160,71,0.3)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
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
          color: 'rgba(0,0,0,0.87)', marginBottom: '2px',
        }}>
          Update available
        </p>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700, fontSize: '12px',
          color: 'rgba(0,0,0,0.50)',
        }}>
          New symbols and improvements ready
        </p>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: '#43A047', color: 'white',
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
