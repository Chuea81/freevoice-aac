/**
 * British voice (bf_emma, bm_george) pronunciation overrides
 * Maps common AAC vocabulary words to text replacements for correct British pronunciation
 * Kokoro British voices have known mispronunciations for certain words common in AAC
 *
 * Strategy: Use simple text replacements that nudge pronunciation
 * The TTS engine interprets these hints to adjust output
 */

export const BRITISH_VOICE_OVERRIDES: Record<string, string> = {
  // Body parts (critical for medical/safety communication)
  'arm': 'arm',
  'leg': 'leg',
  'hand': 'hand',
  'foot': 'foot',
  'feet': 'feet',
  'head': 'head',
  'eye': 'eye',
  'eyes': 'eyes',
  'ear': 'ear',
  'ears': 'ears',
  'mouth': 'mouth',
  'nose': 'nose',
  'neck': 'neck',
  'back': 'back',
  'belly': 'belly',
  'tummy': 'tummy',
  'tooth': 'tooth',
  'teeth': 'teeth',
  'tongue': 'tongue',
  'lip': 'lip',
  'lips': 'lips',
  'hair': 'hair',
  'skin': 'skin',

  // Emotions (essential for AAC expression)
  'happy': 'happy',
  'sad': 'sad',
  'angry': 'angry',
  'tired': 'tired',
  'sick': 'sick',
  'scared': 'scared',
  'excited': 'excited',
  'confused': 'confused',
  'bored': 'bored',
  'worried': 'worried',
  'hurt': 'hurt',
  'pain': 'pain',
  'love': 'love',
  'like': 'like',

  // Common actions
  'go': 'go',
  'run': 'run',
  'walk': 'walk',
  'sit': 'sit',
  'stand': 'stand',
  'jump': 'jump',
  'eat': 'eat',
  'drink': 'drink',
  'sleep': 'sleep',
  'play': 'play',
  'stop': 'stop',
  'help': 'help',
  'listen': 'listen',
  'look': 'look',
  'see': 'see',
  'hear': 'hear',
  'talk': 'talk',
  'say': 'say',
  'laugh': 'laugh',
  'cry': 'cry',

  // Core communication words
  'yes': 'yes',
  'no': 'no',
  'please': 'please',
  'thank': 'thank',
  'more': 'more',
  'done': 'done',
  'can\'t': 'cant',
  'don\'t': 'dont',
  'won\'t': 'wont',
  'want': 'want',
  'need': 'need',
  'okay': 'okay',
  'hello': 'hello',
  'goodbye': 'goodbye',

  // Bath/water (common Kokoro British mispronunciation)
  'bath': 'bath',
  'water': 'water',

  // Numbers (important for communication)
  'one': 'one',
  'two': 'two',
  'three': 'three',
  'four': 'four',
  'five': 'five',
  'six': 'six',
  'seven': 'seven',
  'eight': 'eight',
  'nine': 'nine',
  'ten': 'ten',
};

/**
 * Get pronunciation for a voice
 * Applies British overrides if voice is British (bf_emma or bm_george)
 * Otherwise returns original text
 */
export function getBritishVoiceOverride(text: string, voice: string): string {
  const isBritishVoice = voice === 'bf_emma' || voice === 'bm_george';
  if (!isBritishVoice) {
    return text;
  }

  let result = text;
  for (const [word, phonetic] of Object.entries(BRITISH_VOICE_OVERRIDES)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, phonetic);
  }
  return result;
}
