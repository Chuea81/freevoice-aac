import { useEffect, useRef, useCallback, useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTTS } from '../hooks/useTTS';
import { SpeechBar } from '../components/SpeechBar/SpeechBar';
import { BreadcrumbNav } from '../components/BreadcrumbNav/BreadcrumbNav';
import { SymbolGrid } from '../components/SymbolGrid/SymbolGrid';
import { TabBar } from '../components/TabBar/TabBar';
import { FastPhrasesStrip } from '../components/FastPhrasesStrip/FastPhrasesStrip';
import { CoreWordsBar } from '../components/CoreWordsBar/CoreWordsBar';
import { IosInstallPrompt } from '../components/modals/IosInstallPrompt';
import { AndroidInstallPrompt } from '../components/modals/AndroidInstallPrompt';
import { SymbolSearch } from '../components/modals/SymbolSearch';
import { OnboardingWizard } from '../components/modals/OnboardingWizard';
import { UpdatePrompt } from '../components/UpdatePrompt/UpdatePrompt';
import { useArasaac } from '../hooks/useArasaac';
import { importBoardFromUrl } from '../utils/backup';

interface Props {
  onOpenParentMode: () => void;
}

export function Board({ onOpenParentMode }: Props) {
  const seedDatabase = useBoardStore((s) => s.seedDatabase);
  const isSeeded = useBoardStore((s) => s.isSeeded);
  const symbolsError = useBoardStore((s) => s.symbolsError);
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const onboardingDone = useSettingsStore((s) => s.onboardingDone);
  const loaded = useSettingsStore((s) => s.loaded);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // useTTS handles iOS unlock internally via useEffect
  useTTS();
  useArasaac();

  // Triple-tap detection for Parent Mode access
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTripleTap = useCallback(() => {
    tapCount.current++;
    if (tapCount.current >= 3) {
      tapCount.current = 0;
      if (tapTimer.current) clearTimeout(tapTimer.current);
      onOpenParentMode();
      return;
    }
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 800);
  }, [onOpenParentMode]);

  useEffect(() => {
    seedDatabase();
  }, [seedDatabase]);

  // Check for shared board in URL params
  useEffect(() => {
    if (!isSeeded) return;
    const params = new URLSearchParams(window.location.search);
    const boardParam = params.get('board');
    if (boardParam) {
      importBoardFromUrl(boardParam).then((result) => {
        if (result.success) {
          alert(`Board "${result.boardName}" added!`);
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
          window.location.reload();
        }
      });
    }
  }, [isSeeded]);

  // Show onboarding on first launch
  useEffect(() => {
    if (loaded && !onboardingDone && isSeeded) {
      setShowOnboarding(true);
    }
  }, [loaded, onboardingDone, isSeeded]);

  // Double-tap zoom prevention is handled by CSS touch-action: manipulation
  // (set globally in index.css). No JS preventDefault needed.

  if (!isSeeded) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100dvh', background: '#FFF9F0',
      }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#BDB5A8' }}>Loading...</p>
      </div>
    );
  }

  // OFF-03: symbols failed to load (e.g. offline first launch). Offer a retry
  // instead of silently showing an empty board.
  if (symbolsError) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, height: '100dvh', background: '#FFF9F0', padding: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: 48 }}>📡</div>
        <p style={{ fontSize: 20, fontWeight: 800, color: '#5A5247', margin: 0 }}>
          Couldn't load symbols
        </p>
        <p style={{ fontSize: 15, color: '#8A8275', margin: 0, maxWidth: 320 }}>
          Check your connection and try again. If you've used FreeVoice before, it should work offline once it loads.
        </p>
        <button
          onClick={() => { seedDatabase(); }}
          style={{
            marginTop: 8, padding: '14px 28px', fontSize: 17, fontWeight: 800,
            color: '#fff', background: '#F59E0B', border: 'none', borderRadius: 14,
            minHeight: 48, cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <>
      <SpeechBar onOpenSettings={onOpenParentMode} />
      <div className="parent-tap-zone" onClick={handleTripleTap} aria-hidden="true" />
      <button className="search-trigger-btn" onClick={() => setSearchOpen(true)} aria-label="Search symbols">
        🔍
      </button>
      <IosInstallPrompt />
      <AndroidInstallPrompt />
      <FastPhrasesStrip />
      <BreadcrumbNav />
      <CoreWordsBar />
      <SymbolGrid />
      <TabBar isParentMode={currentBoardId === 'custom'} />
      <SymbolSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <UpdatePrompt />
    </>
  );
}
