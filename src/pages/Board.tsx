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
import { VoiceDownloadPrompt, KokoroDownloadProgress } from '../components/modals/VoiceDownloadPrompt';
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
      <VoiceDownloadPrompt />
      <KokoroDownloadProgress />
      <FastPhrasesStrip />
      <BreadcrumbNav />
      <CoreWordsBar />
      <SymbolGrid />
      <TabBar />
      <SymbolSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <UpdatePrompt />
    </>
  );
}
