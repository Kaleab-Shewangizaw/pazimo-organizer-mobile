import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getMyCashierEvents, unlockCashierEvent } from "@/api/eventCashiers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { CodeInput } from "@/components/CodeInput";
import { EventBeverageScanner } from "@/components/EventBeverageScanner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Screen } from "@/components/Screen";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

const MY_EVENTS_KEY = ["cashier-my-events"];

/**
 * An event cashier (role "cashier", scoped to neither a cinema nor a venue —
 * see the User model's role comment) has no permanent business the way the
 * other two cashier kinds do; it's scoped one event at a time by redeeming
 * an EventCashierCode, exactly like an usher redeems an EventUsherCode (see
 * app/usher/unlock.tsx, the template this mirrors). This is the Scan tab's
 * content for that account: a code-entry screen while it holds no live
 * grant, the actual beverage scanner once it does.
 */
export function EventCashierGate() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  // Lets a cashier already scoped to one event redeem a DIFFERENT one
  // without leaving this tab — the backend revokes the old grant the moment
  // the new code is redeemed (see redeemEventCode), same as an usher
  // switching events does.
  const [switching, setSwitching] = useState(false);

  const eventsQuery = useQuery({
    queryKey: MY_EVENTS_KEY,
    queryFn: getMyCashierEvents,
  });

  const unlockMutation = useMutation({
    mutationFn: () => unlockCashierEvent(code),
    onSuccess: async () => {
      setCode("");
      setSwitching(false);
      await queryClient.invalidateQueries({ queryKey: MY_EVENTS_KEY });
    },
  });

  if (eventsQuery.isPending) {
    return <LoadingScreen />;
  }

  if (eventsQuery.isError) {
    return (
      <Screen>
        <Banner
          kind="error"
          message={bannerMessageFor(eventsQuery.error) ?? "Couldn't check your event access."}
        />
        <Button label="Try again" onPress={() => eventsQuery.refetch()} style={{ marginTop: 16 }} />
      </Screen>
    );
  }

  const current = eventsQuery.data.data[0];

  if (current && !switching) {
    return (
      <EventBeverageScanner
        eventTitle={current.event.title}
        onChangeEvent={() => setSwitching(true)}
      />
    );
  }

  const errorMessage = unlockMutation.isError ? bannerMessageFor(unlockMutation.error) : null;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{current ? "Switch event" : "Unlock an event"}</Text>
        <Text style={styles.subtitle}>
          Enter the 6-character code your organizer or admin gave you.
        </Text>
      </View>

      <View style={styles.form}>
        {errorMessage ? <Banner kind="error" message={errorMessage} /> : null}

        <CodeInput value={code} onChange={setCode} autoFocus />

        <Button
          label="Unlock"
          onPress={() => unlockMutation.mutate()}
          loading={unlockMutation.isPending}
          disabled={code.length < 6}
        />
        {current ? (
          <Text style={styles.back} onPress={() => setSwitching(false)} accessibilityRole="link">
            ‹ Back to {current.event.title}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      alignItems: "center",
      gap: 6,
      marginTop: 24,
      marginBottom: 32,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 24,
      color: colors.ink,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textMuted,
      textAlign: "center",
      paddingHorizontal: 12,
    },
    form: {
      gap: 20,
    },
    back: {
      color: colors.textMuted,
      fontSize: 15,
      textAlign: "center",
      marginTop: 8,
    },
  });
