import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getBeverageEligibility, getOrganizerBeverageDashboard } from "@/api/beverages";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ListRow } from "@/components/ListRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { StatTile } from "@/components/StatTile";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

const CURRENCY = "ETB" as const;

export default function OrganizerBarScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const eligibilityQuery = useQuery({
    queryKey: ["beverage-eligibility"],
    queryFn: getBeverageEligibility,
  });

  const isEligible = eligibilityQuery.data?.data.eligibility === "eligible";

  const dashboardQuery = useQuery({
    queryKey: ["beverage-dashboard"],
    queryFn: getOrganizerBeverageDashboard,
    enabled: isEligible,
  });

  if (eligibilityQuery.isPending) {
    return <LoadingScreen />;
  }

  if (eligibilityQuery.isError) {
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
          title="Not enabled for your account yet"
          body="Selling drinks at your events needs to be turned on by a Pazimo admin first. Reach out to Pazimo support to get set up."
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.listContent}>
        <Text style={styles.screenTitle}>Bar</Text>

        <View style={styles.statsRow}>
          <StatTile label="Revenue" value={formatMoney(totals.revenue, CURRENCY)} accent />
          <StatTile label="Units sold" value={String(totals.units)} />
        </View>
        <View style={styles.statsRow}>
          <StatTile label="Orders" value={String(totals.orders)} />
          <StatTile
            label="Sell-through"
            value={totals.sellThrough != null ? `${totals.sellThrough}%` : "—"}
          />
        </View>

        {byBeverage.length > 0 ? (
          <>
            <Text style={styles.sectionEyebrow}>By drink</Text>
            <View style={styles.list}>
              {byBeverage.map((drink) => (
                <ListRow
                  key={drink._id}
                  title={drink.name}
                  subtitle={`${drink.eventCount} event${drink.eventCount === 1 ? "" : "s"}`}
                  amount={formatMoney(drink.revenue, CURRENCY)}
                  statusLabel={`${drink.units} sold`}
                />
              ))}
            </View>
          </>
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
