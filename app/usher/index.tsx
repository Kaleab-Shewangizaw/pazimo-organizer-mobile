import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { colors } from "@/lib/theme";
import { useAuthStore } from "@/store/authStore";

/**
 * The Pazimo backend has no "usher" role or event-staff-assignment model
 * today (checked User.js's role enum and the whole controller layer) — so
 * nothing can actually sign in and land here yet. This route exists so the
 * navigation shell matches the target architecture; it becomes live the
 * moment the backend adds the role. See README "Backend limitations".
 */
export default function UsherHomeScreen() {
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <Screen>
      <Text style={styles.title}>Scanner</Text>
      <Text style={styles.subtitle}>
        Usher accounts aren't supported by the Pazimo backend yet — this
        screen is a placeholder for when that lands.
      </Text>
      <View style={styles.spacer} />
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 22,
  },
  spacer: {
    flex: 1,
  },
});
