import { create } from 'zustand';

export interface HighlightColor {
  name: string;
  value: string;
}

export const HIGHLIGHT_COLORS: HighlightColor[] = [
  { name: 'Red', value: '#EF5350' },
  { name: 'Orange', value: '#FFA726' },
  { name: 'Yellow', value: '#FFD54F' },
  { name: 'Green', value: '#66BB6A' },
  { name: 'Blue', value: '#42A5F5' },
  { name: 'Purple', value: '#AB47BC' },
  { name: 'Pink', value: '#EC407A' },
];

interface HighlightState {
  mode: boolean;
  selectedColor: string;
  toggleMode: () => void;
  setSelectedColor: (color: string) => void;
  exitMode: () => void;
}

export const useHighlightStore = create<HighlightState>((set) => ({
  mode: false,
  selectedColor: HIGHLIGHT_COLORS[2].value,
  toggleMode: () => set((s) => ({ mode: !s.mode })),
  setSelectedColor: (color) => set({ selectedColor: color }),
  exitMode: () => set({ mode: false }),
}));
