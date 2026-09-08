import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/StatusBadge";
import { StubDivider } from "@/components/StubDivider";
import { fonts } from "@/lib/fonts";
import { formatEventDateRange } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { cardShadow, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import type { EventStatus } from "@/types";

/** The event fields the cover actually needs — a subset both `DashboardEvent`
 * (organizer) and `UsherEventGrant["event"]` (usher) satisfy as-is. */
export interface EventCoverCardEvent {
  title: string;
  startDate: string;
  endDate: string;
  location?: { address?: string; city?: string; country?: string };
  coverImages?: string[];
  status: EventStatus;
}

interface EventCoverCardProps {
  event: EventCoverCardEvent;
  onPress?: () => void;
  /** Hide the publish-status badge — e.g. the organizer's Tickets tab, where every listed event is already relevant regardless of status. */
  showStatus?: boolean;
  /** Cover photo height — defaults to the list-card size. Pass something taller for a single-event hero use (e.g. the usher's "Your event" screen). */
  coverHeight?: number;
  /** Rendered below the ticket-stub tear line, on the card's own surface — sold/checked-in/revenue metrics for the organizer's EventCard, a "Scan tickets" button for the usher's. Omitted entirely (no divider either) when there's nothing to show there. */
  children?: ReactNode;
}

const META_ICON_COLOR = "rgba(255, 255, 255, 0.85)";

/**
 * The cover photo runs the full height above the tear line — title, date,
 * and location sit on top of it (a dark gradient scrim keeps them readable
 * over any photo). What goes below the tear line is up to the caller.
 * Shared by the organizer's EventCard and the usher's current-event card so
 * both roles get the same photo treatment instead of each hand-rolling it.
 */
export function EventCoverCard({
  event,
  onPress,
  showStatus = true,
  coverHeight,
  children,
}: EventCoverCardProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cover = resolveMediaUrl(event.coverImages?.[0]);
  const dateLabel = formatEventDateRange(event.startDate, event.endDate);
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={
        onPress
          ? ({ pressed }: { pressed: boolean }) => [styles.card, pressed && styles.pressed]
          : styles.card
      }
    >
      <View style={styles.clip}>
        <View style={[styles.cover, coverHeight ? { height: coverHeight } : null]}>
          {cover ? (
            <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.coverFallback]}>
              <Text style={styles.coverInitial}>{event.title.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.75)"]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />

          {showStatus ? (
            <View style={styles.statusPill}>
              <StatusBadge status={event.status} />
            </View>
          ) : null}

          <View style={styles.coverText}>
            <Text style={styles.title} numberOfLines={1}>
              {event.title}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={12} color={META_ICON_COLOR} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {dateLabel}
                </Text>
              </View>
              {event.location?.city ? (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={12} color={META_ICON_COLOR} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {event.location.city}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {children ? (
          <>
            <StubDivider background={colors.surface} />
            {children}
          </>
        ) : null}
      </View>
    </Wrapper>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: 16,
      boxShadow: cardShadow(colors),
    },
    // Separate from `card` because a box-shadow gets clipped by whatever
    // view casts it if that same view also has `overflow: hidden` — and
    // this needs overflow hidden to round off the cover photo's corners.
    clip: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: "hidden",
    },
    pressed: {
      opacity: 0.85,
    },
    cover: {
      width: "100%",
      height: 200,
      justifyContent: "flex-end",
    },
    coverFallback: {
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 28,
    },
    coverInitial: {
      fontFamily: fonts.extrabold,
      fontSize: 40,
      color: colors.textMuted,
    },
    statusPill: {
      position: "absolute",
      top: 12,
      right: 12,
      backgroundColor: "rgba(16, 19, 24, 0.55)",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    coverText: {
      padding: 16,
      gap: 5,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 17,
      color: "#FFFFFF",
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    metaText: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.85)",
    },
  });
