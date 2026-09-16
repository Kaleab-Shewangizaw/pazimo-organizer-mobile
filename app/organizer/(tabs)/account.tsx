import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getOrganizerProfile } from "@/api/organizers";
import { useTabBarHeight } from "@/components/TabBarHeightProvider";
import { fonts } from "@/lib/fonts";
import { resolveMediaUrl } from "@/lib/media";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";

export default function OrganizerAccountScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useTabBarHeight();
  const user = useAuthStore((s) => s.user);
  const avatarUrl = resolveMediaUrl(user?.profilePicture);

  // organization isn't on /auth/me (it lives on the sign-up
  // OrganizerRegistration doc, joined in by GET /organizers/profile), so the
  // store's user never has it — fetch it separately for display here.
  const profileQuery = useQuery({
    queryKey: ["organizer-profile"],
    queryFn: getOrganizerProfile,
  });
  const organization = profileQuery.data?.data.organization;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Account</Text>
          <Pressable
            onPress={() => router.push("/organizer/account/menu")}
            hitSlop={12}
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel="Account menu"
          >
            <Ionicons name="menu-outline" size={22} color={colors.ink} />
          </Pressable>
        </View>

        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {user?.firstName?.charAt(0).toUpperCase() ?? "?"}
            </Text>
          </View>
        )}
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.role}>Organizer</Text>

        <View style={styles.section}>
          <InfoRow colors={colors} label="Organization" value={organization ?? "—"} />
          <InfoRow colors={colors} label="Email" value={user?.email ?? "—"} />
          <InfoRow colors={colors} label="Phone" value={user?.phoneNumber ?? "—"} last />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  colors,
  label,
  value,
  last,
}: {
  colors: ThemeColors;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles_infoRow.row,
        { borderBottomColor: colors.border },
        last && { borderBottomWidth: 0 },
      ]}
    >
      <Text style={[styles_infoRow.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles_infoRow.value, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

const styles_infoRow = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
  },
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      alignItems: "center",
    },
    titleRow: {
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 20,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: colors.ink,
    },
    menuButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      marginBottom: 12,
    },
    avatarFallback: {
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitial: {
      fontFamily: fonts.extrabold,
      fontSize: 28,
      color: colors.accentText,
    },
    name: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.ink,
    },
    role: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
      marginBottom: 24,
    },
    section: {
      alignSelf: "stretch",
      marginBottom: 28,
    },
  });
