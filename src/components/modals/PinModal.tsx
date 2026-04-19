import { useState, useCallback, useEffect } from 'react';
import { useParentStore } from '../../store/parentStore';

// Step machine across modes:
//   unlock: [verify]                       (enter PIN, done)
//   set:    [enter, confirm]               (pick PIN, retype)
//   change: [verify, enter, confirm]       (old PIN, new PIN, retype)
//   remove: [verify]                       (old PIN, then clear)
type Step = 'verify' | 'enter' | 'confirm';

function initialStep(mode: 'unlock' | 'set' | 'change' | 'remove'): Step {
  if (mode === 'set') return 'enter';
  return 'verify';
}

export function PinModal() {
  const showPinModal = useParentStore((s) => s.showPinModal);
  const pinMode = useParentStore((s) => s.pinMode);
  const closePinModal = useParentStore((s) => s.closePinModal);
  const setPin = useParentStore((s) => s.setPin);
  const verifyPin = useParentStore((s) => s.verifyPin);
  const clearPin = useParentStore((s) => s.clearPin);

  const [step, setStep] = useState<Step>('verify');
  const [digits, setDigits] = useState('');
  const [savedNewPin, setSavedNewPin] = useState('');
  const [error, setError] = useState('');

  // Reset all local state whenever the modal opens so a second invocation
  // doesn't inherit stale digits/step from the previous session.
  useEffect(() => {
    if (showPinModal) {
      setStep(initialStep(pinMode));
      setDigits('');
      setSavedNewPin('');
      setError('');
    }
  }, [showPinModal, pinMode]);

  const handleDigit = useCallback((d: string) => {
    setError('');
    setDigits((prev) => (prev.length < 4 ? prev + d : prev));
  }, []);

  const handleBackspace = useCallback(() => {
    setError('');
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  // Auto-advance when 4 digits are entered. Each step does its own work:
  //   verify → verifyPin → advance or error
  //   enter  → remember digits → advance to confirm
  //   confirm → compare against savedNewPin → setPin or error
  useEffect(() => {
    if (digits.length !== 4) return;

    if (step === 'verify') {
      verifyPin(digits).then((ok) => {
        if (!ok) {
          setError('Wrong PIN');
          setDigits('');
          return;
        }
        // unlock: verifyPin already closed the modal via isUnlocked.
        // remove: wipe PIN + disable lock.
        // change: advance to enter-new-PIN step.
        if (pinMode === 'remove') {
          clearPin();
        } else if (pinMode === 'change') {
          setDigits('');
          setStep('enter');
        }
      });
      return;
    }

    if (step === 'enter') {
      setSavedNewPin(digits);
      setDigits('');
      setStep('confirm');
      return;
    }

    if (step === 'confirm') {
      if (digits !== savedNewPin) {
        setError('PINs do not match');
        setDigits('');
        return;
      }
      setPin(savedNewPin);
    }
  }, [digits, step, pinMode, verifyPin, clearPin, setPin, savedNewPin]);

  if (!showPinModal) return null;

  const { title, subtitle } = titles(pinMode, step);
  // Only show the "no recovery" warning on the first step of creating a new
  // PIN — that's where the user is actually making the commitment.
  const showForgotWarning = pinMode === 'set' && step === 'enter';

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closePinModal(); }}>
      <div className="pin-modal">
        <h2 className="pin-title">{title}</h2>
        <p className="pin-subtitle">{subtitle}</p>

        {/* Dot indicators */}
        <div className="pin-dots">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`pin-dot${i < digits.length ? ' filled' : ''}`} />
          ))}
        </div>

        {error && <p className="pin-error">{error}</p>}

        {showForgotWarning && (
          <p className="pin-subtitle" style={{ marginTop: 8, fontSize: 12, color: '#b45309' }}>
            ⚠️ If you forget your PIN, you will need to clear the app data to reset it.
          </p>
        )}

        {/* Numpad */}
        <div className="pin-keypad">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => (
            <button
              key={key || 'empty'}
              className={`pin-key${key === '⌫' ? ' backspace' : ''}${key === '' ? ' empty' : ''}`}
              onClick={() => {
                if (key === '⌫') handleBackspace();
                else if (key) handleDigit(key);
              }}
              disabled={key === ''}
            >
              {key}
            </button>
          ))}
        </div>

        <button className="pin-cancel" onClick={closePinModal}>Cancel</button>
      </div>
    </div>
  );
}

function titles(mode: 'unlock' | 'set' | 'change' | 'remove', step: Step): { title: string; subtitle: string } {
  if (mode === 'unlock') return { title: 'Enter PIN', subtitle: 'Enter your 4-digit PIN' };
  if (mode === 'remove') return { title: 'Remove PIN Lock', subtitle: 'Enter your current PIN to disable the lock' };
  if (mode === 'set') {
    return step === 'enter'
      ? { title: 'Create a PIN', subtitle: 'Choose a 4-digit PIN to lock Settings' }
      : { title: 'Confirm PIN', subtitle: 'Enter the same PIN again' };
  }
  // change
  if (step === 'verify') return { title: 'Change PIN', subtitle: 'Enter your current PIN' };
  if (step === 'enter')  return { title: 'New PIN', subtitle: 'Choose a new 4-digit PIN' };
  return { title: 'Confirm New PIN', subtitle: 'Enter the new PIN again' };
}
