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
import { StatTile } from "@/components/StatTile";
import { bannerMessageFor } from "@/lib/errors";
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.greetingRow}>
              <View>
                <Text style={styles.greeting}>
                  Welcome back, {user?.firstName}
                </Text>
                <Text style={styles.subtitle}>Here's how your events are doing</Text>
              </View>
            </View>

            <View style={styles.statGrid}>
              <StatTile label="Total events" value={String(stats.totalEvents)} />
              <StatTile label="Published" value={String(stats.publishedEvents)} />
              <StatTile
                label="Available balance"
                value={formatMoney(balance.availableBalance, CURRENCY)}
              />
              <StatTile
                label="Total revenue"
                value={formatMoney(balance.totalRevenue, CURRENCY)}
              />
            </View>

            <Text style={styles.sectionTitle}>Your events</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  header: {
    gap: 16,
    marginBottom: 4,
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  eventCardWrap: {
    marginBottom: 12,
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
