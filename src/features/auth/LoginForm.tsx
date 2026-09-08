import { useMutation } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { login, organizerSendOtp, verifyOrganizerOtp } from "@/api/auth";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { OtpInput } from "@/components/OtpInput";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { loginSchema, otpSchema } from "@/features/auth/schemas";
import { bannerMessageFor, VALIDATION_ERROR_MESSAGE } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";
import { ApiError, type OtpChannel, type UserRole } from "@/types";

interface OtpContext {
  email: string;
  channel: OtpChannel;
  maskedDestination: string;
}

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
 */
export function LoginForm({ title, subtitle, embedded, expectedRole }: LoginFormProps) {
  const [otpContext, setOtpContext] = useState<OtpContext | null>(null);

  if (otpContext) {
    return (
      <VerifyLoginOtp
        context={otpContext}
        onBack={() => setOtpContext(null)}
        embedded={embedded}
        expectedRole={expectedRole}
      />
    );
  }

  return (
    <PasswordStep
      title={title}
      subtitle={subtitle}
      embedded={embedded}
      expectedRole={expectedRole}
      onRequiresOtp={setOtpContext}
    />
  );
}

function PasswordStep({
  title,
  subtitle,
  embedded,
  expectedRole,
  onRequiresOtp,
}: LoginFormProps & { onRequiresOtp: (ctx: OtpContext) => void }) {
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
        onRequiresOtp(res.data);
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

/**
 * Organizers get a mandatory second factor after the password check
 * (backend/src/controllers/authController.js login(), added 2026-09-04).
 * This step completes that with POST /api/auth/organizer/verify-otp — the
 * same endpoint the backend's standalone "sign in with a code" path uses.
 * Usher/cashier accounts never reach this screen — login() only branches
 * into requiresOtp for role === "organizer".
 */
function VerifyLoginOtp({
  context: initialContext,
  onBack,
  embedded,
  expectedRole,
}: {
  context: OtpContext;
  onBack: () => void;
  embedded?: boolean;
  expectedRole?: UserRole;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const signIn = useAuthStore((s) => s.signIn);
  const [context, setContext] = useState(initialContext);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const parsed = otpSchema.safeParse(code);
      if (!parsed.success) {
        setCodeError(parsed.error.issues[0]?.message ?? "Enter the 6-digit code");
        throw new Error(VALIDATION_ERROR_MESSAGE);
      }
      setCodeError(null);
      const res = await verifyOrganizerOtp(context.email, parsed.data);
      // Belt-and-suspenders: PasswordStep already rejected a mismatch
      // before this screen was ever reached (requiresOtp only fires for
      // organizers), so this can't actually fail today — kept for when
      // that assumption changes rather than trusted blindly.
      assertExpectedRole(res.data.user.role, expectedRole);
      await signIn(res.data.token, res.data.user);
    },
  });

  // Same channel as whatever the code was last sent on — resend keeps SMS
  // as SMS, or email as email, once switched.
  const resendMutation = useMutation({
    mutationFn: () => organizerSendOtp(context.email, context.channel),
  });

  // Ethiopian SMS delivery to this OTP gateway is known to be unreliable
  // (see generateAndSendOtp's comment in authController.js) — this lets an
  // organizer who never got the text fall back to email without starting
  // over from the password screen.
  const emailMutation = useMutation({
    mutationFn: () => organizerSendOtp(context.email, "email"),
    onSuccess: (res) => {
      setContext({ email: context.email, channel: res.channel, maskedDestination: res.maskedDestination });
    },
  });

  const verifyError = verifyMutation.isError ? bannerMessageFor(verifyMutation.error) : null;
  const resendError = resendMutation.isError ? bannerMessageFor(resendMutation.error) : null;
  const emailError = emailMutation.isError ? bannerMessageFor(emailMutation.error) : null;

  const formContent = (
    <View style={styles.form}>
      {embedded ? (
        <View style={styles.inlineOtpHeader}>
          <Text style={styles.title}>Enter your code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to {context.maskedDestination}.
          </Text>
        </View>
      ) : null}

      {verifyError ? <Banner kind="error" message={verifyError} /> : null}
      {resendError ? <Banner kind="error" message={resendError} /> : null}
      {emailError ? <Banner kind="error" message={emailError} /> : null}
      {(resendMutation.isSuccess || emailMutation.isSuccess) ? (
        <Banner kind="success" message="A new code was sent." />
      ) : null}

      <View style={styles.otpWrap}>
        <OtpInput value={code} onChange={setCode} autoFocus />
        {codeError ? <Text style={styles.otpError}>{codeError}</Text> : null}
      </View>

      <Button
        label="Verify & sign in"
        onPress={() => verifyMutation.mutate()}
        loading={verifyMutation.isPending}
      />
      <Button
        label="Resend code"
        variant="secondary"
        onPress={() => resendMutation.mutate()}
        loading={resendMutation.isPending}
      />
      {context.channel !== "email" ? (
        <Button
          label="Email me a code instead"
          variant="secondary"
          onPress={() => emailMutation.mutate()}
          loading={emailMutation.isPending}
        />
      ) : null}

      {embedded ? (
        <Text style={styles.backLink} onPress={onBack} accessibilityRole="link">
          ‹ Back to sign in
        </Text>
      ) : null}
    </View>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to {context.maskedDestination}.
        </Text>
      </View>

      {formContent}

      <View style={styles.footer}>
        <Text style={styles.footerText} onPress={onBack} accessibilityRole="link">
          ‹ Back to sign in
        </Text>
      </View>
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
    inlineOtpHeader: {
      alignItems: "center",
      gap: 6,
      marginBottom: 4,
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
    otpWrap: {
      alignItems: "center",
      gap: 8,
    },
    otpError: {
      fontSize: 13,
      color: colors.error,
    },
    backLink: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: "center",
      marginTop: 8,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 32,
    },
    footerText: {
      color: colors.textMuted,
      fontSize: 15,
    },
  });
