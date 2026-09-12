import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, type ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getBeverageEligibility, getOrganizerBeverageCatalog, getOrganizerBeverageDashboard } from "@/api/beverages";
import { getOrganizerDashboard } from "@/api/organizers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { HeroCard } from "@/components/HeroCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ProgressBar } from "@/components/ProgressBar";
import { useTabBarHeight } from "@/components/TabBarHeightProvider";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { cardShadow, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";
import { ApiError, type BeverageByDrink, type BeverageByEvent } from "@/types";

const CURRENCY = "ETB" as const;
const TOP_N = 5;

export default function OrganizerBarScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useTabBarHeight();
  const organizerId = useAuthStore((s) => s.user?._id);

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

  // Neither of these two carries the images this screen wants to show —
  // cross-referenced by id below rather than a backend change. Optional
  // enrichment only: a slow/failed fetch here just means a plain fallback
  // thumbnail, not a blocked screen (see the `?? []`/`?.get(...)` below).
  const catalogQuery = useQuery({
    queryKey: ["beverage-catalog"],
    queryFn: getOrganizerBeverageCatalog,
    enabled: isEligible,
  });
  const eventsQuery = useQuery({
    queryKey: ["organizer-dashboard", organizerId, CURRENCY],
    queryFn: () => getOrganizerDashboard(organizerId as string, CURRENCY),
    enabled: isEligible && !!organizerId,
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

  const imageByBeverageId = new Map(
    (catalogQuery.data?.data ?? []).map((b) => [b._id, b.image]),
  );
  const coverByEventId = new Map(
    (eventsQuery.data?.data.events ?? []).map((e) => [e._id, e.coverImages?.[0]]),
  );

  const topDrinks = [...byBeverage].sort((a, b) => b.revenue - a.revenue).slice(0, TOP_N);
  const maxDrinkRevenue = Math.max(1, ...topDrinks.map((d) => d.revenue));
  const topEvents = [...byEvent].sort((a, b) => b.revenue - a.revenue).slice(0, TOP_N);
  const maxEventRevenue = Math.max(1, ...topEvents.map((e) => e.revenue));

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

        {topEvents.length > 0 ? (
          <SectionCard
            colors={colors}
            title="By event"
            onSeeAll={() => router.push("/organizer/bar/by-event")}
          >
            {topEvents.map((event) => (
              <EventRevenueRow
                key={event._id}
                colors={colors}
                event={event}
                cover={resolveMediaUrl(coverByEventId.get(event._id))}
                progress={event.revenue / maxEventRevenue}
              />
            ))}
          </SectionCard>
        ) : null}

        {topDrinks.length > 0 ? (
          <SectionCard
            colors={colors}
            title="Drinks"
            onSeeAll={() => router.push("/organizer/bar/drinks")}
          >
            {topDrinks.map((drink) => (
              <DrinkRevenueRow
                key={drink._id}
                colors={colors}
                drink={drink}
                image={resolveMediaUrl(imageByBeverageId.get(drink._id))}
                progress={drink.revenue / maxDrinkRevenue}
              />
            ))}
          </SectionCard>
        ) : null}

        {recent.length > 0 ? (
          <SectionLink
            colors={colors}
            icon="time-outline"
            title="Recent sales"
            subtitle={`${recent.length} sale${recent.length === 1 ? "" : "s"} logged`}
            onPress={() => router.push("/organizer/bar/recent")}
          />
        ) : null}

        {!hasAnyData ? (
          <EmptyState
            title="No drinks sold yet"
            body="Once your events start selling drinks, revenue and stock will show up here."
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({
  colors,
  title,
  onSeeAll,
  children,
}: {
  colors: ThemeColors;
  title: string;
  onSeeAll: () => void;
  children: ReactNode;
}) {
  const styles = sectionStyles(colors);
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onSeeAll} style={styles.seeAllRow} hitSlop={8}>
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </Pressable>
      </View>
      <View style={styles.list}>{children}</View>
    </View>
  );
}

function EventRevenueRow({
  colors,
  event,
  cover,
  progress,
}: {
  colors: ThemeColors;
  event: BeverageByEvent;
  cover?: string;
  progress: number;
}) {
  const styles = sectionStyles(colors);
  return (
    <View style={styles.row}>
      {cover ? (
        <Image source={{ uri: cover }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]}>
          <Text style={styles.thumbInitial}>{event.title.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.rowContent}>
        <View style={styles.rowLabelRow}>
          <Text style={styles.rowLabel} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={styles.rowValue}>{formatMoney(event.revenue, CURRENCY)}</Text>
        </View>
        <ProgressBar progress={progress} />
      </View>
    </View>
  );
}

function DrinkRevenueRow({
  colors,
  drink,
  image,
  progress,
}: {
  colors: ThemeColors;
  drink: BeverageByDrink;
  image?: string;
  progress: number;
}) {
  const styles = sectionStyles(colors);
  return (
    <View style={styles.row}>
      {image ? (
        <Image source={{ uri: image }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: drink.color || colors.surfaceAlt }]}>
          <Text style={styles.thumbInitial}>{drink.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.rowContent}>
        <View style={styles.rowLabelRow}>
          <Text style={styles.rowLabel} numberOfLines={1}>
            {drink.name}
          </Text>
          <Text style={styles.rowValue}>
            {formatMoney(drink.revenue, CURRENCY)} · {drink.units} sold
          </Text>
        </View>
        <ProgressBar progress={progress} color={colors.accent} />
      </View>
    </View>
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

const sectionStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      boxShadow: cardShadow(colors),
      padding: 20,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.ink,
    },
    seeAllRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    seeAllText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
    list: {
      marginTop: 14,
      gap: 14,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
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
    rowContent: {
      flex: 1,
      gap: 8,
    },
    rowLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    rowLabel: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.ink,
      flexShrink: 1,
    },
    rowValue: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
  });

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
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
