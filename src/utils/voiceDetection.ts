/**
 * Apple Personal Voice detection and Web Speech voice classification.
 * Used by useTTS and VoiceSelector for the three-tier voice system.
 */

/**
 * Apple Personal Voice appears in speechSynthesis.getVoices() on iOS 17+.
 * Identified by name containing "Personal Voice" or voiceURI matching
 * the personal voice pattern.
 */
export function detectPersonalVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return voices.find(
    (v) =>
      v.name.toLowerCase().includes('personal voice') ||
      v.voiceURI.toLowerCase().includes('personal') ||
      v.name.toLowerCase().includes('personalvoice')
  ) ?? null;
}

/**
 * iOS Siri voices — clear, warm, natural.
 * These are the high-quality voices built into Apple devices.
 */
export function isHighQualityIOSVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  return (
    voice.localService === true &&
    (name.includes('siri') ||
      name.includes('samantha') ||
      name.includes('karen') ||
      name.includes('daniel') ||
      name.includes('moira'))
  );
}

export interface ClassifiedVoice {
  voice: SpeechSynthesisVoice;
  tier: 'personal' | 'siri' | 'standard' | 'network';
  label: string;
  description: string;
}

export function classifyWebSpeechVoices(voices: SpeechSynthesisVoice[]): ClassifiedVoice[] {
  return voices
    .filter((v) => v.lang.startsWith('en'))
    .map((v) => {
      const isPersonal = !!detectPersonalVoice([v]);
      const isHighQuality = isHighQualityIOSVoice(v);
      const isNetwork = !v.localService;

      if (isPersonal) {
        return {
          voice: v,
          tier: 'personal' as const,
          label: '⭐ Your Personal Voice',
          description: 'Your own voice, recorded in Accessibility settings',
        };
      }
      if (isHighQuality) {
        return {
          voice: v,
          tier: 'siri' as const,
          label: v.name,
          description: 'High quality · Works offline',
        };
      }
      if (isNetwork) {
        return {
          voice: v,
          tier: 'network' as const,
          label: v.name,
          description: 'Requires internet connection',
        };
      }
      return {
        voice: v,
        tier: 'standard' as const,
        label: v.name,
        description: 'Built-in · Works offline',
      };
    })
    .sort((a, b) => {
      const order = { personal: 0, siri: 1, standard: 2, network: 3 };
      return order[a.tier] - order[b.tier];
    });
}

/**
 * iOS SpeechSynthesis unlock.
 * CRITICAL: On iOS, Web Speech API is locked until a user gesture fires.
 * Call this on the first touchstart event or speech will silently fail.
 */
export function unlockIOSSpeech(): void {
  if (typeof window === 'undefined') return;
  const unlock = () => {
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('touchstart', unlock, { once: true });
}
