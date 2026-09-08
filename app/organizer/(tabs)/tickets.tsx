import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getOrganizerDashboard } from "@/api/organizers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useTabBarHeight } from "@/components/TabBarHeightProvider";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { resolveMediaUrl } from "@/lib/media";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";
import type { DashboardEvent } from "@/types";

const CURRENCY = "ETB" as const;

/**
 * Tickets are event-first, matching the web app's organizer/customers page:
 * pick an event before seeing anything about who bought what. Reuses the
 * dashboard's cached query (same queryKey) so opening this tab right after
 * Dashboard costs no extra request.
 *
 * Rows are the same EventCard used elsewhere (cover art, ticket-stub tear
 * line, sold/checked-in/revenue metrics) with the status badge hidden —
 * every event listed here is fair game to open regardless of publish
 * status, so the badge would only add noise.
 */
export default function OrganizerTicketsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useTabBarHeight();
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
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 24 }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Tickets</Text>
            <Text style={styles.subtitle}>Select an event to see its ticket sales</Text>
          </View>
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            currency={CURRENCY}
            showStatus={false}
            onPress={() =>
              router.push({
                pathname: "/organizer/tickets/[eventId]",
                params: {
                  eventId: item._id,
                  title: item.title,
                  cover: resolveMediaUrl(item.coverImages?.[0]) ?? "",
                },
              })
            }
          />
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
      flexGrow: 1,
    },
    header: {
      gap: 4,
      marginBottom: 18,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
    },
    separator: {
      height: 14,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
