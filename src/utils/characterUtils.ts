export function labelToFileName(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

const BASE = import.meta.env.BASE_URL || '/';

export function buildCharacterImagePath(
  characterId: string,
  category: string,
  label: string
): string {
  return `${BASE}characters/symbols/${characterId}/${category}/${labelToFileName(label)}.png`;
}

export function buildKnownPaths(
  characterId: string,
  supportedCategories: string[],
  emotionLabels: string[]
): string[] {
  const paths: string[] = [];
  for (const category of supportedCategories) {
    if (category === 'emotions') {
      for (const label of emotionLabels) {
        paths.push(buildCharacterImagePath(characterId, category, label));
      }
    }
  }
  return paths;
}

export const EMOTION_LABELS = [
  'HAPPY', 'SAD', 'ANGRY', 'SCARED', 'TIRED', 'SICK', 'BORED', 'LOVE',
  'FRUSTRATED', 'GOOD', 'WORRIED', 'EXCITED', 'NERVOUS', 'CALM',
  'CONFUSED', 'SURPRISED', 'PROUD', 'LONELY', 'EMBARRASSED',
  'HURT FEELINGS', 'SHY', 'SILLY', 'GRATEFUL', 'DISAPPOINTED',
];
