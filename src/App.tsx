import { useState, useEffect } from 'react';
import { Board } from './pages/Board';
import { ParentMode } from './pages/ParentMode';
import { useSettingsStore } from './store/settingsStore';
import { useCharacterManifest } from './hooks/useCharacterManifest';

function App() {
  const [page, setPage] = useState<'board' | 'parent'>('board');
  const loadFromDb = useSettingsStore((s) => s.loadFromDb);
  const cardStyle = useSettingsStore((s) => s.cardStyle);

  // Load persisted settings on mount
  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  // Load character manifest
  useCharacterManifest();

  // Apply card-style class to root for high-contrast mode to affect all chrome
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    root.className = cardStyle !== 'colors' ? `card-style-${cardStyle}` : '';
  }, [cardStyle]);

  if (page === 'parent') {
    return <ParentMode onBack={() => setPage('board')} />;
  }

  return <Board onOpenParentMode={() => setPage('parent')} />;
}

export default App;
