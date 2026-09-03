import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/lib/theme";
import type { EventStatus } from "@/types";

const STATUS_STYLE: Record<EventStatus, { bg: string; fg: string; label: string }> = {
  published: { bg: colors.successBg, fg: colors.success, label: "Published" },
  draft: { bg: colors.warningBg, fg: colors.warning, label: "Draft" },
  cancelled: { bg: colors.errorBg, fg: colors.error, label: "Cancelled" },
  completed: { bg: colors.border, fg: colors.textMuted, label: "Completed" },
};

export function StatusBadge({ status }: { status: EventStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.fg }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
