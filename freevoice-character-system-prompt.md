# FreeVoice AAC — Custom Character System & Onboarding Picker
## Claude Code Prompt

---

Read `freevoice-prd.md` and `freevoice-design-system-prompt.md` before
starting. This prompt implements the complete custom character system —
file naming convention, character data model, onboarding picker,
settings picker, and the SymbolCard rendering pipeline that swaps
custom character images in place of ARASAAC for supported symbols.

Do NOT touch TTS files, Dexie schema migrations already written,
or the ARASAAC pipeline for symbols that don't have custom art yet.

---

## The Vision

FreeVoice ships with a set of custom illustrated emotion characters
created by Shellcraft Labs. Each character represents the same
24+ emotions in a consistent art style. Parents choose the character
that looks most like their child during onboarding. Every emotion
symbol in the app then uses that character's illustration instead
of generic ARASAAC line art.

Over time, custom character art will expand beyond emotions to
body/health, social, school, and other categories. The system
is designed to handle this expansion without any rearchitecting.

---

## File Naming Convention

All custom character images live in `public/characters/`.

### Directory Structure

```
public/
└── characters/
    ├── manifest.json          ← lists all available characters
    ├── preview/               ← thumbnail previews for picker
    │   ├── char_001.png       ← 200×200px preview image
    │   ├── char_002.png
    │   └── ...
    └── symbols/
        ├── char_001/          ← one folder per character
        │   ├── emotions/
        │   │   ├── happy.png
        │   │   ├── sad.png
        │   │   ├── angry.png
        │   │   ├── scared.png
        │   │   ├── tired.png
        │   │   ├── sick.png
        │   │   ├── bored.png
        │   │   ├── love.png
        │   │   ├── frustrated.png
        │   │   ├── good.png
        │   │   ├── worried.png
        │   │   ├── excited.png
        │   │   ├── nervous.png
        │   │   ├── calm.png
        │   │   ├── confused.png
        │   │   ├── surprised.png
        │   │   ├── proud.png
        │   │   ├── lonely.png
        │   │   ├── embarrassed.png
        │   │   ├── hurt_feelings.png
        │   │   ├── shy.png
        │   │   ├── silly.png
        │   │   ├── grateful.png
        │   │   └── disappointed.png
        │   └── body/          ← future expansion
        │       └── (empty for now)
        ├── char_002/
        │   └── emotions/
        │       └── (same files)
        └── ...
```

### Character ID Convention

Characters are named `char_001` through `char_NNN`.
The manifest.json describes each character:

```json
{
  "version": "1.0",
  "characters": [
    {
      "id": "char_001",
      "name": "Alex",
      "gender": "boy",
      "skinTone": "light",
      "hairType": "straight",
      "hairColor": "brown",
      "previewImage": "/characters/preview/char_001.png",
      "supportedCategories": ["emotions"],
      "description": "Boy with light skin and brown hair"
    },
    {
      "id": "char_002",
      "name": "Jordan",
      "gender": "boy",
      "skinTone": "dark",
      "hairType": "curly",
      "hairColor": "black",
      "previewImage": "/characters/preview/char_002.png",
      "supportedCategories": ["emotions"],
      "description": "Boy with dark skin and black curly hair"
    }
  ]
}
```

### Symbol Name → File Name Mapping

The emotion label maps to a filename using this exact convention:
- All lowercase
- Spaces replaced with underscores
- Special characters removed

```typescript
export function labelToFileName(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

// Examples:
// 'HAPPY'         → 'happy'
// 'HURT FEELINGS' → 'hurt_feelings'
// 'EMBARRASSED'   → 'embarrassed'
```

---

## Step 1 — Character Data Types

Create `src/types/character.ts`:

```typescript
export type SkinTone = 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';
export type Gender   = 'boy' | 'girl' | 'neutral';
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
```

---

## Step 2 — Character Store

Add to `src/store/settingsStore.ts` (or create
`src/store/characterStore.ts` if cleaner):

