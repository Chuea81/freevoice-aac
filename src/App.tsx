import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Board } from './pages/Board';
import { ParentMode } from './pages/ParentMode';
import { useSettingsStore } from './store/settingsStore';
import { useCharacterManifest } from './hooks/useCharacterManifest';
import { RTL_LANGUAGES, CJK_LANGUAGES, type SupportedLanguage } from './i18n/index';

function App() {
  const [page, setPage] = useState<'board' | 'parent'>('board');
  const loadFromDb = useSettingsStore((s) => s.loadFromDb);
  const cardStyle = useSettingsStore((s) => s.cardStyle);
  const { i18n } = useTranslation();

  useEffect(() => { loadFromDb(); }, [loadFromDb]);
  useCharacterManifest();

  // Card style class
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    root.className = cardStyle !== 'colors' ? `card-style-${cardStyle}` : '';
  }, [cardStyle]);

  // RTL + language direction
  useEffect(() => {
    const lang = i18n.language as SupportedLanguage;
    const isRTL = RTL_LANGUAGES.includes(lang);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    // CJK font loading
    if (CJK_LANGUAGES.includes(lang)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = lang === 'ja'
        ? 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&display=swap'
        : 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700;900&display=swap';
      link.id = 'cjk-font';
      const existing = document.getElementById('cjk-font');
      if (existing) existing.remove();
      document.head.appendChild(link);
    }
  }, [i18n.language]);

  if (page === 'parent') {
    return (
      <ParentMode onBack={() => setPage('board')} />
    );
  }

  return (
    <Board onOpenParentMode={() => setPage('parent')} />
  );
}

export default App;
