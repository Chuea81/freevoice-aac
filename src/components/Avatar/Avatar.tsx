import { useState, type CSSProperties } from 'react';

export interface AvatarProps {
  characterId: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

const BASE = import.meta.env.BASE_URL;

type HairStyle =
  | 'short-straight'
  | 'short-curls'
  | 'afro'
  | 'long-straight'
  | 'long-bangs'
  | 'twist-puffs'
  | 'curly-shoulder'
  | 'curly-large'
  | 'wavy-messy';

type Accessory =
  | null
  | 'glasses-round'
  | 'glasses-square'
  | 'bow'
  | 'cap'
  | 'beanie'
  | 'headband'
  | 'earrings'
  | 'freckles';

type MouthType = 'closed' | 'open' | 'grin';

interface CharacterStyle {
  skin: string;
  skinShadow: string;
  hair: string;
  hairShadow: string;
  shirt: string;
  hairStyle: HairStyle;
  accessory: Accessory;
  accessoryColor?: string;
  mouth: MouthType;
  blush: string;
}

const OUTLINE = '#2D2D2D';

const STYLES: Record<string, CharacterStyle> = {
  char_001: { skin: '#F5D0A9', skinShadow: '#E2B084', hair: '#A86B3A', hairShadow: '#6B4219', shirt: '#66BB6A', hairStyle: 'short-straight', accessory: null, mouth: 'closed', blush: '#F48FB1' },
  char_002: { skin: '#6B3E1F', skinShadow: '#4A2B14', hair: '#241916', hairShadow: '#0D0807', shirt: '#F48FB1', hairStyle: 'afro', accessory: 'bow', accessoryColor: '#EC407A', mouth: 'grin', blush: '#8B4040' },
  char_003: { skin: '#F5D0A9', skinShadow: '#E2B084', hair: '#B07840', hairShadow: '#7A5028', shirt: '#81C784', hairStyle: 'long-straight', accessory: 'headband', accessoryColor: '#43A047', mouth: 'closed', blush: '#F48FB1' },
  char_004: { skin: '#CE9969', skinShadow: '#A8793F', hair: '#2B1F18', hairShadow: '#0D0807', shirt: '#2196F3', hairStyle: 'short-curls', accessory: null, mouth: 'open', blush: '#A15040' },
  char_005: { skin: '#6B3E1F', skinShadow: '#4A2B14', hair: '#241916', hairShadow: '#0D0807', shirt: '#FFB74D', hairStyle: 'twist-puffs', accessory: 'earrings', mouth: 'closed', blush: '#8B4040' },
  char_006: { skin: '#F5D0A9', skinShadow: '#E2B084', hair: '#2B1F18', hairShadow: '#0D0807', shirt: '#43A047', hairStyle: 'short-straight', accessory: 'glasses-round', mouth: 'closed', blush: '#F48FB1' },
  char_007: { skin: '#F5D0A9', skinShadow: '#E2B084', hair: '#2B1F18', hairShadow: '#0D0807', shirt: '#CE93D8', hairStyle: 'long-bangs', accessory: null, mouth: 'open', blush: '#F48FB1' },
  char_008: { skin: '#CE9969', skinShadow: '#A8793F', hair: '#241916', hairShadow: '#0D0807', shirt: '#F06292', hairStyle: 'curly-shoulder', accessory: 'earrings', mouth: 'grin', blush: '#A15040' },
  char_009: { skin: '#CE9969', skinShadow: '#A8793F', hair: '#8B5A32', hairShadow: '#5C3A1A', shirt: '#80CBC4', hairStyle: 'wavy-messy', accessory: 'beanie', accessoryColor: '#43A047', mouth: 'closed', blush: '#A15040' },
  char_010: { skin: '#9C6B44', skinShadow: '#6B4A2B', hair: '#2B1F18', hairShadow: '#0D0807', shirt: '#FFD54F', hairStyle: 'curly-large', accessory: 'headband', accessoryColor: '#EC407A', mouth: 'open', blush: '#8F4D3A' },
  char_011: { skin: '#6B3E1F', skinShadow: '#4A2B14', hair: '#241916', hairShadow: '#0D0807', shirt: '#5C6BC0', hairStyle: 'short-curls', accessory: null, mouth: 'closed', blush: '#8B4040' },
  char_012: { skin: '#F5D0A9', skinShadow: '#E2B084', hair: '#F0CC70', hairShadow: '#C49B42', shirt: '#F8BBD0', hairStyle: 'long-straight', accessory: 'bow', accessoryColor: '#EC407A', mouth: 'open', blush: '#F48FB1' },
  char_013: { skin: '#6B3E1F', skinShadow: '#4A2B14', hair: '#241916', hairShadow: '#0D0807', shirt: '#AED581', hairStyle: 'curly-large', accessory: null, mouth: 'grin', blush: '#8B4040' },
  char_014: { skin: '#E0AD82', skinShadow: '#B8855A', hair: '#2B1F18', hairShadow: '#0D0807', shirt: '#64B5F6', hairStyle: 'short-straight', accessory: null, mouth: 'closed', blush: '#C7765A' },
  char_015: { skin: '#F5D0A9', skinShadow: '#E2B084', hair: '#C84421', hairShadow: '#8B2B14', shirt: '#7E57C2', hairStyle: 'long-straight', accessory: 'freckles', mouth: 'closed', blush: '#F48FB1' },
  char_016: { skin: '#F5D0A9', skinShadow: '#E2B084', hair: '#C84421', hairShadow: '#8B2B14', shirt: '#26A69A', hairStyle: 'short-straight', accessory: 'freckles', mouth: 'open', blush: '#F48FB1' },
  char_017: { skin: '#F5D0A9', skinShadow: '#E2B084', hair: '#F0CC70', hairShadow: '#C49B42', shirt: '#FFA726', hairStyle: 'short-straight', accessory: 'freckles', mouth: 'closed', blush: '#F48FB1' },
  char_018: { skin: '#CE9969', skinShadow: '#A8793F', hair: '#241916', hairShadow: '#0D0807', shirt: '#7B1FA2', hairStyle: 'long-straight', accessory: 'beanie', accessoryColor: '#1A1A1A', mouth: 'closed', blush: '#A15040' },
  char_019: { skin: '#CE9969', skinShadow: '#A8793F', hair: '#241916', hairShadow: '#0D0807', shirt: '#1976D2', hairStyle: 'short-straight', accessory: 'cap', accessoryColor: '#FFFFFF', mouth: 'closed', blush: '#A15040' },
  char_020: { skin: '#9C6B44', skinShadow: '#6B4A2B', hair: '#241916', hairShadow: '#0D0807', shirt: '#43A047', hairStyle: 'short-straight', accessory: null, mouth: 'open', blush: '#8F4D3A' },
  char_021: { skin: '#F5D0A9', skinShadow: '#E2B084', hair: '#A86B3A', hairShadow: '#6B4219', shirt: '#EC407A', hairStyle: 'curly-shoulder', accessory: 'freckles', mouth: 'open', blush: '#F48FB1' },
  char_022: { skin: '#CE9969', skinShadow: '#A8793F', hair: '#241916', hairShadow: '#0D0807', shirt: '#FF7043', hairStyle: 'long-straight', accessory: null, mouth: 'grin', blush: '#A15040' },
  char_023: { skin: '#F5D0A9', skinShadow: '#E2B084', hair: '#A86B3A', hairShadow: '#6B4219', shirt: '#42A5F5', hairStyle: 'wavy-messy', accessory: 'freckles', mouth: 'open', blush: '#F48FB1' },
  char_024: { skin: '#6B3E1F', skinShadow: '#4A2B14', hair: '#241916', hairShadow: '#0D0807', shirt: '#FFCA28', hairStyle: 'curly-large', accessory: null, mouth: 'grin', blush: '#8B4040' },
  char_025: { skin: '#9C6B44', skinShadow: '#6B4A2B', hair: '#241916', hairShadow: '#0D0807', shirt: '#26C6DA', hairStyle: 'long-bangs', accessory: null, mouth: 'closed', blush: '#8F4D3A' },
  char_026: { skin: '#9C6B44', skinShadow: '#6B4A2B', hair: '#241916', hairShadow: '#0D0807', shirt: '#AB47BC', hairStyle: 'long-straight', accessory: 'earrings', mouth: 'open', blush: '#8F4D3A' },
  char_027: { skin: '#6B3E1F', skinShadow: '#4A2B14', hair: '#241916', hairShadow: '#0D0807', shirt: '#26A69A', hairStyle: 'short-straight', accessory: null, mouth: 'closed', blush: '#8B4040' },
};

const FALLBACK: CharacterStyle = STYLES.char_001;

function BackHair({ s }: { s: CharacterStyle }) {
  switch (s.hairStyle) {
    case 'long-straight':
      return (
        <g>
          <path d="M32 54 Q30 100 44 112 L46 64 Q34 58 34 48 Z" fill={s.hair} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M96 54 Q98 100 84 112 L82 64 Q94 58 94 48 Z" fill={s.hair} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M34 86 Q36 104 44 110" stroke={s.hairShadow} strokeWidth="2" fill="none" opacity="0.45" />
          <path d="M94 86 Q92 104 84 110" stroke={s.hairShadow} strokeWidth="2" fill="none" opacity="0.45" />
        </g>
      );
    case 'long-bangs':
      return (
        <g>
          <path d="M30 54 Q28 102 42 114 L44 64 Q34 58 34 48 Z" fill={s.hair} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M98 54 Q100 102 86 114 L84 64 Q94 58 94 48 Z" fill={s.hair} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M32 88 Q34 106 42 112" stroke={s.hairShadow} strokeWidth="2" fill="none" opacity="0.45" />
          <path d="M96 88 Q94 106 86 112" stroke={s.hairShadow} strokeWidth="2" fill="none" opacity="0.45" />
        </g>
      );
    case 'curly-shoulder':
      return (
        <g fill={s.hair} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round">
          <circle cx="34" cy="92" r="8" />
          <circle cx="40" cy="100" r="7" />
          <circle cx="94" cy="92" r="8" />
          <circle cx="88" cy="100" r="7" />
          <path d="M32 50 Q28 94 44 102 L44 64 Q34 58 34 48 Z" />
          <path d="M96 50 Q100 94 84 102 L84 64 Q94 58 94 48 Z" />
        </g>
      );
    case 'curly-large':
      return (
        <g fill={s.hair} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round">
          <circle cx="28" cy="68" r="10" />
          <circle cx="100" cy="68" r="10" />
          <circle cx="26" cy="84" r="10" />
          <circle cx="102" cy="84" r="10" />
          <circle cx="32" cy="96" r="9" />
          <circle cx="96" cy="96" r="9" />
          <path d="M30 50 Q26 92 44 96 L44 62 Z" />
          <path d="M98 50 Q102 92 84 96 L84 62 Z" />
        </g>
      );
    default:
      return null;
  }
}

function FrontHair({ s }: { s: CharacterStyle }) {
  switch (s.hairStyle) {
    case 'short-straight':
      return (
        <g>
          <path d="M36 60 Q34 30 64 26 Q94 30 92 60 Q90 50 80 46 L48 46 Q38 50 36 60 Z" fill={s.hair} stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M44 36 Q54 30 64 30 Q72 30 80 34" stroke={s.hairShadow} strokeWidth="1.4" fill="none" opacity="0.45" strokeLinecap="round" />
          <path d="M58 28 Q62 40 54 48" stroke={s.hairShadow} strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
        </g>
      );
    case 'short-curls':
      return (
        <g>
          <g fill={s.hair} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round">
            <circle cx="40" cy="44" r="8" />
            <circle cx="50" cy="34" r="8" />
            <circle cx="62" cy="28" r="9" />
            <circle cx="74" cy="28" r="9" />
            <circle cx="86" cy="34" r="8" />
            <circle cx="92" cy="46" r="8" />
            <path d="M36 48 Q38 38 64 36 Q90 38 92 48 L92 52 L36 52 Z" />
          </g>
          <circle cx="62" cy="26" r="2" fill={s.hairShadow} opacity="0.45" />
          <circle cx="48" cy="34" r="1.6" fill={s.hairShadow} opacity="0.45" />
          <circle cx="86" cy="34" r="1.6" fill={s.hairShadow} opacity="0.45" />
        </g>
      );
    case 'afro':
      return (
        <g>
          <g fill={s.hair} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round">
            <circle cx="30" cy="50" r="12" />
            <circle cx="38" cy="32" r="12" />
            <circle cx="52" cy="22" r="13" />
            <circle cx="70" cy="22" r="13" />
            <circle cx="86" cy="30" r="12" />
            <circle cx="98" cy="48" r="12" />
            <circle cx="44" cy="44" r="10" />
            <circle cx="62" cy="36" r="10" />
            <circle cx="80" cy="40" r="10" />
          </g>
          <circle cx="52" cy="20" r="3" fill={s.hairShadow} opacity="0.35" />
          <circle cx="70" cy="20" r="3" fill={s.hairShadow} opacity="0.35" />
          <circle cx="38" cy="32" r="2.5" fill={s.hairShadow} opacity="0.35" />
          <circle cx="86" cy="30" r="2.5" fill={s.hairShadow} opacity="0.35" />
        </g>
      );
    case 'long-straight':
      return (
        <g>
          <path d="M32 56 Q30 26 64 22 Q98 26 96 56 L92 44 Q64 34 36 44 Z" fill={s.hair} stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M64 22 L64 46" stroke={s.hairShadow} strokeWidth="1.1" fill="none" opacity="0.35" />
          <path d="M44 36 Q54 32 62 32" stroke={s.hairShadow} strokeWidth="1.2" fill="none" opacity="0.4" strokeLinecap="round" />
          <path d="M84 36 Q74 32 66 32" stroke={s.hairShadow} strokeWidth="1.2" fill="none" opacity="0.4" strokeLinecap="round" />
        </g>
      );
    case 'long-bangs':
      return (
        <g>
          <path d="M32 50 L34 28 Q64 20 94 28 L96 50 L86 46 L78 52 L70 46 L62 52 L54 46 L46 52 L38 46 Z" fill={s.hair} stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M44 30 Q64 24 84 30" stroke={s.hairShadow} strokeWidth="1.4" fill="none" opacity="0.4" strokeLinecap="round" />
          <path d="M56 26 Q60 38 54 46" stroke={s.hairShadow} strokeWidth="1.1" fill="none" opacity="0.3" strokeLinecap="round" />
        </g>
      );
    case 'twist-puffs':
      return (
        <g>
          <g fill={s.hair} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round">
            <circle cx="32" cy="38" r="13" />
            <circle cx="96" cy="38" r="13" />
            <path d="M36 48 Q36 24 64 22 Q92 24 92 48 L92 44 Q64 32 36 44 Z" />
          </g>
          <path d="M26 34 Q32 28 38 34" stroke={s.hairShadow} strokeWidth="1.4" fill="none" opacity="0.5" strokeLinecap="round" />
          <path d="M28 42 Q34 38 40 42" stroke={s.hairShadow} strokeWidth="1.3" fill="none" opacity="0.45" strokeLinecap="round" />
          <path d="M90 34 Q96 28 102 34" stroke={s.hairShadow} strokeWidth="1.4" fill="none" opacity="0.5" strokeLinecap="round" />
          <path d="M88 42 Q94 38 100 42" stroke={s.hairShadow} strokeWidth="1.3" fill="none" opacity="0.45" strokeLinecap="round" />
          <path d="M50 34 Q64 28 78 34" stroke={s.hairShadow} strokeWidth="1.2" fill="none" opacity="0.4" strokeLinecap="round" />
        </g>
      );
    case 'curly-shoulder':
      return (
        <g>
          <g fill={s.hair} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round">
            <circle cx="40" cy="32" r="10" />
            <circle cx="54" cy="24" r="10" />
            <circle cx="68" cy="22" r="11" />
            <circle cx="82" cy="26" r="10" />
            <circle cx="92" cy="38" r="9" />
            <path d="M36 44 Q38 34 64 32 Q90 34 92 44 L92 50 L36 50 Z" />
          </g>
          <circle cx="52" cy="24" r="2" fill={s.hairShadow} opacity="0.4" />
          <circle cx="68" cy="20" r="2" fill={s.hairShadow} opacity="0.4" />
          <circle cx="82" cy="26" r="1.8" fill={s.hairShadow} opacity="0.4" />
        </g>
      );
    case 'curly-large':
      return (
        <g>
          <g fill={s.hair} stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round">
            <circle cx="30" cy="40" r="12" />
            <circle cx="38" cy="26" r="11" />
            <circle cx="52" cy="18" r="12" />
            <circle cx="68" cy="16" r="12" />
            <circle cx="84" cy="22" r="12" />
            <circle cx="96" cy="38" r="11" />
            <circle cx="46" cy="36" r="9" />
            <circle cx="64" cy="30" r="9" />
            <circle cx="82" cy="34" r="9" />
          </g>
          <circle cx="52" cy="16" r="3" fill={s.hairShadow} opacity="0.35" />
          <circle cx="68" cy="14" r="3" fill={s.hairShadow} opacity="0.35" />
          <circle cx="30" cy="40" r="2.5" fill={s.hairShadow} opacity="0.35" />
          <circle cx="96" cy="38" r="2.5" fill={s.hairShadow} opacity="0.35" />
        </g>
      );
    case 'wavy-messy':
      return (
        <g>
          <path d="M34 54 Q28 22 48 24 Q56 18 64 22 Q72 18 80 24 Q100 22 94 54 L90 42 Q80 36 64 38 Q48 36 38 42 Z" fill={s.hair} stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M42 32 Q52 26 62 32 Q72 26 82 32" stroke={s.hairShadow} strokeWidth="1.4" fill="none" opacity="0.45" strokeLinecap="round" />
          <path d="M38 40 Q50 34 62 40" stroke={s.hairShadow} strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
        </g>
      );
  }
}

function AccessoryLayer({ s }: { s: CharacterStyle }) {
  if (!s.accessory) return null;
  switch (s.accessory) {
    case 'glasses-round':
      return (
        <g stroke={OUTLINE} strokeWidth="1.8" fill="none">
          <circle cx="53" cy="61" r="8" fill="#FFFFFF" fillOpacity="0.25" />
          <circle cx="75" cy="61" r="8" fill="#FFFFFF" fillOpacity="0.25" />
          <line x1="61" y1="61" x2="67" y2="61" />
        </g>
      );
    case 'glasses-square':
      return (
        <g stroke={OUTLINE} strokeWidth="1.8" fill="none">
          <rect x="45" y="54" width="16" height="14" rx="3" fill="#FFFFFF" fillOpacity="0.25" />
          <rect x="67" y="54" width="16" height="14" rx="3" fill="#FFFFFF" fillOpacity="0.25" />
          <line x1="61" y1="61" x2="67" y2="61" />
        </g>
      );
    case 'bow':
      return (
        <g stroke={OUTLINE} strokeWidth="1" strokeLinejoin="round">
          <path d="M48 22 L62 30 L62 40 L48 48 Z" fill={s.accessoryColor ?? '#EC407A'} />
          <path d="M80 22 L66 30 L66 40 L80 48 Z" fill={s.accessoryColor ?? '#EC407A'} />
          <rect x="60" y="28" width="8" height="14" rx="2" fill={s.accessoryColor ?? '#EC407A'} />
          <path d="M52 28 Q56 32 60 34" stroke="#FFFFFF" strokeWidth="1.2" fill="none" opacity="0.5" />
          <path d="M76 28 Q72 32 68 34" stroke="#FFFFFF" strokeWidth="1.2" fill="none" opacity="0.5" />
        </g>
      );
    case 'cap':
      return (
        <g stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round">
          <path d="M34 34 Q34 12 64 12 Q94 12 94 34 L94 38 L34 38 Z" fill={s.accessoryColor ?? '#E53935'} />
          <path d="M34 38 L16 46 Q14 42 18 38 L34 36 Z" fill={s.accessoryColor ?? '#E53935'} />
          <circle cx="64" cy="14" r="3" fill={s.hair} />
          <rect x="34" y="36" width="60" height="3" fill="#FFFFFF" opacity="0.3" stroke="none" />
        </g>
      );
    case 'beanie':
      return (
        <g stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round">
          <path d="M30 40 Q30 10 64 10 Q98 10 98 40 Z" fill={s.accessoryColor ?? '#43A047'} />
          <rect x="30" y="38" width="68" height="10" rx="2" fill={s.accessoryColor ?? '#43A047'} />
          <circle cx="64" cy="8" r="4" fill={s.accessoryColor ?? '#43A047'} />
          <rect x="30" y="42" width="68" height="2" fill="#FFFFFF" opacity="0.35" stroke="none" />
          <path d="M40 20 L40 38 M56 16 L56 38 M72 16 L72 38 M88 20 L88 38" stroke={OUTLINE} strokeWidth="0.8" fill="none" opacity="0.15" />
        </g>
      );
    case 'headband':
      return (
        <g>
          <rect x="30" y="42" width="68" height="6" rx="3" fill={s.accessoryColor ?? '#43A047'} stroke={OUTLINE} strokeWidth="1.2" />
          <rect x="30" y="44" width="68" height="1.5" fill="#FFFFFF" opacity="0.4" />
        </g>
      );
    case 'earrings':
      return (
        <g fill="#FFB74D" stroke={OUTLINE} strokeWidth="0.8">
          <circle cx="36" cy="68" r="2.5" />
          <circle cx="92" cy="68" r="2.5" />
          <circle cx="35.5" cy="67.5" r="0.8" fill="#FFFFFF" stroke="none" />
          <circle cx="91.5" cy="67.5" r="0.8" fill="#FFFFFF" stroke="none" />
        </g>
      );
    case 'freckles':
      return (
        <g fill="#8B5A2B" opacity="0.7">
          <circle cx="48" cy="66" r="1.1" />
          <circle cx="52" cy="69" r="1.1" />
          <circle cx="76" cy="69" r="1.1" />
          <circle cx="80" cy="66" r="1.1" />
          <circle cx="54" cy="72" r="0.8" />
          <circle cx="74" cy="72" r="0.8" />
          <circle cx="46" cy="70" r="0.7" />
          <circle cx="82" cy="70" r="0.7" />
        </g>
      );
  }
}

function MouthShape({ type }: { type: MouthType }) {
  switch (type) {
    case 'closed':
      return (
        <path d="M56 75 Q64 80 72 75" stroke={OUTLINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      );
    case 'open':
      return (
        <g>
          <path d="M57 74 Q64 82 71 74 Q64 80 57 74 Z" fill="#A94040" stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M58 75 L70 75 L69 76.5 Q64 78 59 76.5 Z" fill="#FFFFFF" />
        </g>
      );
    case 'grin':
      return (
        <g>
          <path d="M54 74 Q64 84 74 74 Q64 82 54 74 Z" fill="#A94040" stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M56 75 L72 75 L71 77 Q64 79 57 77 Z" fill="#FFFFFF" />
          <line x1="64" y1="75" x2="64" y2="77" stroke={OUTLINE} strokeWidth="0.6" opacity="0.3" />
        </g>
      );
  }
}

function AvatarSVG({ characterId, size = 80, className, style, 'aria-label': ariaLabel }: AvatarProps) {
  const s = STYLES[characterId] ?? FALLBACK;
  const hatCovers = s.accessory === 'cap' || s.accessory === 'beanie';

  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={className}
      style={style}
      role="img"
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      {/* Shirt */}
      <path d="M6 128 Q10 96 44 92 Q50 104 64 104 Q78 104 84 92 Q118 96 122 128 Z" fill={s.shirt} stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M44 92 Q50 104 64 104 Q78 104 84 92" stroke={OUTLINE} strokeWidth="1.2" fill="none" opacity="0.25" />

      {/* Neck */}
      <path d="M56 82 L56 96 Q56 100 64 100 Q72 100 72 96 L72 82 Z" fill={s.skin} stroke={OUTLINE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M56 92 Q64 95 72 92" stroke={s.skinShadow} strokeWidth="1.4" fill="none" opacity="0.5" />

      {/* Back hair (behind head) */}
      <BackHair s={s} />

      {/* Ears */}
      <ellipse cx="37" cy="62" rx="3.5" ry="5" fill={s.skin} stroke={OUTLINE} strokeWidth="1.2" />
      <ellipse cx="91" cy="62" rx="3.5" ry="5" fill={s.skin} stroke={OUTLINE} strokeWidth="1.2" />
      <path d="M37 61 Q38.5 62 37 64" stroke={s.skinShadow} strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M91 61 Q89.5 62 91 64" stroke={s.skinShadow} strokeWidth="1" fill="none" opacity="0.6" />

      {/* Head */}
      <ellipse cx="64" cy="58" rx="26" ry="27" fill={s.skin} stroke={OUTLINE} strokeWidth="1.5" />
      <path d="M46 76 Q64 92 82 76" stroke={s.skinShadow} strokeWidth="1.4" fill="none" opacity="0.4" />

      {/* Cheek blush */}
      <ellipse cx="46" cy="68" rx="4.5" ry="3" fill={s.blush} opacity="0.5" />
      <ellipse cx="82" cy="68" rx="4.5" ry="3" fill={s.blush} opacity="0.5" />

      {/* Eyebrows */}
      <path d="M46 52 Q53 49 60 52" stroke={OUTLINE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M68 52 Q75 49 82 52" stroke={OUTLINE} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Eye whites */}
      <ellipse cx="53" cy="61" rx="4" ry="4.5" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="1" />
      <ellipse cx="75" cy="61" rx="4" ry="4.5" fill="#FFFFFF" stroke={OUTLINE} strokeWidth="1" />
      {/* Pupils */}
      <ellipse cx="53" cy="62" rx="2.5" ry="3" fill={OUTLINE} />
      <ellipse cx="75" cy="62" rx="2.5" ry="3" fill={OUTLINE} />
      {/* Eye highlights */}
      <circle cx="54.2" cy="60.5" r="1" fill="#FFFFFF" />
      <circle cx="76.2" cy="60.5" r="1" fill="#FFFFFF" />

      {/* Nose */}
      <path d="M62 68 Q64 71 66 68" stroke={OUTLINE} strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* Mouth */}
      <MouthShape type={s.mouth} />

      {/* Front hair (below hat if hat covers hair) */}
      {!hatCovers && <FrontHair s={s} />}

      {/* Accessory */}
      <AccessoryLayer s={s} />
    </svg>
  );
}

export function Avatar({ characterId, size = 80, className, style, 'aria-label': ariaLabel }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <AvatarSVG
        characterId={characterId}
        size={size}
        className={className}
        style={style}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <img
      src={`${BASE}characters/preview/${characterId}.png`}
      width={size}
      height={size}
      alt={ariaLabel ?? ''}
      onError={() => setImageFailed(true)}
      className={className}
      style={{
        objectFit: 'cover',
        objectPosition: 'center',
        display: 'block',
        ...style,
      }}
    />
  );
}
