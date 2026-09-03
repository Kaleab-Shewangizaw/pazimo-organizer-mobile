import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { colors } from "@/lib/theme";
import { useAuthStore } from "@/store/authStore";

/**
 * Organizer home is a placeholder — this pass focused on auth + the
 * organizer sign-up flow. Events, tickets, sales and the scanner (spec
 * section 11) come next; see README "Next steps".
 */
export default function OrganizerHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <Screen>
      <Text style={styles.title}>Welcome, {user?.firstName}</Text>
      <Text style={styles.subtitle}>
        Signed in as an organizer. Events, tickets, and the scanner will live
        here next.
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
    color: colors.text,
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
