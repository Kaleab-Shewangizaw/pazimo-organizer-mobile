import { router } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { RoleCard } from "@/components/RoleCard";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

/**
 * Role is always resolved server-side (GET /api/auth/me / the login
 * response) — this screen never grants access, it only decides which
 * login copy/screen a person taps. All three buttons lead to the same
 * email+password form (LoginForm) against the same POST /api/auth/login;
 * the backend alone decides the account's real role and where
 * app/_layout.tsx routes it afterwards.
 *
 * The brand block and the three role cards animate in on mount (Reanimated's
 * built-in entrance presets) — this app's version of the "logo take-over"
 * open every major app does, without a separate splash *route* that would
 * either flash blank against the native splash or just duplicate this
 * screen's own content.
 */
export default function WelcomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.brand}>
          <Text style={styles.wordmark}>Pazimo</Text>
          <View style={styles.rule} />
          <Text style={styles.tagline}>Run the show.</Text>
        </Animated.View>

        <View style={styles.roles}>
          <Animated.View entering={FadeInDown.delay(150).duration(450)}>
            <RoleCard
              icon="briefcase-outline"
              title="Organizer"
              subtitle=""
              onPress={() => router.push("/organizer-login")}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(230).duration(450)}>
            <RoleCard
              icon="qr-code-outline"
              title="Usher"
              subtitle=""
              onPress={() => router.push("/usher-login")}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(310).duration(450)}>
            <RoleCard
              icon="storefront-outline"
              title="Cashier"
              subtitle=""
              onPress={() => router.push("/cashier-login")}
            />
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingTop: 72,
      paddingBottom: 28,
    },
    brand: {
      alignItems: "center",
    },
    wordmark: {
      fontFamily: fonts.extrabold,
      fontSize: 38,
      color: colors.ink,
      letterSpacing: 0.3,
    },
    rule: {
      width: 32,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.accent,
      marginTop: 14,
      marginBottom: 14,
    },
    tagline: {
      fontSize: 16,
      color: colors.textMuted,
    },
    roles: {
      gap: 12,
    },
  });
