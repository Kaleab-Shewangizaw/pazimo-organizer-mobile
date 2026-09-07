import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

/**
 * Just the user's preference ("light" / "dark" / "system"), persisted across
 * launches. Never a secret, so plain AsyncStorage — not the SecureStore used
 * for the auth token — is the right store here.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => set({ mode }),
    }),
    {
      name: "pazimo-theme-mode",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
