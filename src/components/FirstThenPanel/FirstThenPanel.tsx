import { useFirstThenStore, type FirstThenSlot, type FirstThenToken } from '../../store/firstThenStore';
import { useTouchDelay } from '../../hooks/useTouchDelay';

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

  const onFirstTap = () => {
    if (firstSlot) clearSlot('first');
    else setActiveSlot('first');
  };
  const onThenTap = () => {
    if (thenSlot) clearSlot('then');
    else setActiveSlot('then');
  };

  return (
    <div
      className="first-then-panel"
      role="group"
      aria-label="First, then sentence builder"
    >
      <Slot
        label="FIRST"
        slot="first"
        token={firstSlot}
        active={activeSlot === 'first'}
        onActivate={onFirstTap}
      />
      <div className="ft-connector" aria-hidden="true">
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
  );
}
