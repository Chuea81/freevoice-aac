import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useBoardStore } from '../../store/boardStore';
import { useTouchDelay } from '../../hooks/useTouchDelay';

interface TabButtonProps {
  label: string;
  emoji: string;
  active?: boolean;
  ariaSelected?: boolean;
  ariaLabel?: string;
  onActivate: () => void;
}

function TabButton({ label, emoji, active, ariaSelected, ariaLabel, onActivate }: TabButtonProps) {
  const delayProps = useTouchDelay(onActivate);
  return (
    <button
      role="tab"
      aria-selected={ariaSelected}
      aria-label={ariaLabel}
      className={`tab-btn${active ? ' active' : ''}`}
      {...delayProps}
      style={{ minWidth: 'max-content' }}
    >
      <span className="tab-icon" aria-hidden="true">{emoji}</span>
      {label}
    </button>
  );
}

const TABS = [
  { id: 'home', label: 'HOME', emoji: '🏠' },
  { id: 'feelings', label: 'FEELINGS', emoji: '😊' },
  { id: 'food', label: 'FOOD', emoji: '🍎' },
  { id: 'activities', label: 'PLAY', emoji: '⚽' },
  { id: 'social', label: 'SOCIAL', emoji: '💬' },
  { id: 'body', label: 'BODY', emoji: '👋' },
  { id: 'school', label: 'SCHOOL', emoji: '🏫' },
  { id: 'places', label: 'PLACES', emoji: '📍' },
  { id: 'routines', label: 'ROUTINES', emoji: '📅' },
  { id: 'custom', label: 'MY WORDS', emoji: '⭐' },
];

interface Props {
  isParentMode?: boolean;
}

export function TabBar({ isParentMode }: Props) {
  const activeTab = useBoardStore((s) => s.activeTab);
  const setActiveTab = useBoardStore((s) => s.setActiveTab);
  const createBoard = useBoardStore((s) => s.createBoard);
  const setActiveTab_store = useBoardStore((s) => s.setActiveTab);
  const { t } = useTranslation();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardEmoji, setNewBoardEmoji] = useState('🆕');

  const handleCreateTopLevelBoard = useCallback(async () => {
    const trimmedName = newBoardName.trim();
    if (!trimmedName) return;
    try {
      const newBoardId = await createBoard(trimmedName, newBoardEmoji, null);
      setShowCreateDialog(false);
      setNewBoardName('');
      setNewBoardEmoji('🆕');
      setActiveTab_store(newBoardId);
    } catch (err) {
      console.error('Error creating board:', err);
    }
  }, [newBoardName, newBoardEmoji, createBoard, setActiveTab_store]);

  return (
    <>
      <nav id="tab-bar" role="tablist" aria-label="Board categories" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            label={t(`nav.${tab.id}`, tab.label)}
            emoji={tab.emoji}
            active={activeTab === tab.id}
            ariaSelected={activeTab === tab.id}
            onActivate={() => setActiveTab(tab.id)}
          />
        ))}

        {/* Create Board tab — Parent Mode only */}
        {isParentMode && (
          <TabButton
            label="New Board"
            emoji="➕"
            ariaLabel="Create a new board"
            onActivate={() => setShowCreateDialog(true)}
          />
        )}
      </nav>

      {/* Create Top-Level Board Modal */}
      {showCreateDialog && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateDialog(false); }}>
          <div className="modal">
            <h2 className="modal-title">Create a new board</h2>

            <div className="modal-field">
              <label>Board name</label>
              <input
                type="text"
                placeholder="e.g. Favorites"
                maxLength={30}
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTopLevelBoard(); }}
                autoFocus
              />
            </div>

            <div className="modal-field">
              <label>Emoji</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--border-raised)',
                fontSize: '32px',
                background: 'var(--bg-surface)',
              }}>
                <input
                  type="text"
                  value={newBoardEmoji}
                  onChange={(e) => setNewBoardEmoji(e.target.value.slice(0, 2))}
                  maxLength={2}
                  style={{
                    width: '60px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'center',
                    fontSize: '24px',
                    fontFamily: 'system-ui',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn primary"
                onClick={handleCreateTopLevelBoard}
                disabled={!newBoardName.trim()}
              >
                Create Board
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
