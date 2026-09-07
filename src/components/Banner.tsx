import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

interface BannerProps {
  kind: "error" | "success" | "warning";
  message: string;
}

export function Banner({ kind, message }: BannerProps) {
  const colors = useColors();
  const kindStyles = {
    error: { bg: colors.errorBg, text: colors.error },
    success: { bg: colors.successBg, text: colors.success },
    warning: { bg: colors.warningBg, text: colors.warning },
  } as const;
  const styles = useMemo(() => createStyles(), []);
  const { bg, text } = kindStyles[kind];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{message}</Text>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    text: {
      fontSize: 14,
      fontWeight: "500",
    },
  });
