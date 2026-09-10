import { useMutation } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { login } from "@/api/auth";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { loginSchema } from "@/features/auth/schemas";
import { bannerMessageFor, VALIDATION_ERROR_MESSAGE } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";
import { ApiError, type UserRole } from "@/types";

/**
 * Picking a tab/role on the sign-in screen isn't just copy — it's a real
 * gate. A correctly-authenticated account signing in through the *wrong*
 * tab (organizer credentials on the Usher/Cashier tab, or vice versa) is
 * rejected here, before authStore.signIn() is ever called, so no token is
 * persisted and app/_layout.tsx never gets a chance to route on it. This
 * doesn't change the actual authorization boundary (the backend still owns
 * that entirely) — it only stops a person from landing in the wrong role's
 * screens by picking the wrong tab.
 *
 * Deliberately the same generic message regardless of the account's real
 * role — never confirms "this email is an organizer account" to whoever's
 * typing, same reasoning as the backend's own "Invalid credentials" not
 * distinguishing a wrong password from a nonexistent email.
 */
function assertExpectedRole(actualRole: UserRole, expectedRole?: UserRole) {
  if (!expectedRole || actualRole === expectedRole) return;
  throw new ApiError("Account not found.", null);
}

interface LoginFormProps {
  title: string;
  subtitle: string;
  /**
   * When true, renders just the form fields — no Screen wrapper, no
   * title/subtitle header — so a parent screen can compose it inline below
   * its own chrome (the sign-in screen's Organizer/Staff tabs). Defaults to
   * false for organizer-login.tsx/usher-login.tsx/cashier-login.tsx, which
   * still work as standalone full screens if something links to them
   * directly.
   */
  embedded?: boolean;
  /** The only role this particular tab/screen accepts — see assertExpectedRole above. */
  expectedRole?: UserRole;
}

/**
 * Shared by every role's *-login.tsx screen and the embedded sign-in flow —
 * all are plain email+password against the same POST /api/auth/login, and
 * the backend decides the account's real role and whether a second factor
 * is required (organizer accounts only, today). `expectedRole` is enforced
 * client-side on top of that (see assertExpectedRole) so the tab/screen
 * copy is never misleading about who actually gets signed in.
 *
 * Organizer 2FA (requiresOtp) navigates to its own /verify-otp page rather
 * than swapping content in place here — otherwise, when embedded on the
 * tabbed sign-in screen, the Organizer/Usher/Cashier tabs would still sit
 * there, selectable, above a code-entry form that's already answering for
 * a specific role.
 */
export function LoginForm({ title, subtitle, embedded, expectedRole }: LoginFormProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          errors[String(issue.path[0])] = issue.message;
        }
        setFieldErrors(errors);
        throw new Error(VALIDATION_ERROR_MESSAGE);
      }
      setFieldErrors({});
      const res = await login(parsed.data.email, parsed.data.password);
      if (res.requiresOtp) {
        // requiresOtp only ever fires for role === "organizer" (see
        // authController.js login()) — so reaching here already tells us
        // the account's real role, even before OTP is verified. A mismatch
        // is rejected right away rather than sending an OTP for a sign-in
        // that's going to be refused anyway.
        assertExpectedRole("organizer", expectedRole);
        router.push({
          pathname: "/verify-otp",
          params: {
            email: res.data.email,
            channel: res.data.channel,
            maskedDestination: res.data.maskedDestination,
            expectedRole: expectedRole ?? "",
          },
        });
        return;
      }
      assertExpectedRole(res.data.user.role, expectedRole);
      await signIn(res.data.token, res.data.user);
    },
  });

  const topLevelError = mutation.isError ? bannerMessageFor(mutation.error) : null;

  const formContent = (
    <View style={styles.form}>
      {topLevelError ? <Banner kind="error" message={topLevelError} /> : null}

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        secureTextEntry
        autoComplete="password"
        placeholder="••••••••"
      />

      <Button
        label="Sign in"
        onPress={() => mutation.mutate()}
        loading={mutation.isPending}
        style={styles.submit}
      />

      <Link href="/forgot-password" style={styles.forgotLink}>
        Forgot password?
      </Link>
    </View>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {formContent}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      alignItems: "center",
      gap: 6,
      marginTop: 24,
      marginBottom: 32,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 24,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 15,
      color: colors.textMuted,
      textAlign: "center",
    },
    form: {
      gap: 16,
    },
    submit: {
      marginTop: 8,
    },
    forgotLink: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 4,
    },
  });
