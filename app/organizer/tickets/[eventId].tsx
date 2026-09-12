import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getEventTickets } from "@/api/tickets";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ListRow } from "@/components/ListRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { StatTile } from "@/components/StatTile";
import { TextField } from "@/components/TextField";
import { UsherCodeSheet } from "@/components/UsherCodeSheet";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import { goBack } from "@/lib/navigation";
import { accentAlt, cardShadow, type ThemeColors } from "@/lib/theme";
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
 *
 * Split into two queries: `statsQuery` (limit=1) gets the header numbers
 * and ticket-type breakdown cheaply — the backend computes those from a
 * separate aggregate that ignores `limit`, so this costs the same as a
 * full fetch would for the stats themselves, but the buyer rows (which can
 * run to hundreds of rows of user PII) only come down once the organizer
 * actually asks for them via "Show tickets", instead of on every visit.
 */
export default function EventTicketsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { eventId, title, cover } = useLocalSearchParams<{
    eventId: string;
    title?: string;
    cover?: string;
  }>();
  const [search, setSearch] = useState("");
  const [ticketsRevealed, setTicketsRevealed] = useState(false);
  const [usherCodeOpen, setUsherCodeOpen] = useState(false);

  const statsQuery = useQuery({
    queryKey: ["event-tickets", eventId, "stats"],
    queryFn: () => getEventTickets(eventId, 1, 1),
    enabled: !!eventId,
  });

  const listQuery = useQuery({
    queryKey: ["event-tickets", eventId, "list"],
    queryFn: () => getEventTickets(eventId, 1, 100),
    enabled: !!eventId && ticketsRevealed,
  });

  if (statsQuery.isPending) {
    return <LoadingScreen />;
  }

  if (statsQuery.isError) {
    const message = bannerMessageFor(statsQuery.error) ?? "Couldn't load ticket sales.";
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Banner kind="error" message={message} />
          <Button label="Try again" onPress={() => statsQuery.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const { statistics } = statsQuery.data;
  const tickets = listQuery.data?.tickets ?? [];
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
        <Pressable onPress={() => goBack("/organizer/tickets")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {title ?? "Ticket sales"}
        </Text>
        <Pressable
          onPress={() => setUsherCodeOpen(true)}
          hitSlop={12}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Usher code"
        >
          <Ionicons name="key-outline" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <UsherCodeSheet
        eventId={eventId}
        visible={usherCodeOpen}
        onClose={() => setUsherCodeOpen(false)}
      />

      <FlatList<OrganizerTicket>
        data={ticketsRevealed ? filtered : []}
        keyExtractor={(item) => item.ticketId}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            {cover ? (
              <Image source={{ uri: cover }} style={styles.heroImage} />
            ) : (
              <View style={[styles.heroImage, styles.heroFallback]}>
                <Text style={styles.heroFallbackInitial}>
                  {(title ?? "?").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

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
                <View style={styles.typesGrid}>
                  {statistics.ticketTypeBreakdown.map((row, index) => (
                    <View key={`${row.ticketType}-${row.isOnDoor}-${index}`} style={styles.typeCard}>
                      <Text style={styles.typeCardMeta}>{row.isOnDoor ? "On-door" : "Online"}</Text>
                      <Text style={styles.typeCardName} numberOfLines={1}>
                        {row.ticketType}
                      </Text>
                      <Text style={styles.typeCardPrice}>
                        {formatMoney(row.pricePerTicket, CURRENCY)} each
                      </Text>
                      <View style={styles.typeCardFooter}>
                        <Text style={styles.typeCardSold}>{row.totalSold} sold</Text>
                        <Text style={styles.typeCardRevenue}>
                          {formatMoney(row.totalRevenue, CURRENCY)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            <Text style={styles.sectionEyebrow}>Buyers</Text>
            {ticketsRevealed ? (
              <TextField
                label=""
                placeholder="Search by name, email, or ticket ID"
                value={search}
                onChangeText={setSearch}
                style={styles.search}
              />
            ) : (
             
                
                <Button
                  label="Show tickets"
                  variant="secondary"
                  onPress={() => setTicketsRevealed(true)}
                  disabled={statistics.totalTickets === 0}
                />
              
            )}

            {ticketsRevealed && listQuery.isError ? (
              <Banner
                kind="error"
                message={bannerMessageFor(listQuery.error) ?? "Couldn't load buyers."}
              />
            ) : null}
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
          !ticketsRevealed ? null : listQuery.isPending ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={accentAlt(colors)} />
              <Text style={styles.loadingText}>Loading buyers…</Text>
            </View>
          ) : listQuery.isError ? null : (
            <EmptyState
              title={search ? "No matches" : "No paid tickets yet"}
              body={
                search
                  ? "Try a different name, email, or ticket ID."
                  : "Ticket sales for this event will show up here."
              }
            />
          )
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
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
    },
    listContent: {
      padding: 20,
    },
    header: {
      gap: 14,
      marginBottom: 4,
    },
    heroImage: {
      width: "100%",
      height: 160,
      borderRadius: 20,
      backgroundColor: colors.surfaceAlt,
    },
    heroFallback: {
      alignItems: "center",
      justifyContent: "center",
    },
    heroFallbackInitial: {
      fontFamily: fonts.extrabold,
      fontSize: 44,
      color: colors.textMuted,
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
      marginTop: 4,
    },
    typesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    typeCard: {
      flexBasis: "47%",
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      boxShadow: cardShadow(colors),
      padding: 14,
      gap: 4,
    },
    typeCardMeta: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.textMuted,
    },
    typeCardName: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.ink,
    },
    typeCardPrice: {
      fontSize: 12,
      color: colors.textMuted,
    },
    typeCardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 6,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    typeCardSold: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.ink,
    },
    typeCardRevenue: {
      fontSize: 13,
      color: colors.accentText,
      fontWeight: "700",
    },
    showTicketsCard: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 16,
      padding: 16,
      gap: 12,
    },
    showTicketsBody: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 19,
    },
    search: {
      marginTop: -2,
    },
    loadingRow: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      gap: 10,
    },
    loadingText: {
      fontFamily: fonts.body,
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
