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
import { ListRow } from "@/components/ListRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import { cardShadow, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

const CURRENCY = "ETB" as const;

/**
 * Full "Recent sales" log, drilled into from the Bar tab's summary link —
 * same GET (query key "beverage-dashboard") the Bar tab already fetched, so
 * this reads from cache rather than re-hitting the network.
 */
export default function BarRecentSalesScreen() {
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
          <Banner kind="error" message={bannerMessageFor(query.error) ?? "Couldn't load sales."} />
          <Button label="Try again" onPress={() => query.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const { recent } = query.data.data;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>Recent sales</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {recent.length > 0 ? (
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
        ) : (
          <EmptyState title="No sales yet" body="Drink sales will show up here as they happen." />
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
    list: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      boxShadow: cardShadow(colors),
      paddingHorizontal: 14,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
