import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getBeverageEligibility, getOrganizerBeverageDashboard } from "@/api/beverages";
import { getOrganizerDashboard } from "@/api/organizers";
import { getEventTickets } from "@/api/tickets";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { HeroCard } from "@/components/HeroCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ProgressBar } from "@/components/ProgressBar";
import { StatTile } from "@/components/StatTile";
import { useTabBarHeight } from "@/components/TabBarHeightProvider";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { accentAlt, cardShadow, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";
import type { Currency, DashboardEvent, TicketTypeBreakdownRow } from "@/types";

const CURRENCY: Currency = "ETB";

function isEventLive(event: DashboardEvent, now: Date): boolean {
  if (event.status !== "published") return false;
  return new Date(event.startDate) <= now && now <= new Date(event.endDate);
}

export default function OrganizerHomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useTabBarHeight();
  const user = useAuthStore((s) => s.user);
  const organizerId = user?._id;
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOverride, setSelectedOverride] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["organizer-dashboard", organizerId, CURRENCY],
    queryFn: () => getOrganizerDashboard(organizerId as string, CURRENCY),
    enabled: !!organizerId,
  });

  const events = query.data?.data.events ?? [];
  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [events],
  );
  const liveEvent = useMemo(() => sortedEvents.find((e) => isEventLive(e, new Date())), [sortedEvents]);
  const otherEvents = sortedEvents.filter((e) => e._id !== liveEvent?._id);

  const selected = selectedOverride ?? "all";
  const allTime = selected === "all";
  const selectedEvent = allTime
    ? undefined
    : sortedEvents.find((e) => e._id === selected) ?? liveEvent ?? sortedEvents[0];

  const tierQuery = useQuery({
    queryKey: ["event-tickets", selectedEvent?._id, "stats"],
    queryFn: () => getEventTickets(selectedEvent!._id, 1, 1),
    enabled: !allTime && !!selectedEvent,
  });

  // Same query keys as the Bar tab (src/api/beverages.ts via app/organizer/(tabs)/bar.tsx)
  // so the cache is shared between the two. Errors (including the eligibility
  // route 404ing where it hasn't shipped yet) are swallowed on purpose — this
  // is a nice-to-have second stat tile, not something worth an error banner
  // on the main dashboard.
  const eligibilityQuery = useQuery({
    queryKey: ["beverage-eligibility"],
    queryFn: getBeverageEligibility,
  });
  const isBeverageEligible = eligibilityQuery.data?.data.eligibility === "eligible";
  const beverageDashboardQuery = useQuery({
    queryKey: ["beverage-dashboard"],
    queryFn: getOrganizerBeverageDashboard,
    enabled: isBeverageEligible,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await query.refetch();
    setRefreshing(false);
  }, [query]);

  if (query.isPending) {
    return <LoadingScreen />;
  }

  if (query.isError) {
    const message = bannerMessageFor(query.error) ?? "Something went wrong loading your dashboard.";
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Banner kind="error" message={message} />
          <Button label="Try again" onPress={() => query.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const { balance } = query.data.data;

  const topByRevenue = [...sortedEvents].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const maxRevenue = Math.max(1, ...topByRevenue.map((e) => e.revenue));

  const allTimeSold = sortedEvents.reduce((a, e) => a + e.ticketStats.total, 0);

  const ticketsSoldValue = allTime
    ? String(allTimeSold)
    : selectedEvent
      ? selectedEvent.capacity
        ? `${selectedEvent.ticketStats.total}/${selectedEvent.capacity}`
        : String(selectedEvent.ticketStats.total)
      : "0";

  const beverageTotals = beverageDashboardQuery.data?.data;
  const showDrinks = isBeverageEligible && !!beverageTotals;
  const drinksSoldValue = allTime
    ? (beverageTotals?.totals.units ?? 0)
    : (beverageTotals?.byEvent.find((e) => e._id === selectedEvent?._id)?.units ?? 0);

  const tierRows = tierQuery.data?.statistics.ticketTypeBreakdown ?? [];
  const maxTierSold = Math.max(1, ...tierRows.map((r) => r.totalSold));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 24 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentAlt(colors)} />
        }
      >
        <View style={styles.header}>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>Welcome back, {user?.firstName}</Text>
            {/* <ThemeToggleButton /> */}
          </View>

          {sortedEvents.length === 0 ? (
            <EmptyState
              title="No events yet"
              body="Events you create will show up here with live revenue and ticket stats."
            />
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
                contentContainerStyle={styles.chipRow}
              >
                <Chip label="All time" active={allTime} onPress={() => setSelectedOverride("all")} />
                {liveEvent ? (
                  <Chip
                    label="Live event"
                    active={selected === liveEvent._id}
                    onPress={() => setSelectedOverride(liveEvent._id)}
                    icon={<View style={styles.liveDot} />}
                  />
                ) : null}
                {otherEvents.map((event) => (
                  <Chip
                    key={event._id}
                    label={event.title}
                    active={selected === event._id}
                    onPress={() => setSelectedOverride(event._id)}
                  />
                ))}
              </ScrollView>

              <HeroCard
                eyebrow="Available balance"
                value={formatMoney(balance.availableBalance, CURRENCY)}
                footer={[
                  { label: "Gross revenue", value: formatMoney(balance.totalRevenue, CURRENCY) },
                  { label: "Pending payout", value: formatMoney(balance.pendingWithdrawals, CURRENCY) },
                ]}
                variant="brand"
              />

              <View style={styles.statGrid}>
                <StatTile label="Tickets sold" value={ticketsSoldValue} accent />
                {showDrinks ? (
                  <StatTile label="Drinks sold" value={String(drinksSoldValue)} />
                ) : null}
              </View>

              {allTime ? (
                topByRevenue.length > 1 ? (
                  <View style={styles.revenueCard}>
                    <Text style={styles.revenueTitle}>Revenue by event</Text>
                    <View style={styles.revenueList}>
                      {topByRevenue.map((event) => {
                        const cover = resolveMediaUrl(event.coverImages?.[0]);
                        return (
                          <View key={event._id} style={styles.revenueRow}>
                            {cover ? (
                              <Image source={{ uri: cover }} style={styles.revenueThumb} />
                            ) : (
                              <View style={[styles.revenueThumb, styles.revenueThumbFallback]}>
                                <Text style={styles.revenueThumbInitial}>
                                  {event.title.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <View style={styles.revenueRowContent}>
                              <View style={styles.revenueLabelRow}>
                                <Text style={styles.revenueLabel} numberOfLines={1}>
                                  {event.title}
                                </Text>
                                <Text style={styles.revenueValue}>
                                  {formatMoney(event.revenue, CURRENCY)}
                                </Text>
                              </View>
                              <ProgressBar progress={event.revenue / maxRevenue} />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null
              ) : selectedEvent ? (
                <>
                  {tierRows.length > 0 ? (
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>Ticket tiers</Text>
                      <View style={styles.tierList}>
                        {tierRows.map((row, index) => {
                          const allocation =
                            selectedEvent.ticketTypes.find((t) => t.name === row.ticketType)
                              ?.quantity ?? null;
                          const progress = allocation
                            ? row.totalSold / allocation
                            : row.totalSold / maxTierSold;
                          return (
                            <TierRow
                              key={`${row.ticketType}-${row.isOnDoor}-${index}`}
                              colors={colors}
                              row={row}
                              allocation={allocation}
                              progress={progress}
                              currency={CURRENCY}
                            />
                          );
                        })}
                      </View>
                    </View>
                  ) : tierQuery.isPending ? (
                    <View style={styles.tierLoadingRow}>
                      <ActivityIndicator color={accentAlt(colors)} />
                      <Text style={styles.tierLoadingText}>Loading ticket tiers…</Text>
                    </View>
                  ) : null}

                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Door check-in</Text>
                    <Text style={styles.checkinBig}>
                      {selectedEvent.ticketStats.used}
                      <Text style={styles.checkinBigMuted}> / {selectedEvent.ticketStats.total}</Text>
                    </Text>
                    <Text style={styles.checkinCaption}>
                      {selectedEvent.ticketStats.total > 0
                        ? Math.round(
                            (selectedEvent.ticketStats.used / selectedEvent.ticketStats.total) * 100,
                          )
                        : 0}
                      % checked in
                    </Text>
                    <ProgressBar
                      progress={
                        selectedEvent.ticketStats.total > 0
                          ? selectedEvent.ticketStats.used / selectedEvent.ticketStats.total
                          : 0
                      }
                      color={colors.success}
                    />
                  </View>
                </>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TierRow({
  colors,
  row,
  allocation,
  progress,
  currency,
}: {
  colors: ThemeColors;
  row: TicketTypeBreakdownRow;
  allocation: number | null;
  progress: number;
  currency: Currency;
}) {
  return (
    <View style={styles_tierRow.row}>
      <View style={styles_tierRow.labelRow}>
        <View style={styles_tierRow.nameGroup}>
          <Text style={[styles_tierRow.tag, { color: colors.textMuted }]}>
            {row.isOnDoor ? "On-door" : "Online"}
          </Text>
          <Text style={[styles_tierRow.name, { color: colors.ink }]} numberOfLines={1}>
            {row.ticketType}
          </Text>
        </View>
        <Text style={[styles_tierRow.meta, { color: colors.textMuted }]}>
          {row.totalSold}
          {allocation ? `/${allocation}` : ""} sold · {formatMoney(row.totalRevenue, currency)}
        </Text>
      </View>
      <ProgressBar progress={progress} color={colors.accent} />
    </View>
  );
}

const styles_tierRow = StyleSheet.create({
  row: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  nameGroup: {
    flexShrink: 1,
    gap: 2,
  },
  tag: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  meta: {
    fontSize: 12,
    textAlign: "right",
  },
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      padding: 20,
      gap: 12,
    },
    header: {
      gap: 20,
      marginBottom: 4,
    },
    greetingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    greeting: {
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: 21,
      color: colors.ink,
    },

    chipScroll: {
      marginHorizontal: -20,
    },
    chipRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 20,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },

    statGrid: {
      flexDirection: "row",
      gap: 12,
    },

    revenueCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      boxShadow: cardShadow(colors),
      padding: 20,
    },
    revenueTitle: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.ink,
    },
    revenueList: {
      marginTop: 14,
      gap: 14,
    },
    revenueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    revenueThumb: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.surfaceAlt,
    },
    revenueThumbFallback: {
      alignItems: "center",
      justifyContent: "center",
    },
    revenueThumbInitial: {
      fontFamily: fonts.extrabold,
      fontSize: 16,
      color: colors.textMuted,
    },
    revenueRowContent: {
      flex: 1,
      gap: 8,
    },
    revenueLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    revenueLabel: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.ink,
      flexShrink: 1,
    },
    revenueValue: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
      fontVariant: ["tabular-nums"],
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      boxShadow: cardShadow(colors),
      padding: 20,
      gap: 14,
    },
    cardTitle: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.ink,
    },
    tierList: {
      gap: 14,
    },
    tierLoadingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 20,
    },
    tierLoadingText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },

    checkinBig: {
      fontFamily: fonts.bold,
      fontSize: 32,
      color: colors.ink,
      fontVariant: ["tabular-nums"],
      marginTop: -4,
    },
    checkinBigMuted: {
      fontFamily: fonts.body,
      fontSize: 16,
      color: colors.textMuted,
    },
    checkinCaption: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: -8,
    },

    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
