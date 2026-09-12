import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getBeverageEligibility, getOrganizerBeverageDashboard } from "@/api/beverages";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { HeroCard } from "@/components/HeroCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useTabBarHeight } from "@/components/TabBarHeightProvider";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import { cardShadow, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { ApiError } from "@/types";

const CURRENCY = "ETB" as const;

export default function OrganizerBarScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useTabBarHeight();

  const eligibilityQuery = useQuery({
    queryKey: ["beverage-eligibility"],
    queryFn: getBeverageEligibility,
  });

  const isEligible = eligibilityQuery.data?.data.eligibility === "eligible";

  // The eligibility route hasn't shipped on the backend yet — treat a 404
  // here as "not eligible" instead of a real error so the tab still shows
  // the gate screen instead of an error banner.
  const eligibilityRouteMissing =
    eligibilityQuery.error instanceof ApiError && eligibilityQuery.error.httpStatus === 404;

  const dashboardQuery = useQuery({
    queryKey: ["beverage-dashboard"],
    queryFn: getOrganizerBeverageDashboard,
    enabled: isEligible,
  });

  if (eligibilityQuery.isPending) {
    return <LoadingScreen />;
  }

  if (eligibilityQuery.isError && !eligibilityRouteMissing) {
    const message = bannerMessageFor(eligibilityQuery.error) ?? "Couldn't load the bar.";
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Banner kind="error" message={message} />
          <Button label="Try again" onPress={() => eligibilityQuery.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isEligible) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Bar</Text>
        </View>
        <EmptyState
          title="COMING SOON!"
          body="The bar feature is coming soon. Please check back later."
        />
      </SafeAreaView>
    );
  }

  if (dashboardQuery.isPending) {
    return <LoadingScreen />;
  }

  if (dashboardQuery.isError) {
    const message = bannerMessageFor(dashboardQuery.error) ?? "Couldn't load the bar.";
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Banner kind="error" message={message} />
          <Button label="Try again" onPress={() => dashboardQuery.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const { totals, byBeverage, byEvent, recent } = dashboardQuery.data.data;
  const hasAnyData = byBeverage.length > 0 || byEvent.length > 0 || recent.length > 0;
  const topDrink = [...byBeverage].sort((a, b) => b.units - a.units)[0];
  const topEvent = [...byEvent].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 24 }]}>
        <Text style={styles.screenTitle}>Bar</Text>

        <HeroCard
          eyebrow="Bar revenue"
          value={formatMoney(totals.revenue, CURRENCY)}
          note={`${totals.units} drinks sold`}
          footer={[
            { label: "Orders", value: String(totals.orders) },
            {
              label: "Sell-through",
              value: totals.sellThrough != null ? `${totals.sellThrough}%` : "—",
            },
          ]}
          variant="brand"
        />

        {hasAnyData ? (
          <View style={styles.linkList}>
            <SectionLink
              colors={colors}
              icon="wine-outline"
              title="Drinks"
              subtitle={
                topDrink
                  ? `Best seller: ${topDrink.name} · ${topDrink.units} sold`
                  : "No drinks sold yet"
              }
              onPress={() => router.push("/organizer/bar/drinks")}
            />
            <SectionLink
              colors={colors}
              icon="calendar-outline"
              title="By event"
              subtitle={topEvent ? `Top: ${topEvent.title}` : "No events selling drinks yet"}
              onPress={() => router.push("/organizer/bar/by-event")}
            />
            <SectionLink
              colors={colors}
              icon="time-outline"
              title="Recent sales"
              subtitle={
                recent.length > 0 ? `${recent.length} sale${recent.length === 1 ? "" : "s"} logged` : "No sales yet"
              }
              onPress={() => router.push("/organizer/bar/recent")}
            />
          </View>
        ) : (
          <EmptyState
            title="No drinks sold yet"
            body="Once your events start selling drinks, revenue and stock will show up here."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLink({
  colors,
  icon,
  title,
  subtitle,
  onPress,
}: {
  colors: ThemeColors;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const styles = linkStyles(colors);
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={colors.ink} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const linkStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: colors.surface,
      borderRadius: 16,
      boxShadow: cardShadow(colors),
      padding: 16,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
    },
    text: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
  });

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
      padding: 20,
    },
    screenTitle: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: colors.ink,
      marginBottom: 4,
    },
    linkList: {
      gap: 10,
      marginTop: 4,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
