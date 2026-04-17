import { useBoardStore } from '../../store/boardStore';
import { db } from '../../db';
import { useEffect, useState } from 'react';
import { useTouchDelay } from '../../hooks/useTouchDelay';

interface CrumbButtonProps {
  label: string;
  active?: boolean;
  isCurrent?: boolean;
  onActivate: () => void;
}

function CrumbButton({ label, active, isCurrent, onActivate }: CrumbButtonProps) {
  const delayProps = useTouchDelay(onActivate);
  return (
    <button
      className={`crumb${active ? ' active' : ''}`}
      {...delayProps}
      aria-current={isCurrent ? 'page' : undefined}
    >
      {label}
    </button>
  );
}

export function BreadcrumbNav() {
  const navStack = useBoardStore((s) => s.navStack);
  const activeTab = useBoardStore((s) => s.activeTab);
  const navigateToCrumb = useBoardStore((s) => s.navigateToCrumb);
  const [rootLabel, setRootLabel] = useState('Home');

  useEffect(() => {
    db.boards.get(activeTab).then((board) => {
      if (board) setRootLabel(board.name);
    });
  }, [activeTab]);

  return (
    <nav id="breadcrumb" className="scroll-none" aria-label="Board navigation">
      <CrumbButton
        label={rootLabel}
        active={navStack.length === 0}
        isCurrent={navStack.length === 0}
        onActivate={() => navigateToCrumb(-1)}
      />

      {navStack.map((step, i) => (
        <span key={i} style={{ display: 'contents' }}>
          <span className="crumb-sep" aria-hidden="true">›</span>
          <CrumbButton
            label={step.label}
            active={i === navStack.length - 1}
            isCurrent={i === navStack.length - 1}
            onActivate={() => navigateToCrumb(i)}
          />
        </span>
      ))}
    </nav>
  );
}
