import { HIGHLIGHT_COLORS, useHighlightStore } from '../../store/highlightStore';

export function HighlightFAB() {
  const mode = useHighlightStore((s) => s.mode);
  const selectedColor = useHighlightStore((s) => s.selectedColor);
  const toggleMode = useHighlightStore((s) => s.toggleMode);
  const setSelectedColor = useHighlightStore((s) => s.setSelectedColor);

  return (
    <div className="highlight-fab-container">
      {mode && (
        <div className="highlight-palette" role="toolbar" aria-label="Highlight color picker">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`palette-swatch${selectedColor === c.value ? ' selected' : ''}`}
              style={{ background: c.value }}
              onClick={() => setSelectedColor(c.value)}
              aria-label={`${c.name} highlight`}
              aria-pressed={selectedColor === c.value}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        className={`highlight-fab${mode ? ' active' : ''}`}
        onClick={toggleMode}
        style={mode ? { background: selectedColor } : undefined}
        aria-label={mode ? 'Exit highlight mode' : 'Enter highlight mode'}
        aria-pressed={mode}
      >
        <span aria-hidden="true">🎨</span>
      </button>
    </div>
  );
}
