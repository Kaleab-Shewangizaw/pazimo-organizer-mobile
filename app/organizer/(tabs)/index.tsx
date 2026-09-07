import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getOrganizerDashboard } from "@/api/organizers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { HeroCard } from "@/components/HeroCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ProgressBar } from "@/components/ProgressBar";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";
import type { DashboardEvent } from "@/types";

const CURRENCY = "ETB" as const;

export default function OrganizerHomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const organizerId = user?._id;
  const [refreshing, setRefreshing] = useState(false);

  const query = useQuery({
    queryKey: ["organizer-dashboard", organizerId, CURRENCY],
    queryFn: () => getOrganizerDashboard(organizerId as string, CURRENCY),
    enabled: !!organizerId,
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

  const { balance, stats, events } = query.data.data;
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
  const topByRevenue = [...events].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const maxRevenue = Math.max(1, ...topByRevenue.map((e) => e.revenue));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <FlatList<DashboardEvent>
        data={sortedEvents}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good to see you, {user?.firstName}</Text>
              <Text style={styles.subtitle}>Here's tonight's tally</Text>
            </View>

            <HeroCard
              eyebrow="Available balance"
              value={formatMoney(balance.availableBalance, CURRENCY)}
              footer={[
                { label: "Total revenue", value: formatMoney(balance.totalRevenue, CURRENCY) },
                { label: "Pending payout", value: formatMoney(balance.pendingWithdrawals, CURRENCY) },
              ]}
            />

            <View style={styles.statStrip}>
              <StatStripItem colors={colors} value={stats.totalEvents} label="Events" />
              <View style={styles.statDivider} />
              <StatStripItem colors={colors} value={stats.publishedEvents} label="Published" />
              <View style={styles.statDivider} />
              <StatStripItem colors={colors} value={stats.draftEvents} label="Draft" />
            </View>

            {topByRevenue.length > 1 ? (
              <View style={styles.revenueCard}>
                <Text style={styles.revenueTitle}>Revenue by event</Text>
                <View style={styles.revenueList}>
                  {topByRevenue.map((event) => (
                    <View key={event._id} style={styles.revenueRow}>
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
                  ))}
                </View>
              </View>
            ) : null}

            <Text style={styles.sectionEyebrow}>Your events</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.eventCardWrap}>
            <EventCard event={item} currency={CURRENCY} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No events yet"
            body="Events you create will show up here with live ticket and revenue stats."
          />
        }
      />
    </SafeAreaView>
  );
}

function StatStripItem({ colors, value, label }: { colors: ThemeColors; value: number; label: string }) {
  const styles = createStyles(colors);
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

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
    greeting: {
      fontFamily: fonts.bold,
      fontSize: 21,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 2,
    },

    statStrip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    statDivider: {
      width: 1,
      alignSelf: "stretch",
      backgroundColor: colors.border,
    },
    statValue: {
      fontFamily: fonts.bold,
      fontSize: 20,
      color: colors.ink,
      fontVariant: ["tabular-nums"],
    },
    statLabel: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },

    revenueCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
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

    sectionEyebrow: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginTop: 4,
    },
    eventCardWrap: {
      marginBottom: 14,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
