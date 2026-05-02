import { useFirstThenStore, type FirstThenSlot, type FirstThenToken } from '../../store/firstThenStore';
import { useCharacterStore } from '../../store/characterStore';
import { useUserProfileStore } from '../../store/userProfileStore';
import { useTouchDelay } from '../../hooks/useTouchDelay';
import { Avatar } from '../Avatar/Avatar';

interface SlotProps {
  label: 'FIRST' | 'THEN';
  slot: FirstThenSlot;
  token: FirstThenToken | null;
  active: boolean;
  onActivate: () => void;
}

function Slot({ label, token, active, onActivate }: SlotProps) {
  const delayProps = useTouchDelay(onActivate);
  const filled = token !== null;
  return (
    <button
      type="button"
      className={`ft-slot${active ? ' ft-slot-active' : ''}${filled ? ' ft-slot-filled' : ''}`}
      {...delayProps}
      aria-label={
        filled
          ? `${label} slot: ${token!.label}. Tap to clear and re-select.`
          : `${label} slot, empty. Tap a symbol to fill.`
      }
    >
      <span className="ft-slot-caption">{label}</span>
      <div className="ft-slot-body">
        {filled ? (
          token!.imageUrl ? (
            <img
              className="ft-slot-image"
              src={token!.imageUrl}
              alt={token!.label}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="ft-slot-emoji" aria-hidden="true">{token!.emoji || '•'}</span>
          )
        ) : (
          <span className="ft-slot-placeholder">Tap a symbol</span>
        )}
      </div>
      {filled && <span className="ft-slot-label">{token!.label}</span>}
    </button>
  );
}

export function FirstThenPanel() {
  const firstSlot = useFirstThenStore((s) => s.firstSlot);
  const thenSlot = useFirstThenStore((s) => s.thenSlot);
  const activeSlot = useFirstThenStore((s) => s.activeSlot);
  const clearSlot = useFirstThenStore((s) => s.clearSlot);
  const setActiveSlot = useFirstThenStore((s) => s.setActiveSlot);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const preferredName = useUserProfileStore((s) => s.profile.preferredName.trim());

  const prompt = preferredName
    ? activeSlot === 'then'
      ? `${preferredName}, what comes next?`
      : `${preferredName}, what do you want first?`
    : null;

  const onFirstTap = () => {
    if (firstSlot) clearSlot('first');
    else setActiveSlot('first');
  };
  const onThenTap = () => {
    if (thenSlot) clearSlot('then');
    else setActiveSlot('then');
  };

  return (
    <div className="first-then-wrap">
      {prompt && (
        <div className="ft-prompt" aria-hidden="true">{prompt}</div>
      )}
    <div
      className="first-then-panel"
      role="group"
      aria-label={prompt ?? 'First, then sentence builder'}
    >
      <Slot
        label="FIRST"
        slot="first"
        token={firstSlot}
        active={activeSlot === 'first'}
        onActivate={onFirstTap}
      />
      <div className="ft-connector" aria-hidden="true">
        {selectedCharacterId && (
          <div className="ft-connector-avatar">
            <Avatar characterId={selectedCharacterId} size={48} />
          </div>
        )}
        <span className="ft-connector-word">then</span>
        <span className="ft-connector-arrow">→</span>
      </div>
      <Slot
        label="THEN"
        slot="then"
        token={thenSlot}
        active={activeSlot === 'then'}
        onActivate={onThenTap}
      />
    </div>
    </div>
  );
}
