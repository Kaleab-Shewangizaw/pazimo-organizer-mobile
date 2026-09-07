import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useThemeStore, type ThemeMode } from "@/store/themeStore";

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/** Light/Dark/System segmented control — shared by every role's Account screen. */
export function AppearanceToggle() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <View style={styles.track}>
      {OPTIONS.map((option) => {
        const active = option.value === mode;
        return (
          <Pressable
            key={option.value}
            onPress={() => setMode(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    track: {
      flexDirection: "row",
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      padding: 3,
    },
    segment: {
      flex: 1,
      paddingVertical: 9,
      alignItems: "center",
      borderRadius: 9,
    },
    segmentActive: {
      backgroundColor: colors.surface,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
    },
    labelActive: {
      color: colors.ink,
    },
  });
