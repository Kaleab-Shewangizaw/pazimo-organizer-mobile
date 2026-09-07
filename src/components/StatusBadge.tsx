import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/lib/useColors";
import type { EventStatus } from "@/types";

/** A dot + label rather than a filled pill — restrained on purpose so the
 * accent color stays the only "loud" color in the UI. */
export function StatusBadge({ status }: { status: EventStatus }) {
  const colors = useColors();
  const statusStyle: Record<EventStatus, { fg: string; label: string }> = {
    published: { fg: colors.success, label: "Published" },
    draft: { fg: colors.warning, label: "Draft" },
    cancelled: { fg: colors.error, label: "Cancelled" },
    completed: { fg: colors.textMuted, label: "Completed" },
  };
  const style = statusStyle[status];

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
