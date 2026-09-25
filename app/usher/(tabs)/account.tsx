import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTabBarHeight } from "@/components/TabBarHeightProvider";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";

export default function UsherAccountScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useTabBarHeight();
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Account</Text>
          <Pressable
            onPress={() => router.push("/usher/account/menu")}
            hitSlop={12}
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel="Account menu"
          >
            <Ionicons name="menu-outline" size={22} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>
            {user?.firstName?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.role}>Usher</Text>

        <View style={styles.section}>
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
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
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
