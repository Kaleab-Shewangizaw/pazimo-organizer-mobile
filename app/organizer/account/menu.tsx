import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SegmentedControl } from "@/components/SegmentedControl";
import { SettingsRow } from "@/components/SettingsRow";
import { fonts } from "@/lib/fonts";
import { goBack } from "@/lib/navigation";
import { cardShadow, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";

const SUPPORT_EMAIL = "support@pazimo.com";
const SUPPORT_PHONE = "+251910880151"; // E.164 format for tel: links
const SUPPORT_PHONE_DISPLAY = "+251910880151";

export default function OrganizerAccountMenuScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const signOut = useAuthStore((s) => s.signOut);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const [signOutDialogVisible, setSignOutDialogVisible] = useState(false);

  const handleSignOutConfirm = () => {
    setSignOutDialogVisible(false);
    // Just clear the session — the root layout's Stack.Protected guard
    // (app/_layout.tsx) swaps to the (auth) group automatically once
    // status flips to "signedOut". Navigating manually here races that
    // guard and can leave the app stuck mid-transition.
    signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBack("/organizer/(tabs)/account")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionLabel colors={colors} styles={styles} title="Account" />
        <View style={styles.card}>
          <SettingsRow
            icon="person-outline"
            label="Edit profile"
            last
            onPress={() => router.push("/organizer/account/edit")}
          />
        </View>

        <SectionLabel colors={colors} styles={styles} title="Security" />
        <View style={styles.card}>
          <SettingsRow
            icon="lock-closed-outline"
            label="Change password"
            last
            onPress={() => router.push("/organizer/account/security")}
          />
        </View>

        <SectionLabel colors={colors} styles={styles} title="Notifications" />
        <View style={styles.card}>
          <SettingsRow
            icon="notifications-outline"
            label="Notification preferences"
            last
            onPress={() => router.push("/organizer/account/notifications")}
          />
        </View>

        <SectionLabel colors={colors} styles={styles} title="Display" />
        <View style={styles.card}>
          <View style={styles.themeRow}>
            <Text style={styles.themeLabel}>Theme</Text>
            <SegmentedControl
              options={[
                { value: "light", label: "Light" },
                { value: "system", label: "System" },
                { value: "dark", label: "Dark" },
              ]}
              value={themeMode}
              onChange={setThemeMode}
            />
          </View>
        </View>

        <SectionLabel colors={colors} styles={styles} title="Legal" />
        <View style={styles.card}>
          <SettingsRow
            icon="document-text-outline"
            label="Terms & Conditions"
            onPress={() => router.push("/organizer/account/terms")}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            last
            onPress={() => router.push("/organizer/account/privacy")}
          />
        </View>

        <SectionLabel colors={colors} styles={styles} title="Support" />
        <View style={styles.card}>
          <SettingsRow
            icon="mail-outline"
            label="Email us"
            value={SUPPORT_EMAIL}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
          <SettingsRow
            icon="call-outline"
            label="Call us"
            value={SUPPORT_PHONE_DISPLAY}
            last
            onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
          />
        </View>

        <View style={[styles.card, styles.signOutCard]}>
          <SettingsRow
            icon="log-out-outline"
            label="Sign out"
            danger
            last
            onPress={() => setSignOutDialogVisible(true)}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={signOutDialogVisible}
        title="Sign out?"
        message="You'll need to sign in again to manage your events."
        confirmLabel="Sign out"
        destructive
        onConfirm={handleSignOutConfirm}
        onCancel={() => setSignOutDialogVisible(false)}
      />
    </SafeAreaView>
  );
}

function SectionLabel({
  colors,
  styles,
  title,
}: {
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  title: string;
}) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
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
      paddingBottom: 40,
    },
    sectionLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginBottom: 8,
      marginTop: 20,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      boxShadow: cardShadow(colors),
      paddingHorizontal: 14,
    },
    signOutCard: {
      marginTop: 24,
    },
    themeRow: {
      paddingVertical: 14,
      gap: 10,
    },
    themeLabel: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.ink,
    },
  });
