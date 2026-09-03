import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/lib/theme";

interface StatTileProps {
  label: string;
  value: string;
}

/** A single KPI number. Value stays in text ink — color is never used to
 * carry the number itself, only status badges elsewhere do that. */
export function StatTile({ label, value }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
