import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCinemaTicketSales, getCinemaTicketSummary } from "@/api/cinema";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ListRow } from "@/components/ListRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { StatTile } from "@/components/StatTile";
import { useTabBarHeight } from "@/components/TabBarHeightProvider";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import type { CinemaTicketSale } from "@/types";

const CURRENCY = "ETB" as const;
const PAGE_SIZE = 30;

export default function CashierTicketsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useTabBarHeight();

  const summaryQuery = useQuery({
    queryKey: ["cinema-ticket-summary"],
    queryFn: getCinemaTicketSummary,
  });

  const salesQuery = useInfiniteQuery({
    queryKey: ["cinema-ticket-sales"],
    queryFn: ({ pageParam }) => getCinemaTicketSales(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.data.length === PAGE_SIZE ? allPages.length + 1 : undefined,
  });

  if (summaryQuery.isPending || salesQuery.isPending) {
    return <LoadingScreen />;
  }

  if (summaryQuery.isError || salesQuery.isError) {
    const message =
      bannerMessageFor(summaryQuery.error ?? salesQuery.error) ?? "Couldn't load ticket sales.";
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Banner kind="error" message={message} />
          <Button
            label="Try again"
            onPress={() => {
              summaryQuery.refetch();
              salesQuery.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const summary = summaryQuery.data.data;
  const sales = salesQuery.data.pages.flatMap((p) => p.data);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <FlatList<CinemaTicketSale>
        data={sales}
        keyExtractor={(item, index) => item._id ?? item.ticketId ?? String(index)}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 24 }]}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (salesQuery.hasNextPage && !salesQuery.isFetchingNextPage) {
            salesQuery.fetchNextPage();
          }
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.screenTitle}>Tickets</Text>
            <View style={styles.statsRow}>
              <StatTile
                label="Total revenue"
                value={formatMoney(summary.totalRevenue, CURRENCY)}
                accent
              />
              <StatTile label="Tickets sold" value={String(summary.totalTickets)} />
            </View>
            <Text style={styles.sectionEyebrow}>Recent sales</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.movieTitle ?? "Screening"}
            subtitle={[item.showtime, item.seat].filter(Boolean).join(" · ") || undefined}
            amount={item.price > 0 ? formatMoney(item.price, CURRENCY) : "Free"}
            statusLabel={item.status}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No tickets sold yet"
            body="Box office sales will show up here as they come in."
          />
        }
        ListFooterComponent={
          salesQuery.isFetchingNextPage ? (
            <Text style={styles.loadingMore}>Loading more…</Text>
          ) : null
        }
      />
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
    },
    header: {
      gap: 16,
      marginBottom: 4,
    },
    screenTitle: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: colors.ink,
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
      marginTop: 4,
    },
    loadingMore: {
      textAlign: "center",
      color: colors.textMuted,
      fontSize: 13,
      paddingVertical: 12,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
