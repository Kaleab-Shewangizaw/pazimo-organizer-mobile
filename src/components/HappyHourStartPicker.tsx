import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const PAD = ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);

function buildDays(minDate: Date, maxDate: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days.length > 0 ? days : [cursor];
}

function formatDayLabel(day: Date, today: Date): string {
  if (day.toDateString() === today.toDateString()) return "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (day.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function WheelColumn<T>({
  colors,
  items,
  selectedIndex,
  onChange,
  renderLabel,
  width,
}: {
  colors: ThemeColors;
  items: T[];
  selectedIndex: number;
  onChange: (index: number) => void;
  renderLabel: (item: T) => string;
  width: number;
}) {
  const ref = useRef<ScrollView>(null);
  const styles = wheelStyles(colors);
  // A gentle drag-and-release (no fling) doesn't always reach the momentum
  // phase, so onMomentumScrollEnd alone can silently never fire — commit
  // from onScrollEndDrag too. Both can fire for the same gesture; this
  // dedupe guard keeps that from calling onChange twice or fighting the
  // corrective scrollTo mid-animation.
  const lastCommitted = useRef(selectedIndex);

  // Snap to the current selection when the list itself changes (a fresh
  // open, or the day range re-bounding around a different event) — not on
  // every selectedIndex change, which would fight the user's own scrolling.
  useEffect(() => {
    ref.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    lastCommitted.current = selectedIndex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  function commit(offsetY: number) {
    const index = Math.max(0, Math.min(items.length - 1, Math.round(offsetY / ITEM_HEIGHT)));
    if (index !== lastCommitted.current) {
      lastCommitted.current = index;
      onChange(index);
    }
    ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
  }

  return (
    <ScrollView
      ref={ref}
      style={{ width, height: ITEM_HEIGHT * VISIBLE_ROWS }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      contentContainerStyle={{ paddingVertical: PAD }}
      onMomentumScrollEnd={(e) => commit(e.nativeEvent.contentOffset.y)}
      onScrollEndDrag={(e) => commit(e.nativeEvent.contentOffset.y)}
    >
      {items.map((item, index) => (
        <View key={index} style={styles.item}>
          <Text style={[styles.itemText, index === selectedIndex && styles.itemTextActive]}>
            {renderLabel(item)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

interface HappyHourStartPickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  /** Nothing before this can be picked — always "now" in practice. */
  minDate: Date;
  /** Nothing after this can be picked — the event's end, so a happy hour can never be scheduled to start past its own event ending. */
  maxDate: Date;
  initialDate?: Date | null;
}

/**
 * A scrolling wheel picker (day / hour / minute) for a happy hour's
 * automatic start time — bounded to [minDate, maxDate] so it's impossible
 * to pick a start before now or after the event itself ends.
 */
export function HappyHourStartPicker({
  visible,
  onClose,
  onConfirm,
  minDate,
  maxDate,
  initialDate,
}: HappyHourStartPickerProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  const days = useMemo(() => buildDays(minDate, maxDate), [minDate.getTime(), maxDate.getTime()]);
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), []);

  const initial = useMemo(() => {
    if (initialDate && initialDate.getTime() >= minDate.getTime() && initialDate.getTime() <= maxDate.getTime()) {
      return initialDate;
    }
    return minDate;
  }, [initialDate, minDate, maxDate]);
  const initialDayIndex = Math.max(
    0,
    days.findIndex((d) => d.toDateString() === initial.toDateString()),
  );

  const [dayIndex, setDayIndex] = useState(initialDayIndex);
  const [hourIndex, setHourIndex] = useState(initial.getHours());
  const [minuteIndex, setMinuteIndex] = useState(Math.round(initial.getMinutes() / 5) % 12);

  // Re-seed the wheels every time the sheet opens, so a pick made for one
  // event doesn't linger as the starting point for the next.
  useEffect(() => {
    if (!visible) return;
    setDayIndex(initialDayIndex);
    setHourIndex(initial.getHours());
    setMinuteIndex(Math.round(initial.getMinutes() / 5) % 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function confirm() {
    const day = days[dayIndex] ?? days[0];
    const combined = new Date(day);
    combined.setHours(hours[hourIndex] ?? 0, minutes[minuteIndex] ?? 0, 0, 0);
    // The wheels are already bounded to the right days, but an edge minute
    // on the first/last day can still land a moment outside the window —
    // clamp rather than reject.
    const clamped = new Date(
      Math.min(Math.max(combined.getTime(), minDate.getTime()), maxDate.getTime()),
    );
    onConfirm(clamped);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />
      <SafeAreaView style={styles.sheetSafeArea} edges={["bottom"]}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>Pick a start time</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.wheelArea}>
            <View style={styles.selectionBand} pointerEvents="none" />
            <WheelColumn
              colors={colors}
              items={days}
              selectedIndex={dayIndex}
              onChange={setDayIndex}
              renderLabel={(d) => formatDayLabel(d, minDate)}
              width={160}
            />
            <WheelColumn
              colors={colors}
              items={hours}
              selectedIndex={hourIndex}
              onChange={setHourIndex}
              renderLabel={(h) => String(h).padStart(2, "0")}
              width={56}
            />
            <Text style={styles.colon}>:</Text>
            <WheelColumn
              colors={colors}
              items={minutes}
              selectedIndex={minuteIndex}
              onChange={setMinuteIndex}
              renderLabel={(m) => String(m).padStart(2, "0")}
              width={56}
            />
          </View>

          <Button label="Confirm" onPress={confirm} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const wheelStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    item: {
      height: ITEM_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    itemText: {
      fontFamily: fonts.body,
      fontSize: 17,
      color: colors.textMuted,
    },
    itemTextActive: {
      fontFamily: fonts.bold,
      fontSize: 19,
      color: colors.ink,
    },
  });

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheetSafeArea: {
      marginTop: "auto",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      gap: 16,
    },
    handle: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 4,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.ink,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
    },
    wheelArea: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: ITEM_HEIGHT * VISIBLE_ROWS,
    },
    selectionBand: {
      position: "absolute",
      left: 0,
      right: 0,
      top: PAD,
      height: ITEM_HEIGHT,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
    },
    colon: {
      fontFamily: fonts.bold,
      fontSize: 19,
      color: colors.ink,
      marginHorizontal: 2,
    },
  });
