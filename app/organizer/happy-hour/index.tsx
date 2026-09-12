import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getOrganizerDashboard } from "@/api/organizers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatEventDateRange } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { cardShadow, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";

const CURRENCY = "ETB" as const;

/**
 * Pick which event to run happy hour for — reached from the wine-glass icon
 * on the Bar tab's header. Every event, not just ones with beverage
 * revenue already (unlike the Bar tab's own "By event" list): an event's
 * very first happy hour has no sales yet to have shown up there.
 */
export default function HappyHourEventPickerScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const organizerId = useAuthStore((s) => s.user?._id);

  const query = useQuery({
    queryKey: ["organizer-dashboard", organizerId, CURRENCY],
    queryFn: () => getOrganizerDashboard(organizerId as string, CURRENCY),
    enabled: !!organizerId,
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>Happy hour</Text>
      </View>

      {query.isPending ? (
        <LoadingScreen />
      ) : query.isError ? (
        <View style={styles.errorContainer}>
          <Banner kind="error" message={bannerMessageFor(query.error) ?? "Couldn't load your events."} />
          <Button label="Try again" onPress={() => query.refetch()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>Pick an event to set up or manage its happy hour.</Text>

          {query.data.data.events.length === 0 ? (
            <EmptyState title="No events yet" body="Create an event to run a happy hour on it." />
          ) : (
            <View style={styles.list}>
              {query.data.data.events.map((event) => {
                const cover = resolveMediaUrl(event.coverImages?.[0]);
                return (
                  <Pressable
                    key={event._id}
                    onPress={() =>
                      router.push({
                        pathname: "/organizer/happy-hour/[eventId]",
                        params: { eventId: event._id, eventTitle: event.title },
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
