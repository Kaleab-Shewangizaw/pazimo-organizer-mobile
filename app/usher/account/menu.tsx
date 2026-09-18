import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SegmentedControl } from "@/components/SegmentedControl";
import { fonts } from "@/lib/fonts";
import { goBack } from "@/lib/navigation";
import { cardShadow, type ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";

/**
 * Ushers are scan-only accounts with no money or ownership attached (see the
 * User model's role comment) — thinner than the organizer/cashier menus, so
 * this is just the theme toggle and sign out, same hamburger pattern as
 * app/organizer/account/menu.tsx.
 */
export default function UsherAccountMenuScreen() {
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
        <Pressable onPress={() => goBack("/usher/(tabs)/account")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Display</Text>
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

        <View style={[styles.card, styles.signOutCard]}>
          <Pressable
            onPress={() => setSignOutDialogVisible(true)}
            style={({ pressed }) => [styles.signOutRow, pressed && styles.signOutRowPressed]}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.signOutLabel}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={signOutDialogVisible}
        title="Sign out?"
        message="You'll need to sign in again to scan tickets."
        confirmLabel="Sign out"
        destructive
        onConfirm={handleSignOutConfirm}
        onCancel={() => setSignOutDialogVisible(false)}
      />
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
      paddingBottom: 40,
    },
    sectionLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: colors.textMuted,
      marginBottom: 8,
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
    signOutRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
    },
    signOutRowPressed: {
      opacity: 0.6,
    },
    signOutLabel: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.error,
    },
  });
