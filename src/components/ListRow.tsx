import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

interface ListRowProps {
  title: string;
  subtitle?: string;
  amount?: string;
  statusLabel?: string;
  statusColor?: string;
}

/**
 * A single sold-ticket / sale row: title + subtitle on the left, an amount
 * and a status label stacked on the right. Shared by the organizer and
 * cashier Tickets tabs, which read differently-shaped API responses but
 * render the same row. Rows sit flush against each other with a hairline
 * divider rather than each being its own boxed card — quieter at list scale.
 */
export function ListRow({ title, subtitle, amount, statusLabel, statusColor }: ListRowProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        {amount ? <Text style={styles.amount}>{amount}</Text> : null}
        {statusLabel ? (
          <Text style={[styles.status, { color: statusColor ?? colors.textMuted }]}>
            {statusLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    left: {
      flex: 1,
      gap: 3,
    },
    title: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.ink,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textMuted,
    },
    right: {
      alignItems: "flex-end",
      gap: 3,
    },
    amount: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.ink,
      fontVariant: ["tabular-nums"],
    },
    status: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "capitalize",
    },
  });
