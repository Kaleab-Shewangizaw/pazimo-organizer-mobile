import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCinemaFinance, getCinemaProfile } from "@/api/cinema";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { LoadingScreen } from "@/components/LoadingScreen";
import { StatTile } from "@/components/StatTile";
import { StubDivider } from "@/components/StubDivider";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";

const CURRENCY = "ETB" as const;

export default function CashierHomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  const profileQuery = useQuery({ queryKey: ["cinema-profile"], queryFn: getCinemaProfile });
  const financeQuery = useQuery({ queryKey: ["cinema-finance"], queryFn: () => getCinemaFinance(CURRENCY) });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([profileQuery.refetch(), financeQuery.refetch()]);
    setRefreshing(false);
  }, [profileQuery, financeQuery]);

  if (profileQuery.isPending || financeQuery.isPending) {
    return <LoadingScreen />;
  }

  if (profileQuery.isError || financeQuery.isError) {
    const message =
      bannerMessageFor(profileQuery.error ?? financeQuery.error) ??
      "Something went wrong loading your dashboard.";
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Banner kind="error" message={message} />
          <Button
            label="Try again"
            onPress={() => {
              profileQuery.refetch();
              financeQuery.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const cinema = profileQuery.data.data;
  const { availableBalance, pendingWithdrawals, streams } = financeQuery.data.data;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <Text style={styles.greeting}>Good to see you, {user?.firstName}</Text>
        <Text style={styles.subtitle}>{cinema.name}</Text>

        <View style={styles.stub}>
          <Text style={styles.stubEyebrow}>Available balance</Text>
          <Text style={styles.stubFigure}>{formatMoney(availableBalance, CURRENCY)}</Text>

          <StubDivider background={colors.surface} />

          <View style={styles.stubFooter}>
            <View>
              <Text style={styles.stubFooterValue}>
                {formatMoney(pendingWithdrawals, CURRENCY)}
              </Text>
              <Text style={styles.stubFooterLabel}>Pending payout</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionEyebrow}>Box office</Text>
        <View style={styles.statsRow}>
          <StatTile
            label="Available"
            value={formatMoney(streams.tickets.availableBalance, CURRENCY)}
            accent
          />
          <StatTile label="Tickets sold" value={String(streams.tickets.ticketCount ?? 0)} />
        </View>

        <Text style={styles.sectionEyebrow}>Concessions</Text>
        <View style={styles.statsRow}>
          <StatTile
            label="Available"
            value={formatMoney(streams.beverages.availableBalance, CURRENCY)}
            accent
          />
          <StatTile label="Units sold" value={String(streams.beverages.unitsSold ?? 0)} />
        </View>
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
    greeting: {
      fontFamily: fonts.bold,
      fontSize: 21,
      color: colors.ink,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 2,
      marginBottom: 8,
    },
    stub: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 4,
      marginBottom: 8,
    },
    stubEyebrow: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: colors.textMuted,
    },
    stubFigure: {
      fontFamily: fonts.extrabold,
      fontSize: 34,
      color: colors.accent,
      marginTop: 6,
      marginBottom: 18,
      fontVariant: ["tabular-nums"],
    },
    stubFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 16,
      paddingBottom: 18,
    },
    stubFooterValue: {
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: colors.ink,
      fontVariant: ["tabular-nums"],
    },
    stubFooterLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    sectionEyebrow: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginTop: 4,
    },
    statsRow: {
      flexDirection: "row",
      gap: 12,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