```typescript
import { persist } from 'zustand/middleware';
import type { Character } from '../types/character';

interface CharacterState {
  // The selected character ID — null means ARASAAC/emoji
  selectedCharacterId: string | null;

  // Loaded manifest
  characters: Character[];
  manifestLoaded: boolean;

  // Actions
  setSelectedCharacter: (id: string | null) => void;
  setCharacters: (chars: Character[]) => void;
  setManifestLoaded: (v: boolean) => void;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set) => ({
      selectedCharacterId: null, // null until onboarding picks one
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
```

---

## Step 3 — Character Image Resolution Hook

Create `src/hooks/useCharacterImage.ts`:

```typescript
import { useCharacterStore } from '../store/characterStore';
import { labelToFileName } from '../utils/characterUtils';
import type { SymbolCategory } from '../types/character';

/**
 * Resolves the correct image URL for a symbol.
 *
 * Priority order:
 * 1. Custom character image (if character selected + category supported + file exists)
 * 2. ARASAAC hardcoded ID
 * 3. ARASAAC keyword search cache
 * 4. Emoji fallback
 *
 * Returns null if no custom image available (caller falls through to ARASAAC).
 */
export function useCharacterImage(
  label: string,
  category: SymbolCategory
): string | null {
  const { selectedCharacterId, characters } = useCharacterStore();

  if (!selectedCharacterId) return null;

  const character = characters.find(c => c.id === selectedCharacterId);
  if (!character) return null;
  if (!character.supportedCategories.includes(category)) return null;

  const fileName = labelToFileName(label);
  return `/characters/symbols/${selectedCharacterId}/${category}/${fileName}.png`;
}

/**
 * Eagerly check if a custom character image actually exists.
 * Uses a Set of known-good paths populated at manifest load time.
 */
export function useCharacterImageExists(
  label: string,
  category: SymbolCategory
): boolean {
  const url = useCharacterImage(label, category);
  if (!url) return false;
  // Check against preloaded known paths
  return knownCharacterPaths.has(url);
}

// Module-level set populated when manifest loads
export const knownCharacterPaths = new Set<string>();
```

Create `src/utils/characterUtils.ts`:

```typescript
export function labelToFileName(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

// Reverse map — filename back to display label
export function fileNameToLabel(fileName: string): string {
  return fileName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Build the full path for a character + category + label
export function buildCharacterImagePath(
  characterId: string,
  category: string,
  label: string
): string {
  return `/characters/symbols/${characterId}/${category}/${labelToFileName(label)}.png`;
}

// Pre-build all known paths for a character from the manifest
// so we can check existence without network requests
export function buildKnownPaths(
  characterId: string,
  supportedCategories: string[],
  emotionLabels: string[]
): string[] {
  const paths: string[] = [];
  for (const category of supportedCategories) {
    // For now emotions are the only category with known labels
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
```

---

## Step 4 — Manifest Loader

Create `src/hooks/useCharacterManifest.ts`:

```typescript
import { useEffect } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { knownCharacterPaths, buildKnownPaths } from '../utils/characterUtils';
import { EMOTION_LABELS } from '../utils/characterUtils';

export function useCharacterManifest() {
  const { setCharacters, setManifestLoaded } = useCharacterStore();

  useEffect(() => {
    fetch('/characters/manifest.json')
      .then(r => r.json())
      .then(manifest => {
        setCharacters(manifest.characters);

        // Pre-populate known paths for instant existence checks
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
        // Non-fatal — app works fine with ARASAAC if manifest missing
        setManifestLoaded(true);
      });
  }, []);
}
```

Call `useCharacterManifest()` once at the top level in `App.tsx`.

---

## Step 5 — Update SymbolCard to Use Character Images

Update `src/components/SymbolCard/SymbolCard.tsx` to check for
custom character images before falling through to ARASAAC:

