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
  // Whatever row is sitting in the selection band right now. Tracked live
  // from onScroll rather than only when scrolling ends: the end events don't
  // reliably fire for every gesture (a gentle release may never reach the
  // momentum phase), and "Confirm" tapped while the wheel is still settling
  // must still get the row the user can see in the band.
  const liveIndex = useRef(selectedIndex);

  function clampIndex(index: number) {
    return Math.max(0, Math.min(items.length - 1, index));
  }

  function track(offsetY: number) {
    const index = clampIndex(Math.round(offsetY / ITEM_HEIGHT));
    if (index !== liveIndex.current) {
      liveIndex.current = index;
      onChange(index);
    }
  }

  // Follow a selection set from outside (the sheet re-seeding on open, or
  // the list re-bounding) — but never one this wheel just reported itself,
  // or it would fight the user's own scroll.
  useEffect(() => {
    const index = clampIndex(selectedIndex);
    if (index !== liveIndex.current) {
      liveIndex.current = index;
      ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, items.length]);

  return (
    <ScrollView
      ref={ref}
      style={{ width, height: ITEM_HEIGHT * VISIBLE_ROWS }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      contentContainerStyle={{ paddingVertical: PAD }}
      contentOffset={{ x: 0, y: selectedIndex * ITEM_HEIGHT }}
      // contentOffset alone isn't always honoured on first layout inside a
      // Modal (notably on Android) — position the wheel once it has a size.
      onLayout={() => ref.current?.scrollTo({ y: liveIndex.current * ITEM_HEIGHT, animated: false })}
      scrollEventThrottle={16}
      onScroll={(e) => track(e.nativeEvent.contentOffset.y)}
      onScrollEndDrag={(e) => track(e.nativeEvent.contentOffset.y)}
      onMomentumScrollEnd={(e) => track(e.nativeEvent.contentOffset.y)}
    >
      {items.map((item, index) => (
        <Pressable
          key={index}
          style={styles.item}
          onPress={() => ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true })}
        >
          <Text style={[styles.itemText, index === selectedIndex && styles.itemTextActive]}>
            {renderLabel(item)}
          </Text>
        </Pressable>
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

  // Keyed by calendar day, not by the exact millisecond — a minDate of "now"
  // that ticks forward between renders must not rebuild the day wheel.
  const minDayKey = minDate.toDateString();
  const maxDayKey = maxDate.toDateString();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const days = useMemo(() => buildDays(minDate, maxDate), [minDayKey, maxDayKey]);
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

  // What the wheels currently add up to. The wheels are already bounded to
  // the right days, but an edge hour/minute on the first/last day can still
  // land outside the window — clamp rather than reject, and show the clamped
  // value below the wheels so what gets confirmed is never a surprise.
  const day = days[dayIndex] ?? days[0];
  const combined = new Date(day);
  combined.setHours(hours[hourIndex] ?? 0, minutes[minuteIndex] ?? 0, 0, 0);
  const picked = new Date(
    Math.min(Math.max(combined.getTime(), minDate.getTime()), maxDate.getTime()),
  );
  const pickedLabel = `${formatDayLabel(picked, minDate)} at ${picked.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;

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

          <Text style={styles.summary}>
            Starts <Text style={styles.summaryEmphasis}>{pickedLabel}</Text>
            {picked.getTime() !== combined.getTime() ? " (earliest/latest allowed)" : ""}
          </Text>

          <Button label="Confirm" onPress={() => onConfirm(picked)} />
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
    summary: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
    },
    summaryEmphasis: {
      fontFamily: fonts.semibold,
      color: colors.ink,
    },
    colon: {
      fontFamily: fonts.bold,
      fontSize: 19,
      color: colors.ink,
      marginHorizontal: 2,
    },
  });
