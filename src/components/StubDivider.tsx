import { StyleSheet, View } from "react-native";

import { colors } from "@/lib/theme";

const NOTCH = 16;

/**
 * The perforated tear-line of a physical ticket stub — this app's one
 * signature device, reused on the balance card and every event card.
 * The two notches are circles painted in the page background color,
 * positioned to punch through the card's edges.
 */
export function StubDivider({ background = colors.paper }: { background?: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.notch, styles.notchLeft, { backgroundColor: background }]} />
      <View style={styles.dashes} />
      <View style={[styles.notch, styles.notchRight, { backgroundColor: background }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: NOTCH,
    justifyContent: "center",
  },
  dashes: {
    borderTopWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.border,
    marginHorizontal: NOTCH / 2,
  },
  notch: {
    position: "absolute",
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    top: 0,
  },
  notchLeft: {
    left: -NOTCH / 2,
  },
  notchRight: {
    right: -NOTCH / 2,
  },
});
