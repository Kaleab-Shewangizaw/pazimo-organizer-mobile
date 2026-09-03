import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fonts } from "@/lib/fonts";
import { colors } from "@/lib/theme";

/**
 * Role is always resolved server-side (GET /api/auth/me / the login
 * response) — this screen never grants access, it only decides which
 * login *copy* the person sees. Both buttons lead to the same
 * email+password form against the same POST /api/auth/login.
 */
export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <Text style={styles.wordmark}>Pazimo</Text>
          <View style={styles.rule} />
          <Text style={styles.tagline}>Run the show.</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push("/organizer-login")}
            style={({ pressed }) => [styles.button, styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>Sign in as Organizer</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/usher-login")}
            style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Sign in as Usher</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 96,
    paddingBottom: 32,
  },
  brand: {
    alignItems: "center",
  },
  wordmark: {
    fontFamily: fonts.extrabold,
    fontSize: 40,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  rule: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.gold,
    marginTop: 14,
    marginBottom: 14,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(247, 243, 236, 0.68)",
  },
  actions: {
    gap: 12,
  },
  button: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  primaryButton: {
    backgroundColor: colors.gold,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.navyDeep,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: "rgba(247, 243, 236, 0.35)",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface,
  },
});
