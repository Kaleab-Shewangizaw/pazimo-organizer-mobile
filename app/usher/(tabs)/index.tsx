import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMyUsherEvents } from "@/api/ushers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { StatusBadge } from "@/components/StatusBadge";
import { bannerMessageFor } from "@/lib/errors";
import { formatEventDateRange } from "@/lib/format";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import type { UsherEventGrant } from "@/types";

/**
 * An usher's home is "which event am I scanning for" — access is granted
 * per event by redeeming a code (see app/usher/unlock.tsx), and one usher
 * can hold access to more than one event at once, so this is a list rather
 * than a single assumed event.
 */
export default function UsherEventsScreen() {
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
    const message = bannerMessageFor(eventsQuery.error) ?? "Couldn't load your events.";
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Banner kind="error" message={message} />
          <Button label="Try again" onPress={() => eventsQuery.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const grants = eventsQuery.data.data;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <FlatList<UsherEventGrant>
        data={grants}
        keyExtractor={(item) => item.event._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Your events</Text>
            <Text style={styles.subtitle}>Pick an event to start scanning tickets</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/usher/scanner/[eventId]",
                params: { eventId: item.event._id, title: item.event.title },
              })
            }
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.event.title}
              </Text>
              <StatusBadge status={item.event.status} />
            </View>
            <Text style={styles.cardDate}>
              {formatEventDateRange(item.event.startDate, item.event.endDate)}
              {item.event.location?.city ? ` · ${item.event.location.city}` : ""}
            </Text>
            <View style={styles.scanRow}>
              <Ionicons name="qr-code-outline" size={16} color={colors.accent} />
              <Text style={styles.scanLabel}>Scan tickets</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No events yet"
            body="Enter the code your organizer or admin gave you to start scanning tickets for an event."
          />
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Button label="Unlock an event" onPress={() => router.push("/usher/unlock")} />
          </View>
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
      gap: 12,
    },
    header: {
      gap: 4,
      marginBottom: 4,
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 8,
      marginBottom: 4,
    },
    pressed: {
      opacity: 0.85,
    },
    cardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    cardTitle: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.ink,
      flexShrink: 1,
    },
    cardDate: {
      fontSize: 13,
      color: colors.textMuted,
    },
    scanRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    scanLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: colors.ink,
    },
    footer: {
      marginTop: 12,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
