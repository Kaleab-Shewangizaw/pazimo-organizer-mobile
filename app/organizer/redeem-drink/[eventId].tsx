import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { listOrganizerBeverageSales, redeemBeverageSale } from "@/api/beverages";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingScreen } from "@/components/LoadingScreen";
import { TextField } from "@/components/TextField";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import { goBack } from "@/lib/navigation";
import { cardShadow, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import type { OrganizerBeverageSaleRow } from "@/types";

const CURRENCY = "ETB" as const;
const QUERY_KEY = (eventId: string) => ["event-beverage-sales", eventId];

/**
 * Collecting a pre-paid drink at the counter — a customer's "refill" order
 * (pazimo-mobile's checkout) has no QR, just a reference number like
 * "PZB-SL-000042" shown on their receipt (see
 * ~/Documents/pazimo-mobile/src/components/refill/refill-order-view.tsx's
 * own comment on why). This looks it up among this event's sales and marks
 * it collected — POST /api/beverages/sales/:saleId/redeem, the same
 * authorization shape as ticket check-in. Only a confirmed, not-yet-
 * collected, "online"-channel sale is redeemable; one rung up at the
 * counter directly was already handed over.
 */
export default function RedeemDrinkScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { eventId, eventTitle } = useLocalSearchParams<{ eventId: string; eventTitle?: string }>();
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: QUERY_KEY(eventId),
    queryFn: () => listOrganizerBeverageSales({ eventId, status: "confirmed", limit: 200 }),
  });

  const redeemMutation = useMutation({
    mutationFn: (saleId: string) => redeemBeverageSale(saleId),
    onSuccess: (res) => {
      queryClient.setQueryData<Awaited<ReturnType<typeof listOrganizerBeverageSales>>>(
        QUERY_KEY(eventId),
        (prev) =>
          prev && {
            ...prev,
            data: prev.data.map((sale) =>
              sale._id === res.data._id ? { ...sale, redeemedAt: res.data.redeemedAt } : sale,
            ),
          },
      );
    },
  });

  const sales = query.data?.data ?? [];
  const searchTerm = search.trim().toUpperCase();
  const awaitingPickup = sales.filter((s) => s.channel === "online" && !s.redeemedAt);
  const visible = searchTerm
    ? awaitingPickup.filter((s) => (s.referenceNumber ?? "").toUpperCase().includes(searchTerm))
    : awaitingPickup;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBack("/organizer/tickets")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          Redeem a drink{eventTitle ? ` · ${eventTitle}` : ""}
        </Text>
      </View>

      {query.isPending ? (
        <LoadingScreen />
      ) : query.isError ? (
        <View style={styles.errorContainer}>
          <Banner kind="error" message={bannerMessageFor(query.error) ?? "Couldn't load sales."} />
          <Button label="Try again" onPress={() => query.refetch()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextField
            label="Reference number"
            value={search}
            onChangeText={setSearch}
            placeholder="e.g. PZB-SL-000042"
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {redeemMutation.isError ? (
            <Banner
              kind="error"
              message={bannerMessageFor(redeemMutation.error) ?? "Couldn't mark it collected."}
            />
          ) : null}

          {awaitingPickup.length === 0 ? (
            <EmptyState
              title="Nothing to collect"
              body="Pre-paid drink orders waiting for pickup will show up here."
            />
          ) : visible.length === 0 ? (
            <EmptyState title="No match" body="No order awaiting pickup matches that reference number." />
          ) : (
            <View style={styles.list}>
              {visible.map((sale) => (
                <SaleRow
                  key={sale._id}
                  colors={colors}
                  sale={sale}
                  onRedeem={() => redeemMutation.mutate(sale._id)}
                  isRedeeming={redeemMutation.isPending && redeemMutation.variables === sale._id}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SaleRow({
  colors,
  sale,
  onRedeem,
  isRedeeming,
}: {
  colors: ThemeColors;
  sale: OrganizerBeverageSaleRow;
  onRedeem: () => void;
  isRedeeming: boolean;
}) {
  const styles = rowStyles(colors);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.reference}>{sale.referenceNumber ?? "—"}</Text>
          <Text style={styles.meta}>
            {sale.beverageName} × {sale.quantity} · {formatMoney(sale.totalAmount, CURRENCY)}
          </Text>
        </View>
        <Button label="Collected" onPress={onRedeem} loading={isRedeeming} style={styles.button} />
      </View>
    </View>
  );
}

const rowStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      boxShadow: cardShadow(colors),
      padding: 14,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    info: {
      flex: 1,
      gap: 3,
    },
    reference: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.ink,
      letterSpacing: 0.4,
    },
    meta: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
    button: {
      minHeight: 44,
      paddingHorizontal: 16,
    },
  });

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
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: 17,
      color: colors.ink,
    },
    content: {
      padding: 20,
      gap: 16,
    },
    list: {
      gap: 10,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
