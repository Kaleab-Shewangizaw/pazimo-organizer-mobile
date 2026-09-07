import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCinemaConcessionSalesSummary, getCinemaConcessions } from "@/api/cinema";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { HeroCard } from "@/components/HeroCard";
import { ListRow } from "@/components/ListRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

const CURRENCY = "ETB" as const;

export default function CashierBarScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const summaryQuery = useQuery({
    queryKey: ["cinema-concession-summary"],
    queryFn: getCinemaConcessionSalesSummary,
  });
  const concessionsQuery = useQuery({
    queryKey: ["cinema-concessions"],
    queryFn: getCinemaConcessions,
  });

  if (summaryQuery.isPending || concessionsQuery.isPending) {
    return <LoadingScreen />;
  }

  if (summaryQuery.isError || concessionsQuery.isError) {
    const message =
      bannerMessageFor(summaryQuery.error ?? concessionsQuery.error) ??
      "Couldn't load concessions.";
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Banner kind="error" message={message} />
          <Button
            label="Try again"
            onPress={() => {
              summaryQuery.refetch();
              concessionsQuery.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const summary = summaryQuery.data.data;
  const items = concessionsQuery.data.data;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.listContent}>
        <Text style={styles.screenTitle}>Bar</Text>

        <HeroCard
          eyebrow="Bar takings"
          value={formatMoney(summary.revenue, CURRENCY)}
          note={`${summary.units} drinks sold`}
        />

        <Text style={styles.sectionEyebrow}>Concessions catalog</Text>
        {items.length > 0 ? (
          <View style={styles.list}>
            {items.map((item) => (
              <ListRow
                key={item._id}
                title={item.name}
                subtitle={
                  item.stockTotal != null
                    ? `${Math.max((item.stockTotal ?? 0) - (item.sold ?? 0), 0)} remaining`
                    : undefined
                }
                amount={formatMoney(item.price, CURRENCY)}
                statusLabel={item.isActive === false ? "inactive" : undefined}
                statusColor={colors.warning}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="Nothing on the menu yet"
            body="Drinks and snacks your cinema sells will show up here."
          />
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
    listContent: {
      padding: 20,
      gap: 12,
    },
    screenTitle: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: colors.ink,
      marginBottom: 4,
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
