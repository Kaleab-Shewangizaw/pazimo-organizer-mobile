import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getBeverageEligibility, getOrganizerBeverageDashboard } from "@/api/beverages";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { HeroCard } from "@/components/HeroCard";
import { ListRow } from "@/components/ListRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ProgressBar } from "@/components/ProgressBar";
import { useTabBarHeight } from "@/components/TabBarHeightProvider";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import type { ThemeColors } from "@/lib/theme";
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
  const topUnits = Math.max(1, ...byBeverage.map((d) => d.units));

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

        {byBeverage.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Drinks</Text>
              <Text style={styles.cardHint}>price · sold</Text>
            </View>
            <View style={styles.drinksList}>
              {byBeverage.map((drink) => (
                <View key={drink._id} style={styles.drinkRow}>
                  <View style={styles.revenueLabelRow}>
                    <Text style={styles.revenueLabel} numberOfLines={1}>
                      {drink.name}
                    </Text>
                    <Text style={styles.revenueValue}>
                      {formatMoney(drink.revenue, CURRENCY)} · {drink.units} sold
                    </Text>
                  </View>
                  <ProgressBar progress={drink.units / topUnits} color={colors.accent} />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {byEvent.length > 0 ? (
          <>
            <Text style={styles.sectionEyebrow}>By event</Text>
            <View style={styles.list}>
              {byEvent.map((event) => (
                <ListRow
                  key={event._id}
                  title={event.title}
                  subtitle={`${event.drinkCount} drink${event.drinkCount === 1 ? "" : "s"} listed`}
                  amount={formatMoney(event.revenue, CURRENCY)}
                  statusLabel={`${event.units} sold`}
                />
              ))}
            </View>
          </>
        ) : null}

        {recent.length > 0 ? (
          <>
            <Text style={styles.sectionEyebrow}>Recent sales</Text>
            <View style={styles.list}>
              {recent.map((sale) => (
                <ListRow
                  key={sale._id}
                  title={sale.beverageName ?? "Drink"}
                  subtitle={sale.event?.title ?? "Deleted event"}
                  amount={formatMoney(sale.totalAmount, CURRENCY)}
                  statusLabel={`×${sale.quantity}`}
                />
              ))}
            </View>
          </>
        ) : null}

        {byBeverage.length === 0 && byEvent.length === 0 && recent.length === 0 ? (
          <EmptyState
            title="No drinks sold yet"
            body="Once your events start selling drinks, revenue and stock will show up here."
          />
        ) : null}
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
    },
    cardHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    cardTitle: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.ink,
    },
    cardHint: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
    },
    drinksList: {
      marginTop: 14,
      gap: 14,
    },
    drinkRow: {
      gap: 8,
    },
    revenueLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    revenueLabel: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.ink,
      flexShrink: 1,
    },
    revenueValue: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
    sectionEyebrow: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginTop: 8,
      marginBottom: 2,
    },
    list: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
