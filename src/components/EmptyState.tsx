import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

export function EmptyState({ title, body }: { title: string; body: string }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      paddingVertical: 48,
      paddingHorizontal: 24,
      gap: 6,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.ink,
    },
    body: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
    },
  });
