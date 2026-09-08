import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMyUsherEvents } from "@/api/ushers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useTabBarHeight } from "@/components/TabBarHeightProvider";
import { TicketScanner } from "@/components/TicketScanner";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

/**
 * Middle tab, next to Events — a fast path straight into the camera for
 * whichever event the usher currently holds a grant for, so they don't have
 * to go through the Events tab and tap "Scan tickets" first. Shares the
 * "usher-my-events" query key with the Events tab, so switching here right
 * after that tab has already loaded is instant.
 */
export default function UsherScanTabScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useTabBarHeight();

  const eventsQuery = useQuery({
    queryKey: ["usher-my-events"],
    queryFn: getMyUsherEvents,
  });

  if (eventsQuery.isPending) {
    return <LoadingScreen />;
  }

  if (eventsQuery.isError) {
    const message = bannerMessageFor(eventsQuery.error) ?? "Couldn't load your event.";
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.errorContainer, { paddingBottom: tabBarHeight }]}>
          <Banner kind="error" message={message} />
          <Button label="Try again" onPress={() => eventsQuery.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const current = eventsQuery.data.data[0];

  if (!current) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={[styles.emptyContent, { paddingBottom: tabBarHeight }]}>
          <Text style={styles.title}>Scan</Text>
          <EmptyState
            title="No event to scan"
            body="Unlock an event from the Events tab, then come back here to start scanning tickets at the door."
          />
        </View>
      </SafeAreaView>
    );
  }

  return <TicketScanner eventId={current.event._id} title={current.event.title} />;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
    emptyContent: {
      flex: 1,
      padding: 20,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: colors.ink,
    },
  });
