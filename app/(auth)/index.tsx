import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

const ROLES = [
  { icon: "briefcase-outline", title: "Organizer", href: "/organizer-login" },
  { icon: "qr-code-outline", title: "Usher", href: "/usher-login" },
  { icon: "storefront-outline", title: "Cashier", href: "/cashier-login" },
] as const;

/**
 * Role is always resolved server-side (GET /api/auth/me / the login
 * response) — this screen never grants access, it only decides which
 * login copy/screen a person taps. All three lead to the same
 * email+password form (LoginForm) against the same POST /api/auth/login;
 * the backend alone decides the account's real role and where
 * app/_layout.tsx routes it afterwards.
 */
export default function WelcomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(500)}>
          <Text style={styles.wordmark}>Pazimo</Text>
          <Text style={styles.tagline}>Sign in to work the show.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(450)} style={styles.roleRow}>
          {ROLES.map((role) => (
            <Pressable
              key={role.title}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                router.push(role.href);
              }}
              style={({ pressed }) => [styles.role, pressed && styles.rolePressed]}
            >
              <Ionicons name={role.icon} size={22} color={colors.accent} />
              <Text style={styles.roleLabel}>{role.title}</Text>
            </Pressable>
          ))}
        </Animated.View>

        <Text style={styles.footer}>
          Ushers scan tickets only. Cashiers manage their own cinema's box office and bar.
        </Text>
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
      paddingHorizontal: 24,
      paddingTop: 72,
      paddingBottom: 28,
    },
    wordmark: {
      fontFamily: fonts.bold,
      fontSize: 34,
      color: colors.ink,
      letterSpacing: 0.2,
    },
    tagline: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 6,
    },
    roleRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 32,
    },
    role: {
      flex: 1,
      alignItems: "center",
      gap: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingVertical: 18,
      paddingHorizontal: 8,
    },
    rolePressed: {
      opacity: 0.7,
    },
    roleLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.ink,
    },
    footer: {
      marginTop: "auto",
      fontFamily: fonts.body,
      fontSize: 11,
      lineHeight: 16,
      textAlign: "center",
      color: colors.textMuted,
    },
  });
