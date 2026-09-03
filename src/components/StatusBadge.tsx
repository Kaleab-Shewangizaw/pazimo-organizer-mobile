import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/lib/theme";
import type { EventStatus } from "@/types";

const STATUS_STYLE: Record<EventStatus, { fg: string; label: string }> = {
  published: { fg: colors.success, label: "Published" },
  draft: { fg: colors.warning, label: "Draft" },
  cancelled: { fg: colors.error, label: "Cancelled" },
  completed: { fg: colors.textMuted, label: "Completed" },
};

/** A dot + label rather than a filled pill — restrained on purpose so the
 * gold accent stays the only "loud" color in the UI. */
export function StatusBadge({ status }: { status: EventStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: style.fg }]} />
      <Text style={[styles.text, { color: style.fg }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
