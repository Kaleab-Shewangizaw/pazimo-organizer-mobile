import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getOrganizerDashboard } from "@/api/organizers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { StatusBadge } from "@/components/StatusBadge";
import { bannerMessageFor } from "@/lib/errors";
import { formatEventDateRange, formatMoney } from "@/lib/format";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";
import type { DashboardEvent } from "@/types";
import { Ionicons } from "@expo/vector-icons";

const CURRENCY = "ETB" as const;

/**
 * Tickets are event-first, matching the web app's organizer/customers page:
 * pick an event before seeing anything about who bought what. Reuses the
 * dashboard's cached query (same queryKey) so opening this tab right after
 * Dashboard costs no extra request.
 */
export default function OrganizerTicketsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const organizerId = useAuthStore((s) => s.user?._id);

  const query = useQuery({
    queryKey: ["organizer-dashboard", organizerId, CURRENCY],
    queryFn: () => getOrganizerDashboard(organizerId as string, CURRENCY),
    enabled: !!organizerId,
  });

  if (query.isPending) {
    return <LoadingScreen />;
  }

  if (query.isError) {
    const message = bannerMessageFor(query.error) ?? "Couldn't load your events.";
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Banner kind="error" message={message} />
          <Button label="Try again" onPress={() => query.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const events = [...query.data.data.events].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <FlatList<DashboardEvent>
        data={events}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Tickets</Text>
            <Text style={styles.subtitle}>Select an event to see its ticket sales</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/organizer/tickets/[eventId]", params: { eventId: item._id, title: item.title } })
            }
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.rowSubtitle}>
                {formatEventDateRange(item.startDate, item.endDate)} · {item.ticketStats.total} sold ·{" "}
                {formatMoney(item.revenue, CURRENCY)}
              </Text>
            </View>
            <StatusBadge status={item.status} />
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No events yet"
            body="Once you create events, select one here to see its ticket sales."
          />
        }
      />
    </SafeAreaView>
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
    },
    header: {
      gap: 4,
      marginBottom: 12,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: colors.ink,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowPressed: {
      opacity: 0.6,
    },
    rowLeft: {
      flex: 1,
      gap: 3,
    },
    rowTitle: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.ink,
    },
    rowSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
