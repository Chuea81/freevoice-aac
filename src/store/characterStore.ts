import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Character } from '../types/character';

interface CharacterState {
  selectedCharacterId: string | null;
  characters: Character[];
  manifestLoaded: boolean;

  setSelectedCharacter: (id: string | null) => void;
  setCharacters: (chars: Character[]) => void;
  setManifestLoaded: (v: boolean) => void;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set) => ({
      selectedCharacterId: null,
      characters: [],
      manifestLoaded: false,
      setSelectedCharacter: (id) => set({ selectedCharacterId: id }),
      setCharacters: (chars) => set({ characters: chars }),
      setManifestLoaded: (v) => set({ manifestLoaded: v }),
    }),
    {
      name: 'freevoice-character',
      partialize: (s) => ({ selectedCharacterId: s.selectedCharacterId }),
    }
  )
);
