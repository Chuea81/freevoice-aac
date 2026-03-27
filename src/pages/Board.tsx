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

  // Show onboarding on first launch
  useEffect(() => {
    if (loaded && !onboardingDone && isSeeded) {
      setShowOnboarding(true);
    }
  }, [loaded, onboardingDone, isSeeded]);

  // Prevent double-tap zoom on iOS
  useEffect(() => {
    const handler = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchend', handler, { passive: false });
    return () => document.removeEventListener('touchend', handler);
  }, []);

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
      <SpeechBar />
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
