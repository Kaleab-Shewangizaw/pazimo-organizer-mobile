import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

interface StatTileProps {
  label: string;
  value: string;
  accent?: boolean;
}

/**
 * One figure in a stat grid — revenue/units/orders on the Bar tabs, and the
 * two balance-stream tiles (tickets pool / beverages pool) on the cashier
 * dashboard. `accent` makes the value the one warm accent color, reserved
 * for the single figure that matters most in a given tile group.
 */
export function StatTile({ label, value, accent }: StatTileProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.tile}>
      <Text style={[styles.value, accent && { color: colors.accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    tile: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 2,
    },
    value: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.ink,
      fontVariant: ["tabular-nums"],
    },
    label: {
      fontSize: 12,
      color: colors.textMuted,
    },
  });
