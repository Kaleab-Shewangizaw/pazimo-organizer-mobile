import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { unlockUsherEvent } from "@/api/ushers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { CodeInput } from "@/components/CodeInput";
import { Screen } from "@/components/Screen";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { goBack } from "@/lib/navigation";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

export default function UnlockEventScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");

  const mutation = useMutation({
    mutationFn: () => unlockUsherEvent(code),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["usher-my-events"] });
      goBack("/usher");
    },
  });

  const errorMessage = mutation.isError ? bannerMessageFor(mutation.error) : null;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Unlock an event</Text>
        <Text style={styles.subtitle}>
          Enter the 6-character code your organizer or admin gave you.
        </Text>
      </View>

      <View style={styles.form}>
        {errorMessage ? <Banner kind="error" message={errorMessage} /> : null}

        <CodeInput value={code} onChange={setCode} autoFocus />

        <Button
          label="Unlock"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={code.length < 6}
        />
        <Text style={styles.back} onPress={() => goBack("/usher")} accessibilityRole="link">
          ‹ Back
        </Text>
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
