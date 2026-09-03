import { create } from "zustand";

import { getCurrentUser } from "@/api/auth";
import { setUnauthorizedHandler } from "@/api/client";
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "@/lib/secureStorage";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  status: "checking" | "signedOut" | "signedIn";
  /** Set true once the login/signup flow has a token and is fetching /auth/me. */
  isResolvingUser: boolean;
  bootstrap: () => Promise<void>;
  signIn: (token: string, user?: User) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "checking",
  isResolvingUser: false,

  bootstrap: async () => {
    const token = await getStoredToken();
    if (!token) {
      set({ status: "signedOut" });
      return;
    }
    try {
      const me = await getCurrentUser();
      set({ user: me.data, status: "signedIn" });
    } catch {
      // Token missing, expired, or rejected — treat as signed out rather
      // than trusting anything cached locally about who the user is.
      await clearStoredToken();
      set({ user: null, status: "signedOut" });
    }
  },

  signIn: async (token, user) => {
    await setStoredToken(token);
    if (user) {
      set({ user, status: "signedIn" });
      return;
    }
    // Some flows (organizer sign-up) only return a token; fetch the
    // authoritative profile+role rather than assuming one.
    set({ isResolvingUser: true });
    try {
      const me = await getCurrentUser();
      set({ user: me.data, status: "signedIn", isResolvingUser: false });
    } catch (err) {
      await clearStoredToken();
      set({ user: null, status: "signedOut", isResolvingUser: false });
      throw err;
    }
  },

  signOut: async () => {
    await clearStoredToken();
    set({ user: null, status: "signedOut" });
  },
}));

// Any 401 from the API client clears the session everywhere, not just in
// whichever screen made the failing request.
setUnauthorizedHandler(() => {
  useAuthStore.getState().signOut();
});
