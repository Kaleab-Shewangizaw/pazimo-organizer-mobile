import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
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
import { LoadingScreen } from "@/components/LoadingScreen";
import { StubDivider } from "@/components/StubDivider";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import { colors } from "@/lib/theme";
import { useAuthStore } from "@/store/authStore";
import type { DashboardEvent } from "@/types";

const CURRENCY = "ETB" as const;

export default function OrganizerHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <FlatList<DashboardEvent>
        data={sortedEvents}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good to see you, {user?.firstName}</Text>
              <Text style={styles.subtitle}>Here's tonight's tally</Text>
            </View>

            <BalanceStub
              available={balance.availableBalance}
              totalRevenue={balance.totalRevenue}
              pending={balance.pendingWithdrawals}
            />

            <View style={styles.statStrip}>
              <StatStripItem value={stats.totalEvents} label="Events" />
              <View style={styles.statDivider} />
              <StatStripItem value={stats.publishedEvents} label="Published" />
              <View style={styles.statDivider} />
              <StatStripItem value={stats.draftEvents} label="Draft" />
            </View>

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
        ListFooterComponent={
          <Button
            label="Sign out"
            variant="secondary"
            onPress={signOut}
            style={styles.signOut}
          />
        }
      />
    </SafeAreaView>
  );
}

function BalanceStub({
  available,
  totalRevenue,
  pending,
}: {
  available: number;
  totalRevenue: number;
  pending: number;
}) {
  return (
    <View style={styles.stub}>
      <Text style={styles.stubEyebrow}>Available balance</Text>
      <Text style={styles.stubFigure}>{formatMoney(available, CURRENCY)}</Text>

      <StubDivider background={colors.surface} />

      <View style={styles.stubFooter}>
        <StubFooterItem label="Total revenue" value={formatMoney(totalRevenue, CURRENCY)} />
        <StubFooterItem label="Pending payout" value={formatMoney(pending, CURRENCY)} />
      </View>
    </View>
  );
}

function StubFooterItem({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.stubFooterValue}>{value}</Text>
      <Text style={styles.stubFooterLabel}>{label}</Text>
    </View>
  );
}

function StatStripItem({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
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
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },

  stub: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 4,
  },
  stubEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  stubFigure: {
    fontFamily: fonts.extrabold,
    fontSize: 34,
    color: colors.gold,
    marginTop: 6,
    marginBottom: 18,
  },
  stubFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 18,
  },
  stubFooterValue: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.ink,
  },
  stubFooterLabel: {
    fontSize: 12,
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
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
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
  signOut: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    gap: 16,
  },
});
