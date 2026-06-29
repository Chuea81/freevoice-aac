import { create } from 'zustand';
import { db } from '../db';

export type PinMode = 'unlock' | 'set' | 'change' | 'remove' | 'confirm';

interface ParentState {
  isUnlocked: boolean;
  pinSet: boolean;
  pinEnabled: boolean;
  showPinModal: boolean;
  pinMode: PinMode;
  // Action queued behind a one-off PIN check (e.g. Factory Reset). Run once the
  // parent enters a correct PIN, then cleared. Null when nothing is pending.
  pendingAction: (() => void) | null;

  // Actions
  openPinModal: (mode: PinMode) => void;
  closePinModal: () => void;
  checkPinSet: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  clearPin: () => Promise<void>;
  lock: () => void;
  // Gate a sensitive action behind the parent PIN. If a PIN exists, prompts for
  // it and runs `action` only on success; if no PIN is set, runs immediately so
  // families who never set one aren't locked out of their own app.
  requirePin: (action: () => void) => void;
  runPendingAction: () => void;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'freevoice-salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const useParentStore = create<ParentState>((set, get) => ({
  isUnlocked: false,
  pinSet: false,
  pinEnabled: false,
  showPinModal: false,
  pinMode: 'unlock',
  pendingAction: null,

  openPinModal: (mode) => {
    set({ showPinModal: true, pinMode: mode });
  },

  closePinModal: () => {
    // Cancelling the modal must also drop any queued action so a later,
    // unrelated PIN entry can't accidentally trigger it.
    set({ showPinModal: false, pendingAction: null });
  },

  checkPinSet: async () => {
    const [pinSetting, enabledSetting] = await Promise.all([
      db.settings.get('parentPin'),
      db.settings.get('parentPinEnabled'),
    ]);
    set({
      pinSet: !!pinSetting,
      // Setting.value is string, so we serialize the boolean as 'true'/'false'.
      // An absent row means the lock has never been enabled.
      pinEnabled: enabledSetting?.value === 'true',
    });
  },

  // setPin both stores the hash and enables the lock. Used by 'set' (first-
  // time enable) and 'change' (after verifying the old PIN). isUnlocked stays
  // true so the user keeps access to Settings they are already inside.
  setPin: async (pin) => {
    const hashed = await hashPin(pin);
    await db.settings.put({ key: 'parentPin', value: hashed });
    await db.settings.put({ key: 'parentPinEnabled', value: 'true' });
    set({ pinSet: true, pinEnabled: true, isUnlocked: true, showPinModal: false });
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

  // Disable the lock AND remove the stored hash. The user is already
  // authenticated at this point (verify step happened in the modal), so we
  // don't re-check here.
  clearPin: async () => {
    await db.settings.delete('parentPin');
    await db.settings.put({ key: 'parentPinEnabled', value: 'false' });
    set({ pinSet: false, pinEnabled: false, showPinModal: false });
  },

  lock: () => {
    set({ isUnlocked: false });
  },

  requirePin: (action) => {
    if (!get().pinSet) {
      // No parent PIN configured — nothing to verify against, so run directly.
      action();
      return;
    }
    set({ pendingAction: action, showPinModal: true, pinMode: 'confirm' });
  },

  runPendingAction: () => {
    const action = get().pendingAction;
    set({ pendingAction: null, showPinModal: false });
    if (action) action();
  },
}));
