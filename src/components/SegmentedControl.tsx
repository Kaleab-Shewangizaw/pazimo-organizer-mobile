import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fonts } from "@/lib/fonts";
import { isDarkTheme, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * A pill-shaped track with a raised active segment — the appearance toggle
 * and the sign-in screen's Organizer/Staff switcher share this exact
 * pattern, so it's generic rather than copy-pasted per call site.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.track}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
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
      borderRadius: 999,
      padding: 3,
    },
    segment: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 999,
    },
    segmentActive: {
      backgroundColor: colors.surface,
      // Light mode only — see `cardShadow` in lib/theme for why dark mode
      // skips shadows entirely instead of trying to tint one.
      ...(isDarkTheme(colors)
        ? null
        : {
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }),
    },
    label: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.textMuted,
    },
    labelActive: {
      color: colors.ink,
    },
  });
