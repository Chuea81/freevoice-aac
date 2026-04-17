import { create } from 'zustand';
import { db } from '../db';

export type LabelPosition = 'below' | 'above' | 'hidden';
export type ColorScheme = 'default' | 'fitzgerald';
export type SkinTone = 'default' | 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';

interface SettingsState {
  gridColumns: number;
  symbolSize: 'small' | 'medium' | 'large';
  cardStyle: 'colors' | 'pastel' | 'high-contrast';
  autoSpeak: boolean;
  loaded: boolean;
  // TDSnap features
  labelPosition: LabelPosition;
  colorScheme: ColorScheme;
  skinTone: SkinTone;
  auditoryTouch: boolean;
  dwellTime: number;
  showFastPhrases: boolean;
  showCoreWords: boolean;
  onboardingDone: boolean;
  androidInstallDismissed: boolean;
  touchDelay: number;

  setGridColumns: (cols: number) => void;
  setSymbolSize: (size: 'small' | 'medium' | 'large') => void;
  setCardStyle: (style: 'colors' | 'pastel' | 'high-contrast') => void;
  setAutoSpeak: (on: boolean) => void;
  setLabelPosition: (pos: LabelPosition) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setSkinTone: (tone: SkinTone) => void;
  setAuditoryTouch: (on: boolean) => void;
  setDwellTime: (ms: number) => void;
  setShowFastPhrases: (on: boolean) => void;
  setShowCoreWords: (on: boolean) => void;
  setOnboardingDone: (done: boolean) => void;
  setAndroidInstallDismissed: (dismissed: boolean) => void;
  setTouchDelay: (ms: number) => void;
  loadFromDb: () => Promise<void>;
}

async function persist(key: string, value: string) {
  await db.settings.put({ key, value });
}

export const useSettingsStore = create<SettingsState>((set) => ({
  gridColumns: 0,
  symbolSize: 'medium',
  cardStyle: 'colors',
  autoSpeak: true,
  loaded: false,
  labelPosition: 'below',
  colorScheme: 'default',
  skinTone: 'default',
  auditoryTouch: false,
  dwellTime: 0,
  showFastPhrases: true,
  showCoreWords: true,
  onboardingDone: false,
  androidInstallDismissed: false,
  touchDelay: 0,

  setGridColumns: (cols) => { set({ gridColumns: cols }); persist('gridColumns', String(cols)); },
  setSymbolSize: (size) => { set({ symbolSize: size }); persist('symbolSize', size); },
  setCardStyle: (style) => { set({ cardStyle: style }); persist('cardStyle', style); },
  setAutoSpeak: (on) => { set({ autoSpeak: on }); persist('autoSpeak', String(on)); },
  setLabelPosition: (pos) => { set({ labelPosition: pos }); persist('labelPosition', pos); },
  setColorScheme: (scheme) => { set({ colorScheme: scheme }); persist('colorScheme', scheme); },
  setSkinTone: (tone) => { set({ skinTone: tone }); persist('skinTone', tone); },
  setAuditoryTouch: (on) => { set({ auditoryTouch: on }); persist('auditoryTouch', String(on)); },
  setDwellTime: (ms) => { set({ dwellTime: ms }); persist('dwellTime', String(ms)); },
  setShowFastPhrases: (on) => { set({ showFastPhrases: on }); persist('showFastPhrases', String(on)); },
  setShowCoreWords: (on) => { set({ showCoreWords: on }); persist('showCoreWords', String(on)); },
  setOnboardingDone: (done) => { set({ onboardingDone: done }); persist('onboardingDone', String(done)); },
  setAndroidInstallDismissed: (dismissed) => { set({ androidInstallDismissed: dismissed }); persist('androidInstallDismissed', String(dismissed)); },
  setTouchDelay: (ms) => { set({ touchDelay: ms }); persist('touchDelay', String(ms)); },

  loadFromDb: async () => {
    const all = await db.settings.toArray();
    const map = new Map(all.map((s) => [s.key, s.value]));

    set({
      loaded: true,
      ...(map.has('gridColumns') && { gridColumns: Number(map.get('gridColumns')) }),
      ...(map.has('symbolSize') && { symbolSize: map.get('symbolSize') as 'small' | 'medium' | 'large' }),
      ...(map.has('cardStyle') && { cardStyle: map.get('cardStyle') as 'colors' | 'pastel' | 'high-contrast' }),
      ...(map.has('autoSpeak') && { autoSpeak: map.get('autoSpeak') === 'true' }),
      ...(map.has('labelPosition') && { labelPosition: map.get('labelPosition') as LabelPosition }),
      ...(map.has('colorScheme') && { colorScheme: map.get('colorScheme') as ColorScheme }),
      ...(map.has('skinTone') && { skinTone: map.get('skinTone') as SkinTone }),
      ...(map.has('auditoryTouch') && { auditoryTouch: map.get('auditoryTouch') === 'true' }),
      ...(map.has('dwellTime') && { dwellTime: Number(map.get('dwellTime')) }),
      // Support both old key (showQuickFires) and new key (showFastPhrases) for migration
      ...(map.has('showFastPhrases') ? { showFastPhrases: map.get('showFastPhrases') === 'true' }
        : map.has('showQuickFires') ? { showFastPhrases: map.get('showQuickFires') === 'true' } : {}),
      ...(map.has('showCoreWords') && { showCoreWords: map.get('showCoreWords') === 'true' }),
      ...(map.has('onboardingDone') && { onboardingDone: map.get('onboardingDone') === 'true' }),
      ...(map.has('androidInstallDismissed') && { androidInstallDismissed: map.get('androidInstallDismissed') === 'true' }),
      ...(map.has('touchDelay') && { touchDelay: Number(map.get('touchDelay')) }),
    });
  },
}));
