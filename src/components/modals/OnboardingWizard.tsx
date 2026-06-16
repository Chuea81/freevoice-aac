import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../store/settingsStore';
import { useCharacterStore } from '../../store/characterStore';
import { CharacterPicker } from '../CharacterPicker/CharacterPicker';

interface Props {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const setOnboardingDone = useSettingsStore((s) => s.setOnboardingDone);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const characters = useCharacterStore((s) => s.characters);

  const selectedChar = characters.find(c => c.id === selectedCharacterId);

  const handleFinish = useCallback(() => {
    if (name.trim()) {
      import('../../db').then(({ db }) => {
        db.settings.put({ key: 'userName', value: name.trim() });
      });
    }
    setOnboardingDone(true);
    onComplete();
  }, [name, setOnboardingDone, onComplete]);

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card" style={{ maxWidth: step === 1 ? 520 : 400 }}>
        {/* Step indicators */}
        <div className="onboarding-steps">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`onboarding-dot${step === i ? ' active' : ''}${step > i ? ' done' : ''}`} />
          ))}
        </div>

        {/* Step 0: Name */}
        {step === 0 && (
          <>
            <h1 className="onboarding-title">{t('onboarding.welcome', 'Welcome to FreeVoice!')}</h1>
            <p className="onboarding-subtitle">{t('onboarding.tagline', 'Free communication for every child')}</p>
            <div className="onboarding-field">
              <label>{t('onboarding.nameLabel', "What's your name?")}</label>
              <input
                type="text"
                placeholder={t('onboarding.namePlaceholder', 'e.g. Alex')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                autoFocus
              />
            </div>
            <button className="onboarding-next" onClick={() => setStep(1)}>
              {t('onboarding.next', 'Next')}
            </button>
          </>
        )}

        {/* Step 1: Character picker (replaces skin tone) */}
        {step === 1 && (
          <>
            <h1 className="onboarding-title">
              {t('onboarding.chooseCharacter', 'Choose a character')}
            </h1>
            <p className="onboarding-subtitle">
              {t('onboarding.characterSubtitle', "Pick the character that looks most like {{name}}.\nThey'll appear on emotion symbols throughout the app.", { name: name || t('onboarding.yourChild', 'your child') })}
            </p>

            <CharacterPicker
              onSelect={(id) => {
                if (id === 'none') {
                  useCharacterStore.getState().setSelectedCharacter(null);
                } else {
                  useCharacterStore.getState().setSelectedCharacter(id);
                }
              }}
              showSkipOption={true}
            />

            <div className="onboarding-nav" style={{ marginTop: 20 }}>
              <button className="onboarding-back" onClick={() => setStep(0)}>{t('onboarding.back', 'Back')}</button>
              <button className="onboarding-next" onClick={() => setStep(2)}>{t('onboarding.next', 'Next')}</button>
            </div>
          </>
        )}

        {/* Step 2: Tips */}
        {step === 2 && (
          <>
            <h1 className="onboarding-title">{t('onboarding.allSet', "You're all set!")}</h1>
            <p className="onboarding-subtitle">
              {t('onboarding.tips', 'Tap symbols to build sentences. Tap SPEAK to say them aloud.\n\nTriple-tap the top-right corner for parent settings.')}
            </p>
            <div className="onboarding-tips">
              <div className="onboarding-tip">{t('onboarding.tip1', '🔊 Tap any card to speak')}</div>
              <div className="onboarding-tip">{t('onboarding.tip2', '⭐ MY WORDS tab for custom phrases')}</div>
              <div className="onboarding-tip">{t('onboarding.tip3', '🔒 Triple-tap top-right for settings')}</div>
            </div>
            <div className="onboarding-nav">
              <button className="onboarding-back" onClick={() => setStep(1)}>{t('onboarding.back', 'Back')}</button>
              <button className="onboarding-next done" onClick={handleFinish}>
                {selectedChar ? t('onboarding.startWith', 'Start with {{name}}', { name: selectedChar.name }) : t('onboarding.startApp', 'Start FreeVoice')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
