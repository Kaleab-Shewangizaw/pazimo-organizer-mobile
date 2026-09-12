import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createEventHappyHour, getEventBeverageLineup, type CreateHappyHourInput } from "@/api/beverages";
import { getOrganizerDashboard } from "@/api/organizers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { HappyHourStartPicker } from "@/components/HappyHourStartPicker";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SegmentedControl } from "@/components/SegmentedControl";
import { TextField } from "@/components/TextField";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { goBack } from "@/lib/navigation";
import { cardShadow, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";
import type { EventBeverageRow } from "@/types";

const CURRENCY = "ETB" as const;
const DURATION_PRESETS = [15, 30, 60, 90, 120];
type DurationChoice = number | "custom";
type StartChoice = "manual" | "scheduled";

/**
 * Publishes a new happy-hour campaign for this event — pick one or more
 * drinks already on the event's line-up (GET .../beverages), set a
 * discounted price for each, pick a duration (a preset or a custom number
 * of minutes), and how it starts: manually (an explicit "Start now" back on
 * the control screen) or automatically at a picked date/time.
 */
export default function NewHappyHourScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { eventId, eventTitle, eventEndDate } = useLocalSearchParams<{
    eventId: string;
    eventTitle?: string;
    eventEndDate?: string;
  }>();
  const controlScreenHref = {
    pathname: "/organizer/happy-hour/[eventId]",
    params: { eventId, eventTitle: eventTitle ?? "", eventEndDate: eventEndDate ?? "" },
  } as const;
  // A happy hour can never be scheduled to start, or made to run, past its
  // own event's end. The picker/control screen already thread the event's
  // endDate through as a param (used immediately, no loading flicker), but
  // this also fetches it directly (same organizer-dashboard query the Bar
  // tab and event picker already use, so normally cache-hit) as the
  // authoritative source once it lands — the param is a fast, secondary
  // path, not the only one.
  const organizerId = useAuthStore((s) => s.user?._id);
  const eventsQuery = useQuery({
    queryKey: ["organizer-dashboard", organizerId, CURRENCY],
    queryFn: () => getOrganizerDashboard(organizerId as string, CURRENCY),
    enabled: !!organizerId,
  });
  const fetchedEndDate = eventsQuery.data?.data.events.find((e) => e._id === eventId)?.endDate;
  const eventEnd = useMemo(() => {
    const raw = fetchedEndDate ?? eventEndDate;
    return raw ? new Date(raw) : null;
  }, [fetchedEndDate, eventEndDate]);

  const [selected, setSelected] = useState<Record<string, string>>({}); // eventBeverageId -> price input text
  const [durationChoice, setDurationChoice] = useState<DurationChoice>(30);
  const [customDuration, setCustomDuration] = useState("");
  const [startChoice, setStartChoice] = useState<StartChoice>("manual");
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const lineupQuery = useQuery({
    queryKey: ["event-beverage-lineup", eventId],
    queryFn: () => getEventBeverageLineup(eventId),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateHappyHourInput) => createEventHappyHour(eventId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["happy-hours", eventId] });
      goBack(controlScreenHref);
    },
  });

  function toggleRow(row: EventBeverageRow) {
    setSelected((prev) => {
      const next = { ...prev };
      if (row._id in next) {
        delete next[row._id];
      } else {
        next[row._id] = "";
      }
      return next;
    });
  }

  function submit(rows: EventBeverageRow[]) {
    const ids = Object.keys(selected);
    if (ids.length === 0) {
      setFormError("Pick at least one drink");
      return;
    }
    const items: { eventBeverageId: string; price: number }[] = [];
    for (const id of ids) {
      const row = rows.find((r) => r._id === id);
      const price = Number(selected[id]);
      if (!row || !Number.isFinite(price) || price <= 0) {
        setFormError(`Enter a valid discounted price for ${row?.beverage?.name ?? "each drink"}`);
        return;
      }
      if (price >= row.price) {
        setFormError(`${row.beverage?.name ?? "That drink"}'s price must be below its regular ${formatMoney(row.price, CURRENCY)}`);
        return;
      }
      items.push({ eventBeverageId: id, price });
    }

    const durationMinutes =
      durationChoice === "custom" ? Number(customDuration) : durationChoice;
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
      setFormError("Enter a valid duration in minutes");
      return;
    }

    if (startChoice === "scheduled") {
      if (!scheduledAt) {
        setFormError("Pick a start time");
        return;
      }
      if (scheduledAt.getTime() <= Date.now()) {
        setFormError("Pick a start time in the future");
        return;
      }
      // A happy hour can't outlast its own event — the picker already
      // caps the *start* at the event's end, but the start + duration
      // together can still run past it.
      if (eventEnd && scheduledAt.getTime() + durationMinutes * 60000 > eventEnd.getTime()) {
        setFormError("This happy hour would still be running after the event ends — shorten the duration or pick an earlier start.");
        return;
      }
    }

    setFormError(null);
    createMutation.mutate({
      items,
      durationMinutes,
      startMode: startChoice,
      ...(startChoice === "scheduled" && scheduledAt
        ? { scheduledStartAt: scheduledAt.toISOString() }
        : {}),
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBack(controlScreenHref)} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          New happy hour{eventTitle ? ` · ${eventTitle}` : ""}
        </Text>
      </View>

      {lineupQuery.isPending ? (
        <LoadingScreen />
      ) : lineupQuery.isError ? (
        <View style={styles.errorContainer}>
          <Banner
            kind="error"
            message={bannerMessageFor(lineupQuery.error) ?? "Couldn't load this event's drinks."}
          />
          <Button label="Try again" onPress={() => lineupQuery.refetch()} />
        </View>
      ) : (
        (() => {
          const eligible = lineupQuery.data.data.filter(
            (row) =>
              row.beverage &&
              row.isAvailable &&
              !row.unavailableReason &&
              row.happyHourStatus.status !== "active" &&
              row.happyHourStatus.status !== "scheduled",
          );

          return (
            <ScrollView contentContainerStyle={styles.content}>
              {eligible.length === 0 ? (
                <EmptyState
                  title="No drinks available"
                  body="Every drink on this event is either already in a happy hour or not currently for sale."
                />
              ) : (
                <>
                  <Text style={styles.sectionLabel}>Pick drinks</Text>
                  <View style={styles.drinkList}>
                    {eligible.map((row) => (
                      <DrinkRow
                        key={row._id}
                        colors={colors}
                        row={row}
                        selected={row._id in selected}
                        priceInput={selected[row._id] ?? ""}
                        onToggle={() => toggleRow(row)}
                        onChangePrice={(text) =>
                          setSelected((prev) => ({ ...prev, [row._id]: text }))
                        }
                      />
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Duration</Text>
                  <View style={styles.durationRow}>
                    {DURATION_PRESETS.map((minutes) => {
                      const active = durationChoice === minutes;
                      return (
                        <Pressable
                          key={minutes}
                          onPress={() => setDurationChoice(minutes)}
                          style={[styles.durationChip, active && styles.durationChipActive]}
                        >
                          <Text
                            style={[styles.durationChipText, active && styles.durationChipTextActive]}
                          >
                            {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                          </Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      onPress={() => setDurationChoice("custom")}
                      style={[styles.durationChip, durationChoice === "custom" && styles.durationChipActive]}
                    >
                      <Text
                        style={[
                          styles.durationChipText,
                          durationChoice === "custom" && styles.durationChipTextActive,
                        ]}
                      >
                        Custom
                      </Text>
                    </Pressable>
                  </View>
                  {durationChoice === "custom" ? (
                    <TextField
                      label="Custom duration (minutes)"
                      value={customDuration}
                      onChangeText={setCustomDuration}
                      keyboardType="number-pad"
                      placeholder="e.g. 45"
                    />
                  ) : null}

                  <Text style={styles.sectionLabel}>Starting</Text>
                  <SegmentedControl<StartChoice>
                    options={[
                      { value: "manual", label: "Start manually" },
                      { value: "scheduled", label: "Start automatically" },
                    ]}
                    value={startChoice}
                    onChange={setStartChoice}
                  />
                  {startChoice === "scheduled" ? (
                    <Pressable onPress={() => setPickerOpen(true)} style={styles.scheduleButton}>
                      <Ionicons name="calendar-outline" size={18} color={colors.ink} />
                      <Text style={styles.scheduleButtonText}>
                        {scheduledAt ? scheduledAt.toLocaleString() : "Pick a start time"}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.helperText}>
                      You'll start it yourself with the "Start now" button.
                    </Text>
                  )}

                  {formError ? <Banner kind="error" message={formError} /> : null}
                  {createMutation.isError ? (
                    <Banner
                      kind="error"
                      message={bannerMessageFor(createMutation.error) ?? "Couldn't create it."}
                    />
                  ) : null}

                  <Button
                    label="Create happy hour"
                    onPress={() => submit(eligible)}
                    loading={createMutation.isPending}
                  />
                </>
              )}
            </ScrollView>
          );
        })()
      )}

      <HappyHourStartPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={(date) => {
          setScheduledAt(date);
          setPickerOpen(false);
        }}
        minDate={new Date()}
        maxDate={eventEnd ?? new Date(Date.now() + 7 * 24 * 60 * 60000)}
        initialDate={scheduledAt}
      />
    </SafeAreaView>
  );
}

function DrinkRow({
  colors,
  row,
  selected,
  priceInput,
  onToggle,
  onChangePrice,
}: {
  colors: ThemeColors;
  row: EventBeverageRow;
  selected: boolean;
  priceInput: string;
  onToggle: () => void;
  onChangePrice: (text: string) => void;
}) {
  const styles = rowStyles(colors);
  const image = resolveMediaUrl(row.beverage?.image);

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle} style={styles.row}>
        <View style={[styles.checkbox, selected && styles.checkboxActive]}>
          {selected ? <Ionicons name="checkmark" size={14} color={colors.buttonPrimaryText} /> : null}
        </View>
        {image ? (
          <Image source={{ uri: image }} style={styles.thumb} />
        ) : (
          <View
            style={[
              styles.thumb,
              styles.thumbFallback,
              { backgroundColor: row.beverage?.color || colors.surfaceAlt },
            ]}
          >
            <Text style={styles.thumbInitial}>{(row.beverage?.name ?? "?").charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {row.beverage?.name ?? "Drink"}
          </Text>
          <Text style={styles.meta}>
            {formatMoney(row.price, CURRENCY)} · {row.remaining} left
          </Text>
        </View>
      </Pressable>

      {selected ? (
        <TextField
          label="Discounted price"
          value={priceInput}
          onChangeText={onChangePrice}
          keyboardType="decimal-pad"
          placeholder={`Below ${formatMoney(row.price, CURRENCY)}`}
          style={styles.priceInput}
        />
      ) : null}
    </View>
  );
}

const rowStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      boxShadow: cardShadow(colors),
      padding: 12,
      gap: 10,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    thumb: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surfaceAlt,
    },
    thumbFallback: {
      alignItems: "center",
      justifyContent: "center",
    },
    thumbInitial: {
      fontFamily: fonts.extrabold,
      fontSize: 15,
      color: "#FFFFFF",
    },
    info: {
      flex: 1,
      gap: 2,
    },
    name: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.ink,
    },
    meta: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
    },
    priceInput: {
      height: 46,
    },
  });

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    topBarTitle: {
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: 17,
      color: colors.ink,
    },
    content: {
      padding: 20,
      gap: 14,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginTop: 4,
    },
    drinkList: {
      gap: 10,
    },
    durationRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    durationChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    durationChipActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    durationChipText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.ink,
    },
    durationChipTextActive: {
      color: colors.buttonPrimaryText,
    },
    scheduleButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    scheduleButtonText: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.ink,
    },
    helperText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: -4,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      gap: 16,
    },
  });
