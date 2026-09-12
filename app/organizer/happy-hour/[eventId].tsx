import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cancelEventHappyHour, listEventHappyHours, startEventHappyHour } from "@/api/beverages";
import { getOrganizerDashboard } from "@/api/organizers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatCountdown, formatMoney } from "@/lib/format";
import { goBack } from "@/lib/navigation";
import { cardShadow, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useCountdownTo } from "@/lib/useCountdownTo";
import { useAuthStore } from "@/store/authStore";
import type { HappyHourCampaign, HappyHourState } from "@/types";

const CURRENCY = "ETB" as const;

function isLive(state: HappyHourState | undefined) {
  return state?.status === "active" || state?.status === "scheduled";
}

/**
 * Per-event happy-hour control panel — reached from the event picker off
 * the Bar tab's wine-glass icon. Lists every campaign ever created for this
 * event (backend never deletes one, only cancels — see models/HappyHour.js),
 * each with its live countdown and Start/Cancel actions. Polls while
 * anything is still scheduled or active, since a campaign's status is
 * derived from wall-clock time on the server and only catches up to it on
 * the next fetch.
 */
export default function HappyHourScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const organizerId = useAuthStore((s) => s.user?._id);
  const { eventId, eventTitle, eventEndDate } = useLocalSearchParams<{
    eventId: string;
    eventTitle?: string;
    eventEndDate?: string;
  }>();
  // Threaded param used immediately (no loading flicker); confirmed/refreshed
  // against the same organizer-dashboard query the Bar tab and event picker
  // already use (normally cache-hit) once it lands. See new.tsx's identical
  // comment for why this isn't threading-only.
  const eventsQuery = useQuery({
    queryKey: ["organizer-dashboard", organizerId, CURRENCY],
    queryFn: () => getOrganizerDashboard(organizerId as string, CURRENCY),
    enabled: !!organizerId,
  });
  const fetchedEndDate = eventsQuery.data?.data.events.find((e) => e._id === eventId)?.endDate;
  const eventEnd = useMemo(() => {
    const raw = fetchedEndDate ?? eventEndDate;
    return raw ? new Date(raw) : null;
  }, [fetchedEndDate, eventEndDate]);

  const query = useQuery({
    queryKey: ["happy-hours", eventId],
    queryFn: () => listEventHappyHours(eventId),
    refetchInterval: (q) => {
      const campaigns = q.state.data?.data ?? [];
      return campaigns.some((c) => isLive(c.state)) ? 15000 : false;
    },
  });

  const startMutation = useMutation({
    mutationFn: (happyHourId: string) => startEventHappyHour(eventId, happyHourId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["happy-hours", eventId] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (happyHourId: string) => cancelEventHappyHour(eventId, happyHourId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["happy-hours", eventId] }),
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBack("/organizer/happy-hour")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          Happy hour{eventTitle ? ` · ${eventTitle}` : ""}
        </Text>
      </View>

      {query.isPending ? (
        <LoadingScreen />
      ) : query.isError ? (
        <View style={styles.errorContainer}>
          <Banner
            kind="error"
            message={bannerMessageFor(query.error) ?? "Couldn't load happy hours."}
          />
          <Button label="Try again" onPress={() => query.refetch()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Button
            label="New happy hour"
            onPress={() =>
              router.push({
                pathname: "/organizer/happy-hour/[eventId]/new",
                params: { eventId, eventTitle: eventTitle ?? "", eventEndDate: eventEndDate ?? "" },
              })
            }
          />

          {query.data.data.length === 0 ? (
            <EmptyState
              title="No happy hours yet"
              body="Create one to run a time-boxed discount on drinks for this event."
            />
          ) : (
            <View style={styles.list}>
              {query.data.data.map((campaign) => (
                <HappyHourCard
                  key={campaign._id}
                  colors={colors}
                  campaign={campaign}
                  eventEnd={eventEnd}
                  onStart={() => startMutation.mutate(campaign._id)}
                  onCancel={() => cancelMutation.mutate(campaign._id)}
                  isStarting={startMutation.isPending && startMutation.variables === campaign._id}
                  isCancelling={cancelMutation.isPending && cancelMutation.variables === campaign._id}
                />
              ))}
            </View>
          )}

          {startMutation.isError ? (
            <Banner kind="error" message={bannerMessageFor(startMutation.error) ?? "Couldn't start it."} />
          ) : null}
          {cancelMutation.isError ? (
            <Banner kind="error" message={bannerMessageFor(cancelMutation.error) ?? "Couldn't cancel it."} />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const STATE_META: Record<
  HappyHourState["status"],
  { label: string; fg: (colors: ThemeColors) => string }
> = {
  none: { label: "None", fg: (c) => c.textMuted },
  scheduled: { label: "Scheduled", fg: (c) => c.warning },
  active: { label: "Active", fg: (c) => c.success },
  ended: { label: "Ended", fg: (c) => c.textMuted },
  cancelled: { label: "Cancelled", fg: (c) => c.error },
};

function HappyHourCard({
  colors,
  campaign,
  eventEnd,
  onStart,
  onCancel,
  isStarting,
  isCancelling,
}: {
  colors: ThemeColors;
  campaign: HappyHourCampaign;
  eventEnd: Date | null;
  onStart: () => void;
  onCancel: () => void;
  isStarting: boolean;
  isCancelling: boolean;
}) {
  const styles = cardStyles(colors);
  const state = campaign.state ?? { status: "none" as const };
  const meta = STATE_META[state.status];

  const countdownTarget =
    state.status === "active" ? state.endsAt : state.status === "scheduled" ? state.startsAt : null;
  const remainingMs = useCountdownTo(countdownTarget);

  const notStartedYet = campaign.startMode === "manual" && !campaign.startedAt && !campaign.cancelledAt;
  // A manual campaign can sit un-started for a while — the event may have
  // moved on since it was created, so this checks against "now" (when the
  // organizer would actually press it), not against creation time.
  const wouldOutlastEvent =
    notStartedYet && eventEnd != null && Date.now() + campaign.durationMinutes * 60000 > eventEnd.getTime();
  const canStart = notStartedYet && !wouldOutlastEvent;
  const canCancel = state.status === "active" || state.status === "scheduled";

  let timingLine: string;
  if (state.status === "active") {
    timingLine = `Ends in ${formatCountdown(remainingMs)}`;
  } else if (state.status === "scheduled" && state.startsAt) {
    timingLine = `Starts in ${formatCountdown(remainingMs)}`;
  } else if (state.status === "scheduled") {
    timingLine = "Ready to start";
  } else if (state.status === "ended") {
    timingLine = "Happy hour ended";
  } else if (state.status === "cancelled") {
    timingLine = "Cancelled";
  } else {
    timingLine = "";
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.stateRow}>
          <View style={[styles.stateDot, { backgroundColor: meta.fg(colors) }]} />
          <Text style={[styles.stateLabel, { color: meta.fg(colors) }]}>{meta.label}</Text>
        </View>
        <Text style={styles.duration}>{campaign.durationMinutes} min</Text>
      </View>

      {timingLine ? <Text style={styles.timing}>{timingLine}</Text> : null}

      <View style={styles.itemsList}>
        {campaign.items.map((item, index) => (
          <View key={`${item.lineup}-${index}`} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.beverage?.name ?? "Drink"}
            </Text>
            <View style={styles.itemPrices}>
              {item.regularPrice != null ? (
                <Text style={styles.itemRegularPrice}>{formatMoney(item.regularPrice, CURRENCY)}</Text>
              ) : null}
              <Text style={styles.itemPrice}>{formatMoney(item.price, CURRENCY)}</Text>
            </View>
          </View>
        ))}
      </View>

      {wouldOutlastEvent ? (
        <Text style={styles.blockedNote}>
          The event ends before this {campaign.durationMinutes}-minute happy hour would — it can't be
          started now.
        </Text>
      ) : null}

      {canStart || canCancel ? (
        <View style={styles.actionRow}>
          {canStart ? (
            <Button label="Start now" onPress={onStart} loading={isStarting} style={styles.flexButton} />
          ) : null}
          {canCancel ? (
            <Button
              label="Cancel"
              variant="secondary"
              onPress={onCancel}
              loading={isCancelling}
              style={styles.flexButton}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const cardStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      boxShadow: cardShadow(colors),
      padding: 16,
      gap: 12,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    stateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    stateDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    stateLabel: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    duration: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
    },
    timing: {
      fontFamily: fonts.bold,
      fontSize: 20,
      color: colors.ink,
      fontVariant: ["tabular-nums"],
      marginTop: -4,
    },
    itemsList: {
      gap: 8,
    },
    itemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    itemName: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.ink,
      flexShrink: 1,
    },
    itemPrices: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    itemRegularPrice: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      textDecorationLine: "line-through",
    },
    itemPrice: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.success,
    },
    blockedNote: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.error,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 2,
    },
    flexButton: {
      flex: 1,
    },
  });

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
      gap: 16,
    },
    list: {
      gap: 12,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
