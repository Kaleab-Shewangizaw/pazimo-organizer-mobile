import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getEventTickets } from "@/api/tickets";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ListRow } from "@/components/ListRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { StatTile } from "@/components/StatTile";
import { TextField } from "@/components/TextField";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import type { OrganizerTicket, TicketStatus } from "@/types";

const CURRENCY = "ETB" as const;

const STATUS_COLOR = (colors: ThemeColors): Partial<Record<TicketStatus, string>> => ({
  active: colors.success,
  confirmed: colors.success,
  used: colors.textMuted,
  cancelled: colors.error,
  declined: colors.error,
  expired: colors.warning,
  pending: colors.warning,
});

/**
 * Per-event ticket sales — which ticket types this event sold, how many,
 * and how much they collected, plus the individual sale rows. Mirrors the
 * web app's organizer/customers page (same GET /api/tickets/event/:eventId).
 */
export default function EventTicketsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { eventId, title } = useLocalSearchParams<{ eventId: string; title?: string }>();
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["event-tickets", eventId],
    queryFn: () => getEventTickets(eventId, 1, 100),
    enabled: !!eventId,
  });

  if (query.isPending) {
    return <LoadingScreen />;
  }

  if (query.isError) {
    const message = bannerMessageFor(query.error) ?? "Couldn't load ticket sales.";
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Banner kind="error" message={message} />
          <Button label="Try again" onPress={() => query.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const { tickets, statistics } = query.data;
  const searchLower = search.trim().toLowerCase();
  const filtered = searchLower
    ? tickets.filter((t) => {
        const name = t.user?.name?.toLowerCase() ?? "";
        const email = t.user?.email?.toLowerCase() ?? "";
        return (
          name.includes(searchLower) ||
          email.includes(searchLower) ||
          t.ticketId.toLowerCase().includes(searchLower)
        );
      })
    : tickets;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {title ?? "Ticket sales"}
        </Text>
      </View>

      <FlatList<OrganizerTicket>
        data={filtered}
        keyExtractor={(item) => item.ticketId}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.statsRow}>
              <StatTile
                label="Total revenue"
                value={formatMoney(statistics.totalRevenue, CURRENCY)}
                accent
              />
              <StatTile label="Tickets sold" value={String(statistics.totalTickets)} />
            </View>

            {statistics.ticketTypeBreakdown.length > 0 ? (
              <>
                <Text style={styles.sectionEyebrow}>Ticket types</Text>
                {statistics.ticketTypeBreakdown.map((row, index) => (
                  <View key={`${row.ticketType}-${row.isOnDoor}-${index}`} style={styles.typeRow}>
                    <View style={styles.typeLeft}>
                      <Text style={styles.typeName}>{row.ticketType}</Text>
                      <Text style={styles.typeMeta}>
                        {row.isOnDoor ? "On-door" : "Online"} · {formatMoney(row.pricePerTicket, CURRENCY)} each
                      </Text>
                    </View>
                    <View style={styles.typeRight}>
                      <Text style={styles.typeSold}>{row.totalSold} sold</Text>
                      <Text style={styles.typeRevenue}>{formatMoney(row.totalRevenue, CURRENCY)}</Text>
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            <Text style={styles.sectionEyebrow}>Buyers</Text>
            <TextField
              label=""
              placeholder="Search by name, email, or ticket ID"
              value={search}
              onChangeText={setSearch}
              style={styles.search}
            />
          </View>
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.user?.name?.trim() || "Guest"}
            subtitle={`${item.ticketType ?? "Ticket"} · ${new Date(item.createdAt).toLocaleDateString()}`}
            amount={item.price > 0 ? formatMoney(item.price, CURRENCY) : "Free"}
            statusLabel={item.status}
            statusColor={STATUS_COLOR(colors)[item.status]}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title={search ? "No matches" : "No paid tickets yet"}
            body={
              search
                ? "Try a different name, email, or ticket ID."
                : "Ticket sales for this event will show up here."
            }
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
    listContent: {
      padding: 20,
    },
    header: {
      gap: 12,
      marginBottom: 4,
    },
    statsRow: {
      flexDirection: "row",
      gap: 12,
    },
    sectionEyebrow: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginTop: 8,
    },
    typeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    typeLeft: {
      flex: 1,
      gap: 2,
    },
    typeName: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.ink,
    },
    typeMeta: {
      fontSize: 12,
      color: colors.textMuted,
    },
    typeRight: {
      alignItems: "flex-end",
      gap: 2,
    },
    typeSold: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.ink,
    },
    typeRevenue: {
      fontSize: 13,
      color: colors.accent,
      fontWeight: "700",
    },
    search: {
      marginTop: -2,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