```typescript
import { useCharacterImage } from '../../hooks/useCharacterImage';
import { knownCharacterPaths } from '../../hooks/useCharacterImage';

// Inside SymbolCard component:
const { label, arasaacId, emoji, category } = symbol;

// Step 1: Check for custom character image
const characterImageUrl = useCharacterImage(label, category as SymbolCategory);
const hasCharacterImage = characterImageUrl
  ? knownCharacterPaths.has(characterImageUrl)
  : false;

// Step 2: If character image exists, use it
if (hasCharacterImage && characterImageUrl) {
  return (
    <img
      src={characterImageUrl}
      alt={label}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        borderRadius: '8px',
      }}
      onError={(e) => {
        // If image fails to load, remove from known paths and re-render
        knownCharacterPaths.delete(characterImageUrl);
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}

// Step 3: Fall through to ARASAAC pipeline (existing logic)
// ... existing ARASAAC / emoji code unchanged
```

Note: Character images for emotions do NOT use the white
symbol-window container — they are designed to fill the
full card area with no white background. Apply directly:

```typescript
// Character images — full bleed, no white container
{hasCharacterImage && characterImageUrl && (
  <img
    src={characterImageUrl}
    alt={displayLabel}
    loading="lazy"
    decoding="async"
    style={{
      width: 'clamp(52px, 60%, 96px)',
      height: 'clamp(52px, 60%, 96px)',
      objectFit: 'contain',
      borderRadius: '8px',
      // No background — character art has transparent bg
    }}
  />
)}

// ARASAAC images — white symbol window (existing)
{!hasCharacterImage && symbol.arasaacId && (
  <div className="symbol-image-container">
    <img ... />
  </div>
)}
```

---

## Step 6 — Onboarding Character Picker

Update `src/components/Onboarding/Onboarding.tsx`.
The existing 3-step onboarding (Name → Board style → Skin tone)
becomes:

**Step 1:** What's your name?
**Step 2:** Choose board style (Express / Blank)
**Step 3:** Choose your character ← REPLACES skin tone selector

The character picker is the most important step. Give it the
most visual real estate.

### Character Picker Component

Create `src/components/CharacterPicker/CharacterPicker.tsx`:

