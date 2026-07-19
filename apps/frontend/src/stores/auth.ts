import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthenticatedUser } from '@restaurante/shared';

/** Single storage key for the persisted session (replaces the two legacy keys). */
export const AUTH_STORAGE_KEY = 'mesa_pro_auth';

const LEGACY_TOKEN_KEY = 'mesa_pro_token';
const LEGACY_USER_KEY = 'mesa_pro_user';

interface AuthState {
  token: string | null;
  user: AuthenticatedUser | null;
  login: (token: string, user: AuthenticatedUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

/**
 * One-time migration: adopt the legacy `mesa_pro_token` / `mesa_pro_user`
 * localStorage session (if present) into the persisted store, then drop the
 * legacy keys. Runs at module load, before any component reads the store.
 */
function migrateLegacySession(): void {
  try {
    const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
    const legacyUserRaw = localStorage.getItem(LEGACY_USER_KEY);

    if (legacyToken && !useAuthStore.getState().token) {
      let legacyUser: AuthenticatedUser | null = null;
      if (legacyUserRaw) {
        try {
          legacyUser = JSON.parse(legacyUserRaw) as AuthenticatedUser;
        } catch {
          legacyUser = null;
        }
      }
      useAuthStore.setState({ token: legacyToken, user: legacyUser });
    }

    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch {
    // localStorage unavailable (SSR/tests) — nothing to migrate.
  }
}

migrateLegacySession();
