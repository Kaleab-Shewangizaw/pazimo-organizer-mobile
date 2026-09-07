import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

interface HeroFooterItem {
  label: string;
  value: string;
}

interface HeroCardProps {
  eyebrow: string;
  value: string;
  /** Signed percent — positive renders an up arrow, negative a down arrow. Omit when there's no comparison period. */
  deltaPct?: number | null;
  /** Plain caption shown instead of a delta (e.g. "Across 12 events"). */
  note?: string;
  footer?: HeroFooterItem[];
}

/**
 * The one solid-fill card per screen — always an inversion of the page
 * (near-black on a light page, near-white on a dark page), reserved for the
 * single figure that matters most: available balance, gross revenue, bar
 * takings. Every other card on a screen stays a bordered, page-colored
 * surface so this one keeps reading as "the number to look at first."
 */
export function HeroCard({ eyebrow, value, deltaPct, note, footer }: HeroCardProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.value}>{value}</Text>

      {deltaPct != null ? (
        <View style={styles.deltaRow}>
          <Ionicons
            name={deltaPct >= 0 ? "trending-up" : "trending-down"}
            size={14}
            color={styles.note.color}
          />
          <Text style={styles.note}>{Math.abs(deltaPct)}% vs previous event</Text>
        </View>
      ) : note ? (
        <Text style={styles.note}>{note}</Text>
      ) : null}

      {footer && footer.length > 0 ? (
        <View style={styles.footerRow}>
          {footer.map((item) => (
            <View key={item.label} style={styles.footerItem}>
              <Text style={styles.footerValue}>{item.value}</Text>
              <Text style={styles.footerLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.buttonPrimaryBg,
      borderRadius: 24,
      padding: 20,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.buttonPrimaryText,
      opacity: 0.7,
    },
    value: {
      fontFamily: fonts.bold,
      fontSize: 34,
      color: colors.buttonPrimaryText,
      marginTop: 6,
      fontVariant: ["tabular-nums"],
    },
    deltaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 8,
    },
    note: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.buttonPrimaryText,
      opacity: 0.8,
      marginTop: 8,
    },
    footerRow: {
      flexDirection: "row",
      gap: 20,
      marginTop: 18,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.heroDivider,
    },
    footerItem: {
      flex: 1,
    },
    footerValue: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.buttonPrimaryText,
      fontVariant: ["tabular-nums"],
    },
    footerLabel: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.buttonPrimaryText,
      opacity: 0.7,
      marginTop: 1,
    },
  });
