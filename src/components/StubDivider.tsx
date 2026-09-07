import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

const NOTCH = 16;

/**
 * The perforated tear-line of a physical ticket stub — this app's one
 * signature device, reused on the balance card and every event card.
 * The two notches are circles painted in the color immediately behind the
 * card (usually the screen background), positioned to punch through the
 * card's edges.
 */
export function StubDivider({ background }: { background?: string }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const notchColor = background ?? colors.background;

  return (
    <View style={styles.row}>
      <View style={[styles.notch, styles.notchLeft, { backgroundColor: notchColor }]} />
      <View style={styles.dashes} />
      <View style={[styles.notch, styles.notchRight, { backgroundColor: notchColor }]} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
