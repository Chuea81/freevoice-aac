import { useEffect } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { knownCharacterPaths } from './useCharacterImage';
import { buildKnownPaths, EMOTION_LABELS } from '../utils/characterUtils';

export function useCharacterManifest() {
  const setCharacters = useCharacterStore((s) => s.setCharacters);
  const setManifestLoaded = useCharacterStore((s) => s.setManifestLoaded);

  useEffect(() => {
    fetch('/characters/manifest.json')
      .then(r => r.json())
      .then(manifest => {
        setCharacters(manifest.characters);

        for (const char of manifest.characters) {
          const paths = buildKnownPaths(
            char.id,
            char.supportedCategories,
            EMOTION_LABELS
          );
          paths.forEach(p => knownCharacterPaths.add(p));
        }

        setManifestLoaded(true);
      })
      .catch(() => {
        // Non-fatal — app works fine with ARASAAC/emoji if manifest missing
        setManifestLoaded(true);
      });
  }, [setCharacters, setManifestLoaded]);
}
