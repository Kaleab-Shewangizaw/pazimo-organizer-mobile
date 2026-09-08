import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SegmentedControl } from "@/components/SegmentedControl";
import { Screen } from "@/components/Screen";
import { LoginForm } from "@/features/auth/LoginForm";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

type Tab = "organizer" | "staff";
type StaffRole = "usher" | "cashier";

const TAB_OPTIONS: { value: Tab; label: string }[] = [
  { value: "organizer", label: "Organizer" },
  { value: "staff", label: "Usher / Cashier" },
];

const STAFF_ROLES: { value: StaffRole; label: string }[] = [
  { value: "usher", label: "Usher" },
  { value: "cashier", label: "Cashier" },
];

/**
 * Matches the reference's structure exactly (tab switcher, inline form,
 * footer disclaimer pinned to the bottom) — but wired to this app's real
 * auth, not the reference's fictional phone-only/staff-ID fields. Every
 * path here is the same LoginForm (email + password against
 * POST /api/auth/login) embedded inline; the Organizer/Usher/Cashier
 * selection only changes which copy is shown, never what's sent — the
 * backend alone decides the account's real role and where
 * app/_layout.tsx routes it afterwards.
 */
export default function WelcomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tab, setTab] = useState<Tab>("organizer");
  const [staffRole, setStaffRole] = useState<StaffRole>("usher");

  const copy =
    tab === "organizer"
      ? { title: "Sign in as Organizer", subtitle: "Manage your events and see how they're doing" }
      : staffRole === "usher"
        ? { title: "Sign in as Usher", subtitle: "Scan tickets for the events you're assigned to" }
        : { title: "Sign in as Cashier", subtitle: "Manage box office sales and concessions for your cinema" };

  return (
    <Screen>
      <Text style={styles.wordmark}>Pazimo</Text>
      <Text style={styles.tagline}>Sign in to work the show.</Text>

      <View style={styles.tabWrap}>
        <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={setTab} />
      </View>

      {tab === "staff" ? (
        <View style={styles.staffRoleRow}>
          {STAFF_ROLES.map((role) => {
            const active = role.value === staffRole;
            return (
              <Pressable
                key={role.value}
                onPress={() => setStaffRole(role.value)}
                style={[styles.staffRolePill, active && styles.staffRolePillActive]}
              >
                <Text style={[styles.staffRoleLabel, active && styles.staffRoleLabelActive]}>
                  {role.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.formWrap}>
        <LoginForm
          key={tab === "organizer" ? "organizer" : staffRole}
          title={copy.title}
          subtitle={copy.subtitle}
          embedded
        />
      </View>

      <Text style={styles.footer}>
        Ushers scan tickets only. Cashiers manage their own cinema's box office and bar.
      </Text>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wordmark: {
      fontFamily: fonts.bold,
      fontSize: 34,
      color: colors.ink,
      letterSpacing: 0.2,
      marginTop: 16,
    },
    tagline: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 6,
    },
    tabWrap: {
      marginTop: 28,
    },
    staffRoleRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 16,
    },
    staffRolePill: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    staffRolePillActive: {
      borderColor: colors.ink,
      backgroundColor: colors.surfaceAlt,
    },
    staffRoleLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: colors.textMuted,
    },
    staffRoleLabelActive: {
      color: colors.ink,
    },
    formWrap: {
      marginTop: 20,
    },
    footer: {
      marginTop: "auto",
      paddingTop: 24,
      fontFamily: fonts.body,
      fontSize: 11,
      lineHeight: 16,
      textAlign: "center",
      color: colors.textMuted,
    },
  });
