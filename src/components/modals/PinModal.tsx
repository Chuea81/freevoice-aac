import { useState, useCallback, useEffect } from 'react';
import { useParentStore } from '../../store/parentStore';

export function PinModal() {
  const showPinModal = useParentStore((s) => s.showPinModal);
  const pinMode = useParentStore((s) => s.pinMode);
  const closePinModal = useParentStore((s) => s.closePinModal);
  const setPin = useParentStore((s) => s.setPin);
  const verifyPin = useParentStore((s) => s.verifyPin);

  const [digits, setDigits] = useState('');
  const [confirmDigits, setConfirmDigits] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');

  useEffect(() => {
    if (showPinModal) {
      setDigits('');
      setConfirmDigits('');
      setStep('enter');
      setError('');
    }
  }, [showPinModal]);

  const handleDigit = useCallback((d: string) => {
    setError('');
    if (step === 'enter') {
      setDigits((prev) => (prev.length < 4 ? prev + d : prev));
    } else {
      setConfirmDigits((prev) => (prev.length < 4 ? prev + d : prev));
    }
  }, [step]);

  const handleBackspace = useCallback(() => {
    setError('');
    if (step === 'enter') {
      setDigits((prev) => prev.slice(0, -1));
    } else {
      setConfirmDigits((prev) => prev.slice(0, -1));
    }
  }, [step]);

  const handleSubmit = useCallback(async () => {
    if (pinMode === 'unlock') {
      if (digits.length !== 4) return;
      const ok = await verifyPin(digits);
      if (!ok) {
        setError('Wrong PIN');
        setDigits('');
      }
    } else {
      // set or change mode
      if (step === 'enter') {
        if (digits.length !== 4) return;
        setStep('confirm');
      } else {
        if (confirmDigits.length !== 4) return;
        if (digits !== confirmDigits) {
          setError('PINs do not match');
          setConfirmDigits('');
          return;
        }
        await setPin(digits);
      }
    }
  }, [pinMode, digits, confirmDigits, step, verifyPin, setPin]);

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pinMode === 'unlock' && digits.length === 4) {
      handleSubmit();
    }
  }, [digits, pinMode, handleSubmit]);

  useEffect(() => {
    if (pinMode !== 'unlock' && step === 'confirm' && confirmDigits.length === 4) {
      handleSubmit();
    }
  }, [confirmDigits, pinMode, step, handleSubmit]);

  if (!showPinModal) return null;

  const currentDigits = step === 'enter' ? digits : confirmDigits;
  const title = pinMode === 'unlock'
    ? 'Enter PIN'
    : step === 'enter'
      ? (pinMode === 'set' ? 'Create a PIN' : 'Enter New PIN')
      : 'Confirm PIN';
  const subtitle = pinMode === 'unlock'
    ? 'Enter your 4-digit parent PIN'
    : step === 'enter'
      ? 'Choose a 4-digit PIN to lock settings'
      : 'Enter the same PIN again';

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closePinModal(); }}>
      <div className="pin-modal">
        <h2 className="pin-title">{title}</h2>
        <p className="pin-subtitle">{subtitle}</p>

        {/* Dot indicators */}
        <div className="pin-dots">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`pin-dot${i < currentDigits.length ? ' filled' : ''}`} />
          ))}
        </div>

        {error && <p className="pin-error">{error}</p>}

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
