import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  danger?: boolean;
  last?: boolean;
  onPress: () => void;
}

/** A single settings/menu row: icon + label (+ optional trailing value) + chevron. */
export function SettingsRow({ icon, label, value, danger, last, onPress }: SettingsRowProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.divider,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={danger ? colors.error : colors.textMuted} />
      <Text style={[styles.label, danger && { color: colors.error }]} numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {!danger ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pressed: {
      opacity: 0.6,
    },
    label: {
      flex: 1,
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.ink,
    },
    value: {
      fontSize: 14,
      color: colors.textMuted,
      maxWidth: 140,
    },
  });
