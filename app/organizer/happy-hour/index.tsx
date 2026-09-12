import { Ionicons } from "@expo/vector-icons";
import { useQueries, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getEventBeverageLineup } from "@/api/beverages";
import { getOrganizerDashboard } from "@/api/organizers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatEventDateRange } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { goBack } from "@/lib/navigation";
import { cardShadow, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";
import type { DashboardEvent } from "@/types";

const CURRENCY = "ETB" as const;

/**
 * Pick which event to run happy hour for — reached from the wine-glass icon
 * on the Bar tab's header. A sold-out event is still fine (happy hour is
 * about drinks, not tickets) — but an *ended* one isn't, since a happy hour
 * can't outlive its own event. Also needs at least one drink currently in
 * stock and available to sell. There's no single backend endpoint for
 * that — listBeverageEvents (beverageFinanceController.js) is admin-only —
 * so this cross-checks each not-yet-ended event's own line-up (GET
 * .../beverages, already used by the creation screen) rather than one new
 * bulk endpoint.
 */
export default function HappyHourEventPickerScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const organizerId = useAuthStore((s) => s.user?._id);

  const eventsQuery = useQuery({
    queryKey: ["organizer-dashboard", organizerId, CURRENCY],
    queryFn: () => getOrganizerDashboard(organizerId as string, CURRENCY),
    enabled: !!organizerId,
  });

  const now = Date.now();
  const notEnded = (eventsQuery.data?.data.events ?? []).filter(
    (e) => new Date(e.endDate).getTime() > now,
  );

  const lineupQueries = useQueries({
    queries: notEnded.map((event) => ({
      queryKey: ["event-beverage-lineup", event._id],
      queryFn: () => getEventBeverageLineup(event._id),
    })),
  });
  const lineupsLoading = lineupQueries.some((q) => q.isPending);

  const sellingEvents: DashboardEvent[] = notEnded.filter((_, index) => {
    const rows = lineupQueries[index]?.data?.data ?? [];
    return rows.some((row) => row.isAvailable && row.remaining > 0 && !row.unavailableReason);
  });

  const isLoading = eventsQuery.isPending || (notEnded.length > 0 && lineupsLoading);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBack("/organizer/bar")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>Happy hour</Text>
      </View>

      {isLoading ? (
        <LoadingScreen />
      ) : eventsQuery.isError ? (
        <View style={styles.errorContainer}>
          <Banner
            kind="error"
            message={bannerMessageFor(eventsQuery.error) ?? "Couldn't load your events."}
          />
          <Button label="Try again" onPress={() => eventsQuery.refetch()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>Pick an event to set up or manage its happy hour.</Text>

          {sellingEvents.length === 0 ? (
            <EmptyState
              title="No eligible events"
              body="An event needs drinks currently in stock and available to sell, and not have ended yet, to run a happy hour."
            />
          ) : (
            <View style={styles.list}>
              {sellingEvents.map((event) => {
                const cover = resolveMediaUrl(event.coverImages?.[0]);
                return (
                  <Pressable
                    key={event._id}
                    onPress={() =>
                      router.push({
                        pathname: "/organizer/happy-hour/[eventId]",
                        params: {
                          eventId: event._id,
                          eventTitle: event.title,
                          eventEndDate: event.endDate,
                        },
                      })
                    }
                    style={styles.row}
                  >
                    {cover ? (
                      <Image source={{ uri: cover }} style={styles.thumb} />
                    ) : (
                      <View style={[styles.thumb, styles.thumbFallback]}>
                        <Text style={styles.thumbInitial}>{event.title.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.rowSubtitle}>
                        {formatEventDateRange(event.startDate, event.endDate)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    topBarTitle: {
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: 17,
      color: colors.ink,
    },
    content: {
      padding: 20,
      gap: 14,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
      marginTop: -4,
    },
    list: {
      gap: 10,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 16,
      boxShadow: cardShadow(colors),
      padding: 12,
    },
    thumb: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.surfaceAlt,
    },
    thumbFallback: {
      alignItems: "center",
      justifyContent: "center",
    },
    thumbInitial: {
      fontFamily: fonts.extrabold,
      fontSize: 16,
      color: colors.textMuted,
    },
    rowText: {
      flex: 1,
      gap: 2,
    },
    rowTitle: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.ink,
    },
    rowSubtitle: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
