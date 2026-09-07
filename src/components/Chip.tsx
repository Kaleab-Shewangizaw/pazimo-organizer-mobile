import { useMemo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: ReactNode;
}

/**
 * One pill filter — the organizer dashboard's event selector, the bar
 * tab's live/all-time toggle. Active fills solid ink; inactive stays a
 * bordered, page-colored pill. Meant to sit in a row (a horizontally
 * scrolling one, or a fixed-width one), not used alone.
 */
export function Chip({ label, active, onPress, icon }: ChipProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      {icon}
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderWidth: 1,
    },
    chipActive: {
      backgroundColor: colors.buttonPrimaryBg,
      borderColor: colors.buttonPrimaryBg,
    },
    chipInactive: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    label: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
    },
    labelActive: {
      color: colors.buttonPrimaryText,
    },
    labelInactive: {
      color: colors.textMuted,
    },
  });
