import { create } from 'zustand';
import { useHighlightStore } from './highlightStore';

// Edit Mode is a runtime UI mode (not persisted) that flips taps from
// "speak the symbol" to "open the edit form for this symbol". Mutually
// exclusive with Highlight Mode — switching one on switches the other off.

interface EditModeState {
  active: boolean;
  setActive: (v: boolean) => void;
  toggle: () => void;
  exitMode: () => void;
}

export const useEditModeStore = create<EditModeState>((set) => ({
  active: false,
  setActive: (v) => {
    if (v) {
      // Mutex with Highlight Mode.
      const hl = useHighlightStore.getState();
      if (hl.mode) hl.exitMode();
    }
    set({ active: v });
  },
  toggle: () => {
    const next = !useEditModeStore.getState().active;
    if (next) {
      const hl = useHighlightStore.getState();
      if (hl.mode) hl.exitMode();
    }
    set({ active: next });
  },
  exitMode: () => set({ active: false }),
}));

// Patch highlightStore.toggleMode so the mutex works in the other
// direction too: turning Highlight on turns Edit off.
const origToggle = useHighlightStore.getState().toggleMode;
useHighlightStore.setState({
  toggleMode: () => {
    const willActivate = !useHighlightStore.getState().mode;
    if (willActivate) {
      const editStore = useEditModeStore.getState();
      if (editStore.active) editStore.exitMode();
    }
    origToggle();
  },
});
