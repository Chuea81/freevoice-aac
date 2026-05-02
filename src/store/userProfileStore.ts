import { create } from 'zustand';
import { db } from '../db';

export type CommunicationLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  firstName: string;
  lastName: string;
  preferredName: string;
  city: string;
  state: string;
  country: string;
  dateOfBirth: string;
  aboutMe: string;
  caregiverName: string;
  caregiverEmail: string;
  communicationLevel: CommunicationLevel | '';
}

export const EMPTY_PROFILE: UserProfile = {
  firstName: '',
  lastName: '',
  preferredName: '',
  city: '',
  state: '',
  country: 'United States',
  dateOfBirth: '',
  aboutMe: '',
  caregiverName: '',
  caregiverEmail: '',
  communicationLevel: '',
};

const STORAGE_KEY = 'userProfile';
const SAVE_DEBOUNCE_MS = 400;

interface UserProfileState {
  profile: UserProfile;
  loaded: boolean;
  lastSavedAt: number;

  loadFromDb: () => Promise<void>;
  updateField: <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => void;
  saveNow: () => Promise<void>;
}

let saveTimer: number | undefined;

async function persist(profile: UserProfile): Promise<void> {
  await db.settings.put({ key: STORAGE_KEY, value: JSON.stringify(profile) });
}

export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  profile: EMPTY_PROFILE,
  loaded: false,
  lastSavedAt: 0,

  loadFromDb: async () => {
    const row = await db.settings.get(STORAGE_KEY);
    if (row?.value) {
      try {
        const parsed = JSON.parse(row.value) as Partial<UserProfile>;
        set({ profile: { ...EMPTY_PROFILE, ...parsed }, loaded: true });
        return;
      } catch {
        // fall through to empty profile
      }
    }
    set({ loaded: true });
  },

  updateField: (key, value) => {
    const next = { ...get().profile, [key]: value };
    set({ profile: next });
    if (saveTimer !== undefined) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(async () => {
      await persist(next);
      set({ lastSavedAt: Date.now() });
      saveTimer = undefined;
    }, SAVE_DEBOUNCE_MS);
  },

  saveNow: async () => {
    if (saveTimer !== undefined) {
      window.clearTimeout(saveTimer);
      saveTimer = undefined;
    }
    await persist(get().profile);
    set({ lastSavedAt: Date.now() });
  },
}));
