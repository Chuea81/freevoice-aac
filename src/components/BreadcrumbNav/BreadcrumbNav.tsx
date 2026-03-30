import { useBoardStore } from '../../store/boardStore';
import { db } from '../../db';
import { fetchDefaultSymbols } from '../../services/symbolsApi';
import { useEffect, useState } from 'react';

export function BreadcrumbNav() {
  const navStack = useBoardStore((s) => s.navStack);
  const activeTab = useBoardStore((s) => s.activeTab);
  const navigateToCrumb = useBoardStore((s) => s.navigateToCrumb);
  const [rootLabel, setRootLabel] = useState('Home');

  useEffect(() => {
    async function fetchBoardName() {
      // Try IDB first (user-created boards)
      const board = await db.boards.get(activeTab);
      if (board) { setRootLabel(board.name); return; }
      // Fall back to JSON defaults
      const { boards } = await fetchDefaultSymbols();
      const defaultBoard = boards.find(b => b.id === activeTab);
      setRootLabel(defaultBoard?.name ?? 'Home');
    }
    fetchBoardName();
  }, [activeTab]);

  return (
    <nav id="breadcrumb" className="scroll-none" aria-label="Board navigation">
      <button
        className={`crumb${navStack.length === 0 ? ' active' : ''}`}
        onClick={() => navigateToCrumb(-1)}
        aria-current={navStack.length === 0 ? 'page' : undefined}
      >
        {rootLabel}
      </button>

      {navStack.map((step, i) => (
        <span key={i} style={{ display: 'contents' }}>
          <span className="crumb-sep" aria-hidden="true">›</span>
          <button
            className={`crumb${i === navStack.length - 1 ? ' active' : ''}`}
            onClick={() => navigateToCrumb(i)}
            aria-current={i === navStack.length - 1 ? 'page' : undefined}
          >
            {step.label}
          </button>
        </span>
      ))}
    </nav>
  );
}
