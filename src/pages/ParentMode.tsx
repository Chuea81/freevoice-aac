import { useEffect } from 'react';
import { useParentStore } from '../store/parentStore';
import { Settings } from './Settings';
import { PinModal } from '../components/modals/PinModal';

interface Props {
  onBack: () => void;
}

export function ParentMode({ onBack }: Props) {
  const isUnlocked = useParentStore((s) => s.isUnlocked);
  const pinSet = useParentStore((s) => s.pinSet);
  const pinEnabled = useParentStore((s) => s.pinEnabled);
  const checkPinSet = useParentStore((s) => s.checkPinSet);
  const openPinModal = useParentStore((s) => s.openPinModal);

  // Load PIN state from Dexie on mount so we know whether the lock is enabled
  // before we decide to render Settings or prompt for the PIN.
  useEffect(() => {
    checkPinSet();
  }, [checkPinSet]);

  // Settings is open by default. Only prompt for a PIN when the user has
  // explicitly enabled the lock AND actually stored a PIN hash.
  useEffect(() => {
    if (pinEnabled && pinSet && !isUnlocked) {
      openPinModal('unlock');
    }
  }, [pinEnabled, pinSet, isUnlocked, openPinModal]);

  const gated = pinEnabled && pinSet && !isUnlocked;

  return (
    <>
      <PinModal />
      {!gated ? (
        <Settings onBack={onBack} />
      ) : (
        <div className="settings-page">
          <div className="settings-header">
            <button className="settings-back-btn" onClick={onBack}>← Back</button>
            <h1 className="settings-title">Settings</h1>
            <div />
          </div>
          <div className="empty-state" style={{ paddingTop: 80 }}>
            <div className="empty-state-icon">🔒</div>
            <p>Enter PIN to access settings</p>
          </div>
        </div>
      )}
    </>
  );
}
