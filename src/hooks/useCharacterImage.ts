import { useCharacterStore } from '../store/characterStore';
import { labelToFileName } from '../utils/characterUtils';
import type { SymbolCategory } from '../types/character';

const BASE = import.meta.env.BASE_URL || '/';

// Module-level set populated when manifest loads
export const knownCharacterPaths = new Set<string>();

/**
 * Resolves the custom character image URL for a symbol.
 * Returns null if no custom image available.
 */
export function useCharacterImage(
  label: string,
  category: SymbolCategory
): string | null {
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const characters = useCharacterStore((s) => s.characters);

  if (!selectedCharacterId) return null;

  const character = characters.find(c => c.id === selectedCharacterId);
  if (!character) return null;
  if (!character.supportedCategories.includes(category)) return null;

  const fileName = labelToFileName(label);
  return `${BASE}characters/symbols/${selectedCharacterId}/${category}/${fileName}.png`;
}
