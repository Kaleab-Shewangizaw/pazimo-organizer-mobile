import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";

import type { ThemeColors } from "@/lib/theme";
import { useColors, useResolvedScheme } from "@/lib/useColors";
import { useThemeStore } from "@/store/themeStore";

/**
 * Quick light/dark switch for a screen header — the icon shown is the
 * state a tap moves *to* (moon while light, sun while dark), not the
 * current state. Always sets an explicit mode, overriding "system": the
 * full Light/Dark/System choice still lives on the Account screen, this is
 * just the fast path for the mode people actually flip often.
 */
export function ThemeToggleButton() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const resolved = useResolvedScheme();
  const setMode = useThemeStore((s) => s.setMode);

  const isDark = resolved === "dark";

  return (
    <Pressable
      onPress={() => setMode(isDark ? "light" : "dark")}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={18} color={colors.ink} />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: {
      opacity: 0.7,
    },
  });
