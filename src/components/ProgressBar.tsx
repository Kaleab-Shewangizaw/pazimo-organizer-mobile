import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

interface ProgressBarProps {
  /** 0-1. Values outside that range are clamped. */
  progress: number;
  /** Fill color — defaults to ink (the same "primary" bar used for tier/revenue comparisons). */
  color?: string;
}

/** A thin rounded track with a filled portion — ticket-tier sell-through, revenue-by-event comparison, drink sales. */
export function ProgressBar({ progress, color }: ProgressBarProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          { width: `${Math.max(clamped * 100, clamped > 0 ? 3 : 0)}%`, backgroundColor: color ?? colors.ink },
        ]}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.surfaceAlt,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      borderRadius: 3,
    },
  });
