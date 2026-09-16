import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getNotificationPreferences, updateNotificationPreferences } from "@/api/auth";
import { Banner } from "@/components/Banner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { bannerMessageFor } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { goBack } from "@/lib/navigation";
import { cardShadow, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import type { NotificationPreferences } from "@/types";

const QUERY_KEY = ["notification-preferences"];

/**
 * Only ticketUpdates and promotions are shown — chatMessages exists on the
 * shared User model (see backend/src/models/User.js) but this app has no
 * chat/messaging feature, so there's nothing for that toggle to gate here.
 * The key is simply never sent in a patch, same as if it were untouched.
 */
const TOGGLES: { key: keyof NotificationPreferences; label: string; hint: string }[] = [
  {
    key: "ticketUpdates",
    label: "Ticket & order updates",
    hint: "New sales, redemptions, and changes to your events.",
  },
  {
    key: "promotions",
    label: "Promotions",
    hint: "Occasional news and tips from Pazimo.",
  },
];

export default function OrganizerNotificationsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getNotificationPreferences,
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<NotificationPreferences>) => updateNotificationPreferences(patch),
    onSuccess: (res) => queryClient.setQueryData(QUERY_KEY, res),
  });

  if (query.isPending) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBack("/organizer/account/menu")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {query.isError ? (
          <Banner kind="error" message={bannerMessageFor(query.error) ?? "Couldn't load preferences."} />
        ) : (
          <View style={styles.card}>
            {TOGGLES.map(({ key, label, hint }, index) => (
              <View
                key={key}
                style={[styles.row, index < TOGGLES.length - 1 && styles.divider]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.label}>{label}</Text>
                  <Text style={styles.hint}>{hint}</Text>
                </View>
                <Switch
                  value={query.data.data[key]}
                  onValueChange={(value) => mutation.mutate({ [key]: value })}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.surface}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
      fontFamily: fonts.bold,
      fontSize: 17,
      color: colors.ink,
    },
    content: {
      padding: 20,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      boxShadow: cardShadow(colors),
      paddingHorizontal: 14,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 14,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowText: {
      flex: 1,
      gap: 2,
    },
    label: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.ink,
    },
    hint: {
      fontSize: 13,
      color: colors.textMuted,
    },
  });
