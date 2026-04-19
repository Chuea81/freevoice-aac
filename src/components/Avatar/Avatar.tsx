import type { SVGProps } from 'react';

export interface AvatarProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  characterId: string;
  size?: number;
}

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

interface CharacterStyle {
  skin: string;
  hair: string;
  shirt: string;
  hairStyle: HairStyle;
  accessory: Accessory;
  accessoryColor?: string;
}

const STYLES: Record<string, CharacterStyle> = {
  char_001: { skin: '#F2CFA9', hair: '#7B4A26', shirt: '#66BB6A', hairStyle: 'short-straight', accessory: null },
  char_002: { skin: '#5B3A1F', hair: '#1C1410', shirt: '#F48FB1', hairStyle: 'afro',          accessory: 'bow',           accessoryColor: '#F06292' },
  char_003: { skin: '#F2CFA9', hair: '#8B5A2B', shirt: '#81C784', hairStyle: 'long-straight',  accessory: 'headband',      accessoryColor: '#43A047' },
  char_004: { skin: '#C9936A', hair: '#1C1410', shirt: '#2196F3', hairStyle: 'short-curls',    accessory: null },
  char_005: { skin: '#5B3A1F', hair: '#1C1410', shirt: '#FFB74D', hairStyle: 'twist-puffs',    accessory: 'earrings' },
  char_006: { skin: '#F2CFA9', hair: '#1C1410', shirt: '#43A047', hairStyle: 'short-straight', accessory: 'glasses-round' },
  char_007: { skin: '#F2CFA9', hair: '#1C1410', shirt: '#CE93D8', hairStyle: 'long-bangs',     accessory: null },
  char_008: { skin: '#C9936A', hair: '#1C1410', shirt: '#F06292', hairStyle: 'curly-shoulder', accessory: 'earrings' },
  char_009: { skin: '#C9936A', hair: '#5E3A1A', shirt: '#80CBC4', hairStyle: 'wavy-messy',     accessory: 'beanie',        accessoryColor: '#43A047' },
  char_010: { skin: '#8C5A3B', hair: '#1C1410', shirt: '#FFD54F', hairStyle: 'curly-large',    accessory: 'headband',      accessoryColor: '#F06292' },
  char_011: { skin: '#8C5A3B', hair: '#1C1410', shirt: '#5C6BC0', hairStyle: 'short-straight', accessory: 'glasses-square' },
  char_012: { skin: '#F2CFA9', hair: '#E8C270', shirt: '#F8BBD0', hairStyle: 'long-straight',  accessory: 'bow',           accessoryColor: '#F06292' },
  char_013: { skin: '#5B3A1F', hair: '#1C1410', shirt: '#AED581', hairStyle: 'short-curls',    accessory: 'cap',           accessoryColor: '#E53935' },
  char_014: { skin: '#D8A77B', hair: '#1C1410', shirt: '#64B5F6', hairStyle: 'short-straight', accessory: 'freckles' },
};

const FALLBACK: CharacterStyle = STYLES.char_001;

function BackHair({ hairStyle, color }: { hairStyle: HairStyle; color: string }) {
  switch (hairStyle) {
    case 'long-straight':
      return <path d="M30 48 Q30 92 42 102 L44 64 Q34 58 34 46 Z M98 48 Q98 92 86 102 L84 64 Q94 58 94 46 Z" fill={color} />;
    case 'long-bangs':
      return <path d="M30 48 Q28 94 42 104 L44 64 Q34 58 34 46 Z M98 48 Q100 94 86 104 L84 64 Q94 58 94 46 Z" fill={color} />;
    case 'curly-shoulder':
      return <path d="M32 48 Q28 92 44 100 L44 62 Q34 56 34 46 Z M96 48 Q100 92 84 100 L84 62 Q94 56 94 46 Z" fill={color} />;
    case 'curly-large':
      return <path d="M30 50 Q26 92 44 96 L44 62 Z M98 50 Q102 92 84 96 L84 62 Z" fill={color} />;
    default:
      return null;
  }
}

function FrontHair({ hairStyle, color }: { hairStyle: HairStyle; color: string }) {
  switch (hairStyle) {
    case 'short-straight':
      return <path d="M36 52 Q36 26 64 26 Q92 26 92 52 Q92 44 80 42 L48 42 Q36 44 36 52 Z" fill={color} />;
    case 'short-curls':
      return (
        <g fill={color}>
          <circle cx="42" cy="34" r="7" />
          <circle cx="54" cy="26" r="8" />
          <circle cx="66" cy="24" r="8" />
          <circle cx="78" cy="26" r="8" />
          <circle cx="88" cy="34" r="7" />
          <path d="M36 44 Q36 34 64 34 Q92 34 92 44 L92 48 L36 48 Z" />
        </g>
      );
    case 'afro':
      return (
        <g fill={color}>
          <circle cx="32" cy="48" r="11" />
          <circle cx="40" cy="30" r="11" />
          <circle cx="54" cy="22" r="12" />
          <circle cx="72" cy="22" r="12" />
          <circle cx="86" cy="30" r="11" />
          <circle cx="96" cy="48" r="11" />
        </g>
      );
    case 'long-straight':
      return <path d="M34 54 Q32 26 64 24 Q96 26 94 54 L90 46 Q64 36 38 46 Z" fill={color} />;
    case 'long-bangs':
      return <path d="M34 50 L34 28 Q64 22 94 28 L94 50 L86 46 L78 52 L70 46 L62 52 L54 46 L46 52 L38 46 Z" fill={color} />;
    case 'twist-puffs':
      return (
        <g fill={color}>
          <circle cx="34" cy="36" r="13" />
          <circle cx="94" cy="36" r="13" />
          <path d="M36 50 Q36 24 64 24 Q92 24 92 50 L92 44 Q64 32 36 44 Z" />
        </g>
      );
    case 'curly-shoulder':
      return (
        <g fill={color}>
          <circle cx="40" cy="34" r="10" />
          <circle cx="54" cy="26" r="10" />
          <circle cx="68" cy="24" r="10" />
          <circle cx="82" cy="28" r="10" />
          <circle cx="92" cy="40" r="9" />
        </g>
      );
    case 'curly-large':
      return (
        <g fill={color}>
          <circle cx="30" cy="42" r="12" />
          <circle cx="38" cy="28" r="11" />
          <circle cx="52" cy="20" r="12" />
          <circle cx="68" cy="18" r="12" />
          <circle cx="84" cy="24" r="12" />
          <circle cx="96" cy="40" r="11" />
        </g>
      );
    case 'wavy-messy':
      return <path d="M34 52 Q30 22 50 24 Q58 18 66 22 Q74 18 82 24 Q98 24 94 52 L90 44 Q80 38 64 40 Q48 38 38 44 Z" fill={color} />;
  }
}

