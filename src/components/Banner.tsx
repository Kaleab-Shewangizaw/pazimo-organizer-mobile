import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/lib/theme";

interface BannerProps {
  kind: "error" | "success" | "warning";
  message: string;
}

const KIND_STYLES = {
  error: { bg: colors.errorBg, text: colors.error },
  success: { bg: colors.successBg, text: colors.success },
  warning: { bg: colors.warningBg, text: colors.warning },
} as const;

export function Banner({ kind, message }: BannerProps) {
  const { bg, text } = KIND_STYLES[kind];
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
