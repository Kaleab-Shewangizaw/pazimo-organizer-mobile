import { useColorScheme } from "react-native";

import { darkColors, lightColors, type ThemeColors } from "@/lib/theme";
import { useThemeStore } from "@/store/themeStore";

/**
 * The one place every screen/component reads colors from — never a static
 * import of `lightColors`/`darkColors` directly, since that wouldn't
 * re-render when the mode changes. "system" follows the OS appearance
 * (`useColorScheme`); "light"/"dark" is an explicit override set from the
 * Account screen.
 */
export function useColors(): ThemeColors {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useColorScheme();
  const resolved = mode === "system" ? (systemScheme ?? "light") : mode;
  return resolved === "dark" ? darkColors : lightColors;
}

/** The resolved "light" | "dark" — for anything that needs the mode itself, not just colors (e.g. StatusBar style). */
export function useResolvedScheme(): "light" | "dark" {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useColorScheme();
  if (mode !== "system") return mode;
  return systemScheme === "dark" ? "dark" : "light";
}
