import { useState, useCallback } from 'react';
import { useSettingsStore, type SkinTone } from '../../store/settingsStore';

interface Props {
  onComplete: () => void;
}

const SKIN_TONES: { value: SkinTone; label: string; swatch: string }[] = [
  { value: 'default', label: 'Default', swatch: '👋' },
  { value: 'light', label: 'Light', swatch: '👋🏻' },
  { value: 'medium-light', label: 'Medium Light', swatch: '👋🏼' },
  { value: 'medium', label: 'Medium', swatch: '👋🏽' },
  { value: 'medium-dark', label: 'Medium Dark', swatch: '👋🏾' },
  { value: 'dark', label: 'Dark', swatch: '👋🏿' },
];

export function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const setSkinTone = useSettingsStore((s) => s.setSkinTone);
  const skinTone = useSettingsStore((s) => s.skinTone);
  const setOnboardingDone = useSettingsStore((s) => s.setOnboardingDone);

  const handleFinish = useCallback(() => {
    if (name.trim()) {
      // Store the user's name for potential personalization
      import('../../db').then(({ db }) => {
        db.settings.put({ key: 'userName', value: name.trim() });
      });
    }
    setOnboardingDone(true);
    onComplete();
  }, [name, setOnboardingDone, onComplete]);

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        {/* Step indicators */}
        <div className="onboarding-steps">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`onboarding-dot${step === i ? ' active' : ''}${step > i ? ' done' : ''}`} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h1 className="onboarding-title">Welcome to FreeVoice!</h1>
            <p className="onboarding-subtitle">Free communication for every child</p>
            <div className="onboarding-field">
              <label>What's your name?</label>
              <input
                type="text"
                placeholder="e.g. Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                autoFocus
              />
            </div>
            <button className="onboarding-next" onClick={() => setStep(1)}>
              Next
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="onboarding-title">Choose Skin Tone</h1>
            <p className="onboarding-subtitle">Applies to all people symbols</p>
            <div className="onboarding-skin-grid">
              {SKIN_TONES.map((t) => (
                <button
                  key={t.value}
                  className={`onboarding-skin-btn${skinTone === t.value ? ' active' : ''}`}
                  onClick={() => setSkinTone(t.value)}
                >
                  <span className="onboarding-skin-swatch">{t.swatch}</span>
                  <span className="onboarding-skin-label">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="onboarding-nav">
              <button className="onboarding-back" onClick={() => setStep(0)}>Back</button>
              <button className="onboarding-next" onClick={() => setStep(2)}>Next</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="onboarding-title">You're all set!</h1>
            <p className="onboarding-subtitle">
              Tap symbols to build sentences. Tap SPEAK to say them aloud.
              {'\n\n'}Triple-tap the top-right corner for parent settings.
            </p>
            <div className="onboarding-tips">
              <div className="onboarding-tip">🔊 Tap any card to speak</div>
              <div className="onboarding-tip">⭐ MY WORDS tab for custom phrases</div>
              <div className="onboarding-tip">🔒 Triple-tap top-right for settings</div>
            </div>
            <div className="onboarding-nav">
              <button className="onboarding-back" onClick={() => setStep(1)}>Back</button>
              <button className="onboarding-next done" onClick={handleFinish}>Start Using FreeVoice</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
