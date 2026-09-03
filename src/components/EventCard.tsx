import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/StatusBadge";
import { StubDivider } from "@/components/StubDivider";
import { fonts } from "@/lib/fonts";
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
        <View style={[styles.cover, styles.coverFallback]}>
          <Text style={styles.coverInitial}>{event.title.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.top}>
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
      </View>

      <StubDivider background={colors.surface} />

      <View style={styles.metricsRow}>
        <Metric label="Sold" value={String(event.ticketStats.total)} />
        <Metric label="Checked in" value={String(event.ticketStats.used)} />
        <Metric label="Revenue" value={formatMoney(event.revenue, currency)} />
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.85,
  },
  cover: {
    width: "100%",
    height: 108,
  },
  coverFallback: {
    backgroundColor: colors.navyDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  coverInitial: {
    fontFamily: fonts.extrabold,
    fontSize: 32,
    color: colors.goldMuted,
  },
  top: {
    padding: 16,
    paddingBottom: 14,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    flexShrink: 1,
  },
  date: {
    fontSize: 13,
    color: colors.textMuted,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 14,
  },
  metric: {
    alignItems: "flex-start",
  },
  metricValue: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
});
