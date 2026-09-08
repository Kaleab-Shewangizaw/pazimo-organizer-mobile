import { StyleSheet, Text, View } from "react-native";

import { EventCoverCard } from "@/components/EventCoverCard";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import type { Currency, DashboardEvent } from "@/types";

interface EventCardProps {
  event: DashboardEvent;
  currency: Currency;
  onPress?: () => void;
  /** Hide the publish-status badge — e.g. the Tickets tab, where every listed event is already relevant regardless of status. */
  showStatus?: boolean;
}

/**
 * Organizer's event card: the shared EventCoverCard (cover photo, gradient
 * scrim, title/date/location, status badge, ticket-stub tear line) with
 * sold/checked-in/revenue metrics below it — the financial detail that's
 * specific to the organizer's view.
 */
export function EventCard({ event, currency, onPress, showStatus = true }: EventCardProps) {
  const colors = useColors();

  return (
    <EventCoverCard event={event} onPress={onPress} showStatus={showStatus}>
      <View style={styles.metricsRow}>
        <Metric label="Sold" value={String(event.ticketStats.total)} colors={colors} />
        <Metric label="Checked in" value={String(event.ticketStats.used)} colors={colors} />
        <Metric label="Revenue" value={formatMoney(event.revenue, currency)} colors={colors} />
      </View>
    </EventCoverCard>
  );
}

function Metric({ label, value, colors }: { label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={{ alignItems: "flex-start" }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, fontVariant: ["tabular-nums"] }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 14,
  },
});