function AccessoryLayer({ accessory, color }: { accessory: Accessory; color?: string }) {
  if (!accessory) return null;
  switch (accessory) {
    case 'glasses-round':
      return (
        <g stroke="#2B2B2B" strokeWidth={2} fill="none">
          <circle cx="52" cy="60" r="8" fill="#FFFFFF" fillOpacity={0.35} />
          <circle cx="76" cy="60" r="8" fill="#FFFFFF" fillOpacity={0.35} />
          <line x1="60" y1="60" x2="68" y2="60" />
        </g>
      );
    case 'glasses-square':
      return (
        <g stroke="#2B2B2B" strokeWidth={2} fill="none">
          <rect x="44" y="52" width="16" height="14" rx="3" fill="#FFFFFF" fillOpacity={0.35} />
          <rect x="68" y="52" width="16" height="14" rx="3" fill="#FFFFFF" fillOpacity={0.35} />
          <line x1="60" y1="59" x2="68" y2="59" />
        </g>
      );
    case 'bow':
      return (
        <g fill={color ?? '#F06292'}>
          <path d="M50 26 L62 32 L62 40 L50 44 Z" />
          <path d="M78 26 L66 32 L66 40 L78 44 Z" />
          <rect x="60" y="30" width="8" height="10" rx="2" />
        </g>
      );
    case 'cap':
      return (
        <g fill={color ?? '#E53935'}>
          <path d="M34 34 Q34 16 64 16 Q94 16 94 34 L94 38 L34 38 Z" />
          <path d="M34 38 L20 44 L34 42 Z" />
        </g>
      );
    case 'beanie':
      return (
        <g fill={color ?? '#43A047'}>
          <path d="M32 38 Q32 14 64 14 Q96 14 96 38 Z" />
          <rect x="32" y="36" width="64" height="8" />
          <circle cx="64" cy="12" r="4" />
        </g>
      );
    case 'headband':
      return <rect x="32" y="42" width="64" height="5" rx="2" fill={color ?? '#43A047'} />;
    case 'earrings':
      return (
        <g fill="#FFB74D">
          <circle cx="35" cy="66" r="2.5" />
          <circle cx="93" cy="66" r="2.5" />
        </g>
      );
    case 'freckles':
      return (
        <g fill="#9B6A3F" fillOpacity={0.6}>
          <circle cx="50" cy="64" r="1.2" />
          <circle cx="54" cy="67" r="1.2" />
          <circle cx="74" cy="67" r="1.2" />
          <circle cx="78" cy="64" r="1.2" />
        </g>
      );
  }
}

export function Avatar({ characterId, size = 80, className, ...rest }: AvatarProps) {
  const s = STYLES[characterId] ?? FALLBACK;
  const hatCovers = s.accessory === 'cap' || s.accessory === 'beanie';

  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-hidden={rest['aria-label'] ? undefined : true}
      {...rest}
    >
      <path d="M8 128 Q12 96 46 94 Q52 104 64 104 Q76 104 82 94 Q116 96 120 128 Z" fill={s.shirt} />
      <rect x="56" y="84" width="16" height="14" fill={s.skin} />
      <BackHair hairStyle={s.hairStyle} color={s.hair} />
      <circle cx="64" cy="58" r="28" fill={s.skin} />
      <ellipse cx="37" cy="60" rx="3" ry="5" fill={s.skin} />
      <ellipse cx="91" cy="60" rx="3" ry="5" fill={s.skin} />
      <circle cx="54" cy="60" r="2.4" fill="#2B2B2B" />
      <circle cx="74" cy="60" r="2.4" fill="#2B2B2B" />
      <ellipse cx="48" cy="68" rx="4" ry="2.5" fill="#F48FB1" fillOpacity={0.5} />
      <ellipse cx="80" cy="68" rx="4" ry="2.5" fill="#F48FB1" fillOpacity={0.5} />
      <path d="M57 72 Q64 78 71 72" stroke="#2B2B2B" strokeWidth={2} fill="none" strokeLinecap="round" />
      {!hatCovers && <FrontHair hairStyle={s.hairStyle} color={s.hair} />}
      <AccessoryLayer accessory={s.accessory} color={s.accessoryColor} />
    </svg>
  );
}
