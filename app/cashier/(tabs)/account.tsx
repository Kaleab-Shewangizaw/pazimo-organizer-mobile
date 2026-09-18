import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCinemaCashierContext, getCinemaProfile } from "@/api/cinema";
import { getMyCashierEvents } from "@/api/eventCashiers";
import { getVenueIdentity } from "@/api/venue";
import { useTabBarHeight } from "@/components/TabBarHeightProvider";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";

export default function CashierAccountScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useTabBarHeight();
  const user = useAuthStore((s) => s.user);

  // Four distinct accounts share this one screen, each with its own
  // cashier-safe (or, for the owner, full) way to learn the business/event
  // name — GET /cinemas/me and GET /venues/me are both owner-only, so a real
  // cashier reads a narrower endpoint instead. Only one of these four ever
  // runs for a given sign-in.
  const isOwner = user?.role === "cinema";
  const isVenueCashier = user?.role === "cashier" && !!user.venue;
  const isCinemaCashier = user?.role === "cashier" && !!user.cinema;
  const isEventCashier = user?.role === "cashier" && !user.cinema && !user.venue;

  const ownerProfileQuery = useQuery({
    queryKey: ["cinema-profile"],
    queryFn: getCinemaProfile,
    enabled: isOwner,
  });
  const cinemaCashierContextQuery = useQuery({
    queryKey: ["cinema-cashier-context"],
    queryFn: getCinemaCashierContext,
    enabled: isCinemaCashier,
  });
  const venueIdentityQuery = useQuery({
    queryKey: ["venue-identity", user?.venue],
    queryFn: () => getVenueIdentity(user!.venue!),
    enabled: isVenueCashier,
  });
  // An event cashier has no permanent business — "which business" is
  // whichever event it currently holds a live CashierEventAccess grant for.
  const cashierEventsQuery = useQuery({
    queryKey: ["cashier-my-events"],
    queryFn: getMyCashierEvents,
    enabled: isEventCashier,
  });

  const businessName = isOwner
    ? ownerProfileQuery.data?.data.name
    : isCinemaCashier
      ? cinemaCashierContextQuery.data?.data.name
      : isVenueCashier
        ? venueIdentityQuery.data?.venue.name
        : isEventCashier
          ? cashierEventsQuery.data?.data[0]?.event.title
          : undefined;
  const roleLabel = isOwner
    ? "Cashier"
    : isVenueCashier
      ? "Bar cashier"
      : isEventCashier
        ? "Event cashier"
        : "Cinema cashier";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Account</Text>
          <Pressable
            onPress={() => router.push("/cashier/account/menu")}
            hitSlop={12}
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel="Account menu"
          >
            <Ionicons name="menu-outline" size={22} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>
            {user?.firstName?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.role}>
          {roleLabel}
          {businessName ? ` · ${businessName}` : ""}
        </Text>

        <View style={styles.section}>
          <InfoRow colors={colors} label="Email" value={user?.email ?? "—"} />
          <InfoRow colors={colors} label="Phone" value={user?.phoneNumber ?? "—"} last />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  colors,
  label,
  value,
  last,
}: {
  colors: ThemeColors;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles_infoRow.row,
        { borderBottomColor: colors.border },
        last && { borderBottomWidth: 0 },
      ]}
    >
      <Text style={[styles_infoRow.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles_infoRow.value, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

const styles_infoRow = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
  },
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      alignItems: "center",
    },
    titleRow: {
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 20,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: colors.ink,
    },
    menuButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    avatarInitial: {
      fontFamily: fonts.extrabold,
      fontSize: 28,
      color: colors.accentText,
    },
    name: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.ink,
    },
    role: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
      marginBottom: 24,
    },
    section: {
      alignSelf: "stretch",
      marginBottom: 28,
    },
  });
