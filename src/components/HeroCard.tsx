import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fonts } from "@/lib/fonts";
import { brandBlue, brandBlueDeep, type ThemeColors } from "@/lib/theme";
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
  /**
   * "brand" swaps the usual page-inverted fill for Pazimo's own navy-blue
   * gradient — the same #06283D the marketing site's footer uses, deepening
   * into a lighter steel blue, the same pairing the site's own ticket card
   * uses. Fixed regardless of light/dark mode (like the scanner screen),
   * reserved for the one card on a screen that should read as *the* brand
   * moment — currently just the organizer dashboard's gross revenue card.
   */
  variant?: "default" | "brand";
}

const BRAND_GRADIENT = [brandBlueDeep, brandBlue] as const;
const BRAND_TEXT = "#FDFCF9";
const BRAND_DIVIDER = "rgba(255, 255, 255, 0.16)";

/**
 * The one solid-fill card per screen — normally an inversion of the page
 * (near-black on a light page, near-white on a dark page), reserved for the
 * single figure that matters most: available balance, gross revenue, bar
 * takings. Every other card on a screen stays a bordered, page-colored
 * surface so this one keeps reading as "the number to look at first."
 */
export function HeroCard({ eyebrow, value, deltaPct, note, footer, variant = "default" }: HeroCardProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isBrand = variant === "brand";
  const textColor = isBrand ? BRAND_TEXT : colors.buttonPrimaryText;
  const dividerColor = isBrand ? BRAND_DIVIDER : colors.heroDivider;

  const content = (
    <>
      <Text style={[styles.eyebrow, { color: textColor }]}>{eyebrow}</Text>
      <Text style={[styles.value, { color: textColor }]}>{value}</Text>

      {deltaPct != null ? (
        <View style={styles.deltaRow}>
          <Ionicons name={deltaPct >= 0 ? "trending-up" : "trending-down"} size={14} color={textColor} />
          <Text style={[styles.note, { color: textColor }]}>{Math.abs(deltaPct)}% vs previous event</Text>
        </View>
      ) : note ? (
        <Text style={[styles.note, { color: textColor }]}>{note}</Text>
      ) : null}

      {footer && footer.length > 0 ? (
        <View style={[styles.footerRow, { borderTopColor: dividerColor }]}>
          {footer.map((item) => (
            <View key={item.label} style={styles.footerItem}>
              <Text style={[styles.footerValue, { color: textColor }]}>{item.value}</Text>
              <Text style={[styles.footerLabel, { color: textColor }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );

  if (isBrand) {
    return (
      <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        {content}
      </LinearGradient>
    );
  }

  return <View style={[styles.card, { backgroundColor: colors.buttonPrimaryBg }]}>{content}</View>;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: 24,
      padding: 20,
      overflow: "hidden",
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      opacity: 0.7,
    },
    value: {
      fontFamily: fonts.bold,
      fontSize: 34,
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
      fontVariant: ["tabular-nums"],
    },
    footerLabel: {
      fontFamily: fonts.body,
      fontSize: 12,
      opacity: 0.7,
      marginTop: 1,
    },
  });
