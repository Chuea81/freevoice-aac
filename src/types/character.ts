export type SkinTone = 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';
export type Gender = 'boy' | 'girl' | 'neutral';
export type HairType = 'straight' | 'wavy' | 'curly' | 'coily';
export type HairColor = 'black' | 'brown' | 'blonde' | 'red' | 'auburn';
export type SymbolCategory = 'emotions' | 'body' | 'social' | 'school' | 'play' | 'food';

export interface Character {
  id: string;
  name: string;
  gender: Gender;
  skinTone: SkinTone;
  hairType: HairType;
  hairColor: HairColor;
  previewImage: string;
  supportedCategories: SymbolCategory[];
  description: string;
}

export interface CharacterManifest {
  version: string;
  characters: Character[];
}
