import { create } from 'zustand';

export interface FirstThenToken {
  emoji: string;
  label: string;
  phrase: string;
  imageUrl: string | null;
}

export type FirstThenSlot = 'first' | 'then';

interface FirstThenState {
  mode: boolean;
  firstSlot: FirstThenToken | null;
  thenSlot: FirstThenToken | null;
  activeSlot: FirstThenSlot;

  toggleMode: () => void;
  setMode: (on: boolean) => void;
  fillActive: (token: FirstThenToken) => { filled: FirstThenSlot; bothFilled: boolean };
  clearSlot: (slot: FirstThenSlot) => void;
  clearActive: () => void;
  clearBoth: () => void;
  setActiveSlot: (slot: FirstThenSlot) => void;
}

export const useFirstThenStore = create<FirstThenState>((set, get) => ({
  mode: false,
  firstSlot: null,
  thenSlot: null,
  activeSlot: 'first',

  toggleMode: () => set((s) => ({
    mode: !s.mode,
    firstSlot: null,
    thenSlot: null,
    activeSlot: 'first',
  })),

  setMode: (on) => set({
    mode: on,
    firstSlot: null,
    thenSlot: null,
    activeSlot: 'first',
  }),

  fillActive: (token) => {
    const { activeSlot, firstSlot, thenSlot } = get();
    if (activeSlot === 'first') {
      const newThenSlot = thenSlot;
      const bothFilled = newThenSlot !== null;
      set({
        firstSlot: token,
        activeSlot: bothFilled ? 'first' : 'then',
      });
      return { filled: 'first', bothFilled };
    } else {
      const newFirstSlot = firstSlot;
      const bothFilled = newFirstSlot !== null;
      set({
        thenSlot: token,
        activeSlot: bothFilled ? 'then' : 'first',
      });
      return { filled: 'then', bothFilled };
    }
  },

  clearSlot: (slot) => set((s) => ({
    firstSlot: slot === 'first' ? null : s.firstSlot,
    thenSlot: slot === 'then' ? null : s.thenSlot,
    activeSlot: slot,
  })),

  clearActive: () => set((s) => {
    const target = s.activeSlot;
    return {
      firstSlot: target === 'first' ? null : s.firstSlot,
      thenSlot: target === 'then' ? null : s.thenSlot,
    };
  }),

  clearBoth: () => set({
    firstSlot: null,
    thenSlot: null,
    activeSlot: 'first',
  }),

  setActiveSlot: (slot) => set({ activeSlot: slot }),
}));
