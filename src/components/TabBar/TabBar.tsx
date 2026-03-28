import { useTranslation } from 'react-i18next';
import { useBoardStore } from '../../store/boardStore';

const TABS = [
  { id: 'home', key: 'nav.home', emoji: '🏠' },
  { id: 'feelings', key: 'nav.feelings', emoji: '😊' },
  { id: 'food', key: 'nav.food', emoji: '🍎' },
  { id: 'activities', key: 'nav.play', emoji: '⚽' },
  { id: 'custom', key: 'nav.myWords', emoji: '⭐' },
];

export function TabBar() {
  const activeTab = useBoardStore((s) => s.activeTab);
  const setActiveTab = useBoardStore((s) => s.setActiveTab);
  const { t } = useTranslation();

  return (
    <nav id="tab-bar" role="tablist" aria-label="Board categories">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="tab-icon" aria-hidden="true">{tab.emoji}</span>
          {t(tab.key)}
        </button>
      ))}
    </nav>
  );
}