```tsx
import { useState, useMemo } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import type { Character, Gender, SkinTone } from '../../types/character';

interface CharacterPickerProps {
  onSelect: (characterId: string) => void;
  showSkipOption?: boolean;
}

// Skin tone filter options with visual swatches
const SKIN_TONE_OPTIONS: { value: SkinTone | 'all'; label: string; swatch: string }[] = [
  { value: 'all',          label: 'All',    swatch: 'linear-gradient(135deg,#FDDBB4,#8B4513)' },
  { value: 'light',        label: 'Light',  swatch: '#FDDBB4' },
  { value: 'medium-light', label: 'Medium Light', swatch: '#E8A87C' },
  { value: 'medium',       label: 'Medium', swatch: '#C68642' },
  { value: 'medium-dark',  label: 'Medium Dark',  swatch: '#8D5524' },
  { value: 'dark',         label: 'Dark',   swatch: '#4A2512' },
];

const GENDER_OPTIONS: { value: Gender | 'all'; label: string; icon: string }[] = [
  { value: 'all',     label: 'All',    icon: '👥' },
  { value: 'boy',     label: 'Boy',    icon: '👦' },
  { value: 'girl',    label: 'Girl',   icon: '👧' },
  { value: 'neutral', label: 'Neutral',icon: '🧒' },
];

export function CharacterPicker({ onSelect, showSkipOption }: CharacterPickerProps) {
  const { characters, selectedCharacterId } = useCharacterStore();
  const [skinFilter, setSkinFilter] = useState<SkinTone | 'all'>('all');
  const [genderFilter, setGenderFilter] = useState<Gender | 'all'>('all');
  const [hovered, setHovered] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return characters.filter(c => {
      if (skinFilter !== 'all' && c.skinTone !== skinFilter) return false;
      if (genderFilter !== 'all' && c.gender !== genderFilter) return false;
      return true;
    });
  }, [characters, skinFilter, genderFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Gender filter */}
      <div>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '11px', fontWeight: 900,
          letterSpacing: '2px', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)', marginBottom: '10px',
        }}>
          Show
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {GENDER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setGenderFilter(opt.value as Gender | 'all')}
              style={{
                background: genderFilter === opt.value
                  ? 'rgba(245,158,11,0.15)'
                  : 'rgba(255,255,255,0.05)',
                border: `1px solid ${genderFilter === opt.value
                  ? 'rgba(245,158,11,0.4)'
                  : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '100px',
                padding: '8px 18px',
                display: 'flex', alignItems: 'center', gap: '6px',
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
                fontSize: '13px', fontWeight: 800,
                color: genderFilter === opt.value
                  ? '#F59E0B'
                  : 'rgba(255,255,255,0.6)',
                transition: 'all 0.15s',
              }}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skin tone filter */}
      <div>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '11px', fontWeight: 900,
          letterSpacing: '2px', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)', marginBottom: '10px',
        }}>
          Skin Tone
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {SKIN_TONE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSkinFilter(opt.value as SkinTone | 'all')}
              title={opt.label}
              style={{
                width: '40px', height: '40px',
                borderRadius: '50%',
                background: opt.swatch,
                border: `3px solid ${skinFilter === opt.value
                  ? '#F59E0B'
                  : 'rgba(255,255,255,0.15)'}`,
                cursor: 'pointer',
                transition: 'border-color 0.15s, transform 0.15s',
                transform: skinFilter === opt.value ? 'scale(1.15)' : 'scale(1)',
                position: 'relative',
              }}
            >
              {/* "All" swatch gets a special indicator */}
              {opt.value === 'all' && (
                <span style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                }}>🌍</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Character grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: '12px',
        maxHeight: '400px',
        overflowY: 'auto',
        padding: '4px 2px',
      }}>
        {filtered.length === 0 ? (
          <div style={{
            gridColumn: '1/-1',
            textAlign: 'center',
            padding: '40px',
            color: 'rgba(255,255,255,0.3)',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
          }}>
            No characters match these filters yet.
            More are being added!
          </div>
        ) : (
          filtered.map(char => {
            const isSelected = selectedCharacterId === char.id;
            const isHovered = hovered === char.id;
            return (
              <button
                key={char.id}
                onClick={() => onSelect(char.id)}
                onMouseEnter={() => setHovered(char.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: isSelected
                    ? 'rgba(245,158,11,0.15)'
                    : isHovered
                    ? 'rgba(255,255,255,0.06)'
                    : '#1B2845',
                  border: `2px solid ${isSelected
                    ? '#F59E0B'
                    : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '18px',
                  padding: '12px 8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '20px', height: '20px',
                    borderRadius: '50%',
                    background: '#F59E0B',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px', fontWeight: 900,
                    color: '#1C1400',
                  }}>
                    ✓
                  </div>
                )}

                {/* Preview image */}
                <img
                  src={char.previewImage}
                  alt={char.description}
                  style={{
                    width: '72px', height: '72px',
                    objectFit: 'contain',
                    borderRadius: '10px',
                  }}
                  onError={(e) => {
                    // Fallback if preview image missing
                    e.currentTarget.style.display = 'none';
                  }}
                />

                {/* Character name */}
                <span style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '12px', fontWeight: 900,
                  color: isSelected
                    ? '#F59E0B'
                    : 'rgba(255,255,255,0.75)',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}>
                  {char.name}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Skip option */}
      {showSkipOption && (
        <button
          onClick={() => onSelect('none')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.3)',
            fontFamily: "'Nunito', sans-serif",
            fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', padding: '8px',
            textDecoration: 'underline',
            alignSelf: 'center',
          }}
        >
          Skip — use standard symbols
        </button>
      )}
    </div>
  );
}
```

---

## Step 7 — Onboarding Flow Update

Update `src/components/Onboarding/Onboarding.tsx`.
Replace the existing skin tone step with the character picker.
The skin tone global setting is now deprecated for users who
choose a character (the character's skin tone IS the representation).
Keep skin tone setting in Settings for users who skip character selection.

```tsx
// Step definitions:
const STEPS = ['name', 'boardStyle', 'character'] as const;
type OnboardingStep = typeof STEPS[number];

// Step 3 — Character picker
{step === 'character' && (
  <div>
    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
      <p style={{
        fontFamily: "'Fraunces', Georgia, serif",
        fontSize: 'clamp(26px,4vw,36px)',
        fontWeight: 900, color: '#E2E8F0',
        marginBottom: '10px', lineHeight: 1.2,
      }}>
        Choose a character
        <em style={{ display: 'block', color: '#F59E0B', fontStyle: 'italic' }}>
          that looks like {name || 'your child'}
        </em>
      </p>
      <p style={{
        fontSize: '15px', color: 'rgba(255,255,255,0.5)',
        fontWeight: 700, maxWidth: '400px', margin: '0 auto',
        lineHeight: 1.6,
      }}>
        This character will appear on emotion symbols throughout the app.
        You can change it any time in Settings.
      </p>
    </div>

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

    {/* Next button — enabled whether or not character is selected */}
    <button
      onClick={completeOnboarding}
      style={{
        marginTop: '28px',
        width: '100%',
        background: '#F59E0B',
        color: '#1C1400',
        fontFamily: "'Nunito', sans-serif",
        fontSize: '17px', fontWeight: 900,
        padding: '16px',
        borderRadius: '100px',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {selectedCharacterId ? `Start with ${selectedCharacterName}` : 'Start FreeVoice'}
    </button>
  </div>
)}
```

---

## Step 8 — Character Picker in Settings

Add a "Your Character" section to Settings, in Parent Mode.
This lets parents change the character after onboarding.

```tsx
// In Settings.tsx, add section:
<Section title="Your Character">
  <p style={{ marginBottom: '16px' }}>
    {selectedCharacterId
      ? `Currently using: ${selectedCharacterName}`
      : 'Using standard ARASAAC symbols'}
  </p>
  <CharacterPicker
    onSelect={(id) => {
      useCharacterStore.getState().setSelectedCharacter(
        id === 'none' ? null : id
      );
    }}
    showSkipOption={true}
  />
</Section>
```

---

## Step 9 — Placeholder Manifest for Development

Since the actual character art files are being created by Shellcraft,
create a placeholder manifest and placeholder images so Claude Code
can implement the full system and have something to render:

Create `public/characters/manifest.json` with the two characters
visible in the screenshots:

```json
{
  "version": "1.0",
  "characters": [
    {
      "id": "char_001",
      "name": "Alex",
      "gender": "boy",
      "skinTone": "light",
      "hairType": "straight",
      "hairColor": "brown",
      "previewImage": "/characters/preview/char_001.png",
      "supportedCategories": ["emotions"],
      "description": "Boy with light skin and brown hair"
    },
    {
      "id": "char_002",
      "name": "Jordan",
      "gender": "boy",
      "skinTone": "dark",
      "hairType": "curly",
      "hairColor": "black",
      "previewImage": "/characters/preview/char_002.png",
      "supportedCategories": ["emotions"],
      "description": "Boy with dark skin and black curly hair"
    }
  ]
}
```

Create placeholder emotion image files using a script so the
directory structure exists and the app can reference them without
404 errors during development:

Create `scripts/create-character-placeholders.mjs`:

```javascript
// Creates empty placeholder PNG files so the app
// doesn't 404 during development before real art is added.
// Run: node scripts/create-character-placeholders.mjs

import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dir, '..', 'public', 'characters');

const CHARACTERS = ['char_001', 'char_002'];
const EMOTIONS = [
  'happy','sad','angry','scared','tired','sick','bored','love',
  'frustrated','good','worried','excited','nervous','calm',
  'confused','surprised','proud','lonely','embarrassed',
  'hurt_feelings','shy','silly','grateful','disappointed',
];

// Minimal valid 1×1 transparent PNG (base64)
const EMPTY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

for (const charId of CHARACTERS) {
  // Preview
  await mkdir(join(PUBLIC, 'preview'), { recursive: true });
  await writeFile(join(PUBLIC, 'preview', `${charId}.png`), EMPTY_PNG);
  console.log(`✓ preview/${charId}.png`);

  // Emotions
  await mkdir(join(PUBLIC, 'symbols', charId, 'emotions'), { recursive: true });
  for (const emotion of EMOTIONS) {
    await writeFile(
      join(PUBLIC, 'symbols', charId, 'emotions', `${emotion}.png`),
      EMPTY_PNG
    );
  }
  console.log(`✓ ${charId}/emotions/ (${EMOTIONS.length} files)`);
}

console.log('\n✅ Placeholder files created.');
console.log('🧑 MANUAL: Replace placeholder PNGs with actual character art.');
console.log('   File naming: lowercase, underscores for spaces.');
console.log('   e.g.: hurt_feelings.png, embarrassed.png');
```

Add to `package.json` scripts:
```json
"create-placeholders": "node scripts/create-character-placeholders.mjs"
```

---

## Step 10 — Adding New Characters (Future Expansion)

Document the process in `public/characters/README.md`:

```markdown
# Adding New Characters to FreeVoice

## File Requirements

For each new character, you need:
1. A preview image: `preview/char_NNN.png` — 200×200px
2. One image per supported symbol, named exactly as listed below

## Naming Convention

Files must be lowercase with underscores:
- happy.png
- sad.png
- angry.png
- scared.png
- tired.png
- sick.png
- bored.png
- love.png
- frustrated.png
- good.png
- worried.png
- excited.png
- nervous.png
- calm.png
- confused.png
- surprised.png
- proud.png
- lonely.png
- embarrassed.png
- hurt_feelings.png
- shy.png
- silly.png
- grateful.png
- disappointed.png

## Image Specifications

- Format: PNG with transparent background
- Size: 500×500px (will be displayed at 52–96px)
- Style: Full color, expressive, appropriate for children ages 3–12
- Consistent: Same character, same clothing, same art style across all emotions

## Adding a Character

1. Add image files to `public/characters/symbols/char_NNN/emotions/`
2. Add preview image to `public/characters/preview/char_NNN.png`
3. Add entry to `public/characters/manifest.json`
4. Run the app and test the character picker

## Expanding to New Categories

When adding character art for body/health, social, school, etc:
1. Add images to `public/characters/symbols/char_NNN/{category}/`
2. Update `supportedCategories` in manifest.json for that character
3. Add the new label → filename mappings to
   `src/utils/characterUtils.ts` CATEGORY_LABELS map
```

---

## Step 11 — Diversity Matrix

This is the target character set to create. Document in
`public/characters/DIVERSITY_MATRIX.md` so Niki/design knows
exactly what to build:

```markdown
# FreeVoice Character Diversity Matrix

## Target Character Set

We want every child to see themselves in FreeVoice.
The full character set covers all combinations of:
- 5 skin tones × 2 primary genders × 2 hair types = 20 characters minimum
- Plus neutral/non-binary variants and hair color variations

## Priority 1 — Build First (matches available languages)

| ID | Name | Gender | Skin Tone | Hair | Language Region |
|---|---|---|---|---|---|
| char_001 | Alex | Boy | Light | Straight/Brown | English, French, German |
| char_002 | Jordan | Boy | Dark | Curly/Black | English (US), Portuguese |
| char_003 | Sofia | Girl | Light | Straight/Brown | English, French, German |
| char_004 | Amara | Girl | Dark | Curly/Black | English (US) |
| char_005 | Miguel | Boy | Medium | Wavy/Black | Spanish, Portuguese |
| char_006 | Isabella | Girl | Medium | Wavy/Black | Spanish |
| char_007 | Kai | Neutral | Medium | Straight/Black | English |
| char_008 | Aiko | Girl | Light | Straight/Black | Japanese |
| char_009 | Wei | Boy | Light | Straight/Black | Chinese |
| char_010 | Leila | Girl | Medium-Dark | Curly/Black | Arabic |

## Priority 2 — Expand Next

| ID | Name | Gender | Skin Tone | Hair | Notes |
|---|---|---|---|---|---|
| char_011 | Emma | Girl | Light | Wavy/Blonde | Northern European |
| char_012 | Lucas | Boy | Medium-Light | Wavy/Brown | Mediterranean |
| char_013 | Priya | Girl | Medium | Straight/Black | South Asian |
| char_014 | Arjun | Boy | Medium | Straight/Black | South Asian |
| char_015 | Maya | Girl | Medium-Dark | Coily/Black | African American |
| char_016 | Elijah | Boy | Medium-Dark | Coily/Black | African American |
| char_017 | River | Neutral | Medium-Light | Wavy/Auburn | Gender neutral |
| char_018 | Sasha | Neutral | Medium | Straight/Brown | Gender neutral |
| char_019 | Fatima | Girl | Medium-Dark | Straight/Black | Arabic (hijab optional) |
| char_020 | Liam | Boy | Light | Straight/Red | Irish/Scottish |

## Art Specifications

- All characters wear the same style clothing (currently: green hoodie)
  This creates visual consistency and makes it obvious they're the same
  "character type" just with different representation.
- Background: transparent PNG
- Size: 500×500px
- Each character needs all 24 emotion expressions
- Preview image: character showing HAPPY expression, 200×200px
```

---

## Testing Checklist

### Manifest & Loading
- [ ] `public/characters/manifest.json` loads without 404
- [ ] `useCharacterManifest` hook populates character store
- [ ] Known paths Set is populated after manifest load
- [ ] App works normally if manifest.json is missing (graceful fallback)

### Character Picker Component
- [ ] Shows all characters from manifest
- [ ] Gender filter works (boy/girl/neutral/all)
- [ ] Skin tone filter works (all 6 options)
- [ ] Selecting a character highlights it with amber border + checkmark
- [ ] "Skip — use standard symbols" option works
- [ ] Empty state shows when filters return no results
- [ ] Scrollable when many characters
- [ ] Responsive grid on mobile

### Onboarding Flow
- [ ] Step 3 shows character picker (not skin tone selector)
- [ ] Character name appears in "Start with Alex" button
- [ ] Selecting no character shows "Start FreeVoice" button
- [ ] Selected character persists after onboarding completes
- [ ] Completing onboarding with no character selected works fine

### Settings
- [ ] "Your Character" section visible in Settings (Parent Mode)
- [ ] Shows current character name
- [ ] Changing character in settings updates emotions immediately
- [ ] "Use standard symbols" option reverts to ARASAAC

### SymbolCard Rendering
- [ ] Emotions board uses character images when character selected
- [ ] Emotions board uses ARASAAC when no character selected
- [ ] Image 404 gracefully falls back to ARASAAC
- [ ] Character images fill card without white container
- [ ] ARASAAC images still use white symbol-window container
- [ ] Correct image shown for HAPPY, SAD, FRUSTRATED, HURT FEELINGS
- [ ] Non-emotion symbols still use ARASAAC (food, play, etc.)

### Placeholder Files
- [ ] `npm run create-placeholders` runs without error
- [ ] Placeholder files exist at correct paths
- [ ] App loads without 404 errors in console

---

## Manual Steps (🧑 Human Required)

1. **Create actual character art** — replace placeholder PNGs with
   real illustrations for char_001 (Alex) and char_002 (Jordan).
   File naming exactly as documented: `happy.png`, `hurt_feelings.png`, etc.
   See `public/characters/DIVERSITY_MATRIX.md` for full spec.

2. **Create preview images** — 200×200px preview for each character,
   showing the HAPPY expression. Save to `public/characters/preview/`.

3. **Expand characters** — work through DIVERSITY_MATRIX.md Priority 1
   list to reach full representation across all supported languages.

4. **Future categories** — when body/health character art is ready,
   add files to `public/characters/symbols/char_NNN/body/` and
   update `supportedCategories` in manifest.json.

---

*FreeVoice AAC · Character System Sprint · Shellcraft Labs LLC*
*Every child deserves to see themselves in FreeVoice.*
