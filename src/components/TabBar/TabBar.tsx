import { useBoardStore } from '../../store/boardStore';

const TABS = [
  { id: 'home', label: 'HOME', emoji: '🏠' },
  { id: 'feelings', label: 'FEELINGS', emoji: '😊' },
  { id: 'food', label: 'FOOD', emoji: '🍎' },
  { id: 'activities', label: 'PLAY', emoji: '⚽' },
  { id: 'custom', label: 'MY WORDS', emoji: '⭐' },
];

export function TabBar() {
  const activeTab = useBoardStore((s) => s.activeTab);
  const setActiveTab = useBoardStore((s) => s.setActiveTab);

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
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
