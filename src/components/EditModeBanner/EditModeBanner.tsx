import { useEditModeStore } from '../../store/editModeStore';

export function EditModeBanner() {
  const active = useEditModeStore((s) => s.active);
  const exitMode = useEditModeStore((s) => s.exitMode);

  if (!active) return null;

  return (
    <div className="edit-mode-banner" role="status">
      <span className="edit-mode-banner-icon" aria-hidden="true">✏️</span>
      <span className="edit-mode-banner-text">
        <strong>Edit Mode</strong> — tap any button to edit
      </span>
      <button
        type="button"
        className="edit-mode-banner-done"
        onClick={exitMode}
      >
        Done Editing
      </button>
    </div>
  );
}
