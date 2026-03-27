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
  const checkPinSet = useParentStore((s) => s.checkPinSet);
  const openPinModal = useParentStore((s) => s.openPinModal);

  // Check if PIN is set on mount
  useEffect(() => {
    checkPinSet();
  }, [checkPinSet]);

  // If PIN not set, prompt to create one (default 1234 with prompt to change — PRD 3.6)
  useEffect(() => {
    if (pinSet === false) {
      // No PIN set yet — open the set PIN modal
      openPinModal('set');
    } else if (pinSet && !isUnlocked) {
      // PIN exists but not unlocked — open the unlock modal
      openPinModal('unlock');
    }
  }, [pinSet, isUnlocked, openPinModal]);

  return (
    <>
      <PinModal />
      {isUnlocked ? (
        <Settings onBack={onBack} />
      ) : (
        <div className="settings-page">
          <div className="settings-header">
            <button className="settings-back-btn" onClick={onBack}>← Back</button>
            <h1 className="settings-title">Parent Mode</h1>
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
