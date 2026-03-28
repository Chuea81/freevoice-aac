import { useTranslation } from 'react-i18next';
import { useBoardStore } from '../../store/boardStore';

const TABS = [
  { id: 'home', label: 'HOME', emoji: '🏠' },
  { id: 'feelings', label: 'FEELINGS', emoji: '😊' },
  { id: 'food', label: 'FOOD', emoji: '🍎' },
  { id: 'activities', label: 'PLAY', emoji: '⚽' },
  { id: 'social', label: 'SOCIAL', emoji: '💬' },
  { id: 'body', label: 'BODY', emoji: '🏥' },
  { id: 'school', label: 'SCHOOL', emoji: '🏫' },
  { id: 'places', label: 'PLACES', emoji: '📍' },
  { id: 'routines', label: 'ROUTINES', emoji: '📅' },
  { id: 'custom', label: 'MY WORDS', emoji: '⭐' },
];

export function TabBar() {
  const activeTab = useBoardStore((s) => s.activeTab);
  const setActiveTab = useBoardStore((s) => s.setActiveTab);
  const { t } = useTranslation();

  return (
    <nav id="tab-bar" role="tablist" aria-label="Board categories" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
          style={{ minWidth: 'max-content' }}
        >
          <span className="tab-icon" aria-hidden="true">{tab.emoji}</span>
          {t(`nav.${tab.id}`, tab.label)}
        </button>
      ))}
    </nav>
  );
}
