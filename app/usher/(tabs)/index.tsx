import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMyUsherEvents } from "@/api/ushers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { EventCoverCard } from "@/components/EventCoverCard";
import { LoadingScreen } from "@/components/LoadingScreen";

import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

/**
 * An usher holds at most one live event grant at a time — redeeming a new
 * code silently replaces whatever grant they had before (confirmed by the
 * team building the usher backend, 2026-09-07: unlock-event now revokes
 * every other grant before creating the new one). GET /api/ushers/my-events
 * still returns an array, but it's 0 or 1 items in practice — so this reads
 * as "my current event," not a picker over several.
 */
export default function UsherEventScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [refreshing, setRefreshing] = useState(false);

  const eventsQuery = useQuery({
    queryKey: ["usher-my-events"],
    queryFn: getMyUsherEvents,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await eventsQuery.refetch();
    setRefreshing(false);
  }, [eventsQuery]);

  if (eventsQuery.isPending) {
    return <LoadingScreen />;
  }

  if (eventsQuery.isError) {
    const message = bannerMessageFor(eventsQuery.error) ?? "Couldn't load your event.";
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Banner kind="error" message={message} />
          <Button label="Try again" onPress={() => eventsQuery.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const current = eventsQuery.data.data[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <Text style={styles.title}>Your event</Text>

        {current ? (
          <>
            <EventCoverCard event={current.event}>
              <View style={styles.scanButtonWrap}>
                <Button
                  label="Scan tickets"
                  onPress={() =>
                    router.push({
                      pathname: "/usher/scanner/[eventId]",
                      params: { eventId: current.event._id, title: current.event.title },
                    })
                  }
                />
              </View>
            </EventCoverCard>

            <Text
              style={styles.switchLink}
              onPress={() => router.push("/usher/unlock")}
              accessibilityRole="link"
            >
              Switch to a different event
            </Text>
          </>
        ) : (
          <>
            <EmptyState
              title="No event yet"
              body="Enter the code your organizer or admin gave you to start scanning tickets for an event."
            />
            <Button label="Unlock an event" onPress={() => router.push("/usher/unlock")} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      gap: 16,
      flexGrow: 1,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: colors.ink,
    },
    scanButtonWrap: {
      padding: 16,
      paddingTop: 14,
    },
    switchLink: {
      alignSelf: "center",
      fontSize: 14,
      fontWeight: "600",
      color: colors.textMuted,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
