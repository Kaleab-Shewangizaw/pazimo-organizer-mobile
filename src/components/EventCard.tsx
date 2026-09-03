import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/StatusBadge";
import { formatEventDateRange, formatMoney } from "@/lib/format";
import { colors } from "@/lib/theme";
import type { Currency, DashboardEvent } from "@/types";

interface EventCardProps {
  event: DashboardEvent;
  currency: Currency;
  onPress?: () => void;
}

export function EventCard({ event, currency, onPress }: EventCardProps) {
  const cover = event.coverImages?.[0];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {cover ? (
        <Image source={{ uri: cover }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverFallback]} />
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {event.title}
          </Text>
          <StatusBadge status={event.status} />
        </View>

        <Text style={styles.date}>
          {formatEventDateRange(event.startDate, event.endDate)}
          {event.location?.city ? ` · ${event.location.city}` : ""}
        </Text>

        <View style={styles.metricsRow}>
          <Metric label="Sold" value={String(event.ticketStats.total)} />
          <Metric label="Checked in" value={String(event.ticketStats.used)} />
          <Metric label="Revenue" value={formatMoney(event.revenue, currency)} />
        </View>
      </View>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.85,
  },
  cover: {
    width: "100%",
    height: 110,
  },
  coverFallback: {
    backgroundColor: colors.primaryDark,
  },
  body: {
    padding: 14,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
  },
  date: {
    fontSize: 13,
    color: colors.textMuted,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  metric: {
    alignItems: "flex-start",
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
