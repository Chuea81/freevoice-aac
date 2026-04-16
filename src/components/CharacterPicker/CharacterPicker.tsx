import { useState, useMemo } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import type { Gender, SkinTone } from '../../types/character';

const BASE = import.meta.env.BASE_URL || '/';

interface Props {
  onSelect: (characterId: string) => void;
  showSkipOption?: boolean;
}

const GENDER_OPTIONS: { value: Gender | 'all'; label: string; icon: string }[] = [
  { value: 'all',     label: 'All',     icon: '👥' },
  { value: 'boy',     label: 'Boy',     icon: '👦' },
  { value: 'girl',    label: 'Girl',    icon: '👧' },
  { value: 'neutral', label: 'Neutral', icon: '🧒' },
];

const SKIN_TONE_OPTIONS: { value: SkinTone | 'all'; label: string; swatch: string }[] = [
  { value: 'all',          label: 'All',          swatch: 'linear-gradient(135deg,#FDDBB4,#8B4513)' },
  { value: 'light',        label: 'Light',        swatch: '#FDDBB4' },
  { value: 'medium-light', label: 'Medium Light', swatch: '#E8A87C' },
  { value: 'medium',       label: 'Medium',       swatch: '#C68642' },
  { value: 'medium-dark',  label: 'Medium Dark',  swatch: '#8D5524' },
  { value: 'dark',         label: 'Dark',         swatch: '#4A2512' },
];

export function CharacterPicker({ onSelect, showSkipOption }: Props) {
  const { characters, selectedCharacterId } = useCharacterStore();
  const [skinFilter, setSkinFilter] = useState<SkinTone | 'all'>('all');
  const [genderFilter, setGenderFilter] = useState<Gender | 'all'>('all');

  const filtered = useMemo(() => {
    return characters.filter(c => {
      if (skinFilter !== 'all' && c.skinTone !== skinFilter) return false;
      if (genderFilter !== 'all' && c.gender !== genderFilter) return false;
      return true;
    });
  }, [characters, skinFilter, genderFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Gender filter */}
      <div>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: '11px', fontWeight: 900,
          letterSpacing: '2px', textTransform: 'uppercase',
          color: 'rgba(0,0,0,0.38)', marginBottom: '10px',
        }}>Show</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {GENDER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setGenderFilter(opt.value as Gender | 'all')}
              style={{
                background: genderFilter === opt.value ? 'rgba(67,160,71,0.10)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${genderFilter === opt.value ? 'rgba(67,160,71,0.35)' : 'rgba(0,0,0,0.08)'}`,
                borderRadius: '100px', padding: '8px 18px',
                display: 'flex', alignItems: 'center', gap: '6px',
                cursor: 'pointer', fontFamily: "var(--font-body)",
                fontSize: '13px', fontWeight: 800,
                color: genderFilter === opt.value ? '#2E7D32' : 'rgba(0,0,0,0.55)',
              }}
            >
              <span>{opt.icon}</span>{opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skin tone filter */}
      <div>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: '11px', fontWeight: 900,
          letterSpacing: '2px', textTransform: 'uppercase',
          color: 'rgba(0,0,0,0.38)', marginBottom: '10px',
        }}>Skin Tone</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {SKIN_TONE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSkinFilter(opt.value as SkinTone | 'all')}
              title={opt.label}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: opt.swatch,
                border: `3px solid ${skinFilter === opt.value ? '#43A047' : 'rgba(0,0,0,0.12)'}`,
                cursor: 'pointer',
                transform: skinFilter === opt.value ? 'scale(1.15)' : 'scale(1)',
                position: 'relative',
              }}
            >
              {opt.value === 'all' && (
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🌍</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Character grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: '12px', maxHeight: '400px', overflowY: 'auto', padding: '4px 2px',
      }}>
        {filtered.length === 0 ? (
          <div style={{
            gridColumn: '1/-1', textAlign: 'center', padding: '40px',
            color: 'rgba(0,0,0,0.35)', fontFamily: "var(--font-body)", fontWeight: 700,
          }}>
            No characters match these filters yet. More are being added!
          </div>
        ) : (
          filtered.map(char => {
            const isSelected = selectedCharacterId === char.id;
            return (
              <button
                key={char.id}
                onClick={() => onSelect(char.id)}
                style={{
                  background: isSelected ? 'rgba(67,160,71,0.10)' : '#FFFFFF',
                  border: `2px solid ${isSelected ? '#43A047' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: '18px', padding: '12px 8px 10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#43A047', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 900, color: 'white',
                  }}>✓</div>
                )}
                <img
                  src={`${BASE}${char.previewImage.replace(/^\//, '')}`}
                  alt={char.description}
                  style={{ width: '72px', height: '72px', objectFit: 'contain', borderRadius: '10px' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span style={{
                  fontFamily: "var(--font-body)", fontSize: '12px', fontWeight: 900,
                  color: isSelected ? '#2E7D32' : 'rgba(0,0,0,0.70)', textAlign: 'center', lineHeight: 1.2,
                }}>
                  {char.name}
                </span>
              </button>
            );
          })
        )}
      </div>

      {showSkipOption && (
        <button
          onClick={() => onSelect('none')}
          style={{
            background: 'transparent', border: 'none',
            color: 'rgba(0,0,0,0.35)', fontFamily: "var(--font-body)",
            fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: '8px',
            textDecoration: 'underline', alignSelf: 'center',
          }}
        >
          Skip — use standard symbols
        </button>
      )}
    </div>
  );
}
