import { create } from 'zustand';
import { db } from '../db';

interface ParentState {
  isUnlocked: boolean;
  pinSet: boolean;
  showPinModal: boolean;
  pinMode: 'unlock' | 'set' | 'change';

  // Actions
  openPinModal: (mode: 'unlock' | 'set' | 'change') => void;
  closePinModal: () => void;
  checkPinSet: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  lock: () => void;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'freevoice-salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const useParentStore = create<ParentState>((set) => ({
  isUnlocked: false,
  pinSet: false,
  showPinModal: false,
  pinMode: 'unlock',

  openPinModal: (mode) => {
    set({ showPinModal: true, pinMode: mode });
  },

  closePinModal: () => {
    set({ showPinModal: false });
  },

  checkPinSet: async () => {
    const setting = await db.settings.get('parentPin');
    set({ pinSet: !!setting });
  },

  setPin: async (pin) => {
    const hashed = await hashPin(pin);
    await db.settings.put({ key: 'parentPin', value: hashed });
    set({ pinSet: true, isUnlocked: true, showPinModal: false });
  },

  verifyPin: async (pin) => {
    const setting = await db.settings.get('parentPin');
    if (!setting) return false;
    const hashed = await hashPin(pin);
    const match = hashed === setting.value;
    if (match) {
      set({ isUnlocked: true, showPinModal: false });
    }
    return match;
  },

  lock: () => {
    set({ isUnlocked: false });
  },
}));
