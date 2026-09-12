import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getOrganizerBeverageDashboard } from "@/api/beverages";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ProgressBar } from "@/components/ProgressBar";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import { cardShadow, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

const CURRENCY = "ETB" as const;

/**
 * Full "Drinks" breakdown, drilled into from the Bar tab's summary link —
 * same GET (query key "beverage-dashboard") the Bar tab already fetched, so
 * this reads from cache rather than re-hitting the network.
 */
export default function BarDrinksScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const query = useQuery({
    queryKey: ["beverage-dashboard"],
    queryFn: getOrganizerBeverageDashboard,
  });

  if (query.isPending) {
    return <LoadingScreen />;
  }

  if (query.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Banner kind="error" message={bannerMessageFor(query.error) ?? "Couldn't load drinks."} />
          <Button label="Try again" onPress={() => query.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const drinks = [...query.data.data.byBeverage].sort((a, b) => b.units - a.units);
  const topUnits = Math.max(1, ...drinks.map((d) => d.units));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>Drinks</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {drinks.length > 0 ? (
          <View style={styles.card}>
            {drinks.map((drink) => (
              <View key={drink._id} style={styles.drinkRow}>
                <View style={styles.labelRow}>
                  <Text style={styles.label} numberOfLines={1}>
                    {drink.name}
                  </Text>
                  <Text style={styles.value}>
                    {formatMoney(drink.revenue, CURRENCY)} · {drink.units} sold
                  </Text>
                </View>
                <ProgressBar progress={drink.units / topUnits} color={colors.accent} />
                <Text style={styles.meta}>
                  Listed at {drink.eventCount} event{drink.eventCount === 1 ? "" : "s"}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title="No drinks sold yet" body="Drinks you sell will show up here." />
        )}
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
      fontFamily: fonts.bold,
      fontSize: 17,
      color: colors.ink,
    },
    content: {
      padding: 20,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      boxShadow: cardShadow(colors),
      padding: 20,
      gap: 20,
    },
    drinkRow: {
      gap: 8,
    },
    labelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    label: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.ink,
      flexShrink: 1,
    },
    value: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
    meta: {
      fontSize: 12,
      color: colors.textMuted,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
