import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCinemaProfile } from "@/api/cinema";
import { AppearanceToggle } from "@/components/AppearanceToggle";
import { Button } from "@/components/Button";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";

export default function CashierAccountScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const profileQuery = useQuery({ queryKey: ["cinema-profile"], queryFn: getCinemaProfile });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Account</Text>

        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>
            {user?.firstName?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.role}>Cashier{profileQuery.data ? ` · ${profileQuery.data.data.name}` : ""}</Text>

        <View style={styles.section}>
          <InfoRow colors={colors} label="Email" value={user?.email ?? "—"} />
          <InfoRow colors={colors} label="Phone" value={user?.phoneNumber ?? "—"} last />
        </View>

        <Text style={styles.sectionLabel}>Appearance</Text>
        <AppearanceToggle />

        <Button label="Sign out" variant="secondary" onPress={signOut} style={styles.signOut} />
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
    title: {
      alignSelf: "flex-start",
      fontFamily: fonts.bold,
      fontSize: 22,
      color: colors.ink,
      marginBottom: 20,
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
      color: colors.accent,
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
    sectionLabel: {
      alignSelf: "flex-start",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginBottom: 10,
    },
    signOut: {
      alignSelf: "stretch",
      marginTop: 32,
    },
  });
