import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";

/**
 * Reached when /auth/me returns a role this app doesn't have an
 * experience for (customer, venue, admin, ...). Never falls back to
 * organizer/cashier/usher privileges for an unrecognized role.
 */
export default function UnsupportedRoleScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const role = useAuthStore((s) => s.user?.role);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <Text style={styles.title}>This account isn't supported here</Text>
        <Text style={styles.body}>
          Your account role{role ? ` ("${role}")` : ""} doesn't have access to
          the Pazimo Organizer app. If you think this is a mistake, contact
          Pazimo support.
        </Text>
        <Button label="Sign out" onPress={signOut} style={styles.button} />
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.ink,
      textAlign: "center",
    },
    body: {
      fontSize: 15,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 22,
    },
    button: {
      marginTop: 12,
      alignSelf: "stretch",
    },
  });
