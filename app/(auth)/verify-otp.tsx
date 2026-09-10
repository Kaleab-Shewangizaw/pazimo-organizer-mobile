import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { organizerSendOtp, verifyOrganizerOtp } from "@/api/auth";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { OtpInput } from "@/components/OtpInput";
import { Screen } from "@/components/Screen";
import { otpSchema } from "@/features/auth/schemas";
import { bannerMessageFor, VALIDATION_ERROR_MESSAGE } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useCountdown } from "@/lib/useCountdown";
import { useAuthStore } from "@/store/authStore";
import { ApiError, type OtpChannel, type UserRole } from "@/types";

// A code was just sent to land on this screen, so a resend must wait at
// least this long — long enough for the first one to actually arrive
// before another can be requested.
const RESEND_COOLDOWN_SECONDS = 60;

function assertExpectedRole(actualRole: UserRole, expectedRole?: UserRole) {
  if (!expectedRole || actualRole === expectedRole) return;
  throw new ApiError("Account not found.", null);
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Organizers' mandatory second factor after the password check (backend/
 * src/controllers/authController.js login(), added 2026-09-04) — its own
 * page (reached via LoginForm's router.push, not swapped in below it) so
 * the sign-in screen's role tabs aren't still sitting there, selectable,
 * while a code is pending. Also used standalone for a code-only sign-in
 * via organizerSendOtp, same verify endpoint either way.
 */
export default function VerifyOtpScreen() {
  const params = useLocalSearchParams<{
    email: string;
    channel: OtpChannel;
    maskedDestination: string;
    expectedRole?: string;
  }>();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const signIn = useAuthStore((s) => s.signIn);
  const expectedRole = (params.expectedRole || undefined) as UserRole | undefined;

  const [context, setContext] = useState({
    email: params.email,
    channel: params.channel,
    maskedDestination: params.maskedDestination,
  });
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const { remaining, restart } = useCountdown(RESEND_COOLDOWN_SECONDS);
  const onCooldown = remaining > 0;

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const parsed = otpSchema.safeParse(code);
      if (!parsed.success) {
        setCodeError(parsed.error.issues[0]?.message ?? "Enter the 6-digit code");
        throw new Error(VALIDATION_ERROR_MESSAGE);
      }
      setCodeError(null);
      const res = await verifyOrganizerOtp(context.email, parsed.data);
      // Belt-and-suspenders: LoginForm already rejected a mismatch before
      // this screen was ever reached (requiresOtp only fires for
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
    onSuccess: () => restart(),
  });

  // Ethiopian SMS delivery to this OTP gateway is known to be unreliable
  // (see generateAndSendOtp's comment in authController.js) — this lets an
  // organizer who never got the text fall back to email without starting
  // over from the password screen.
  const emailMutation = useMutation({
    mutationFn: () => organizerSendOtp(context.email, "email"),
    onSuccess: (res) => {
      setContext({ email: context.email, channel: res.channel, maskedDestination: res.maskedDestination });
      restart();
    },
  });

  const verifyError = verifyMutation.isError ? bannerMessageFor(verifyMutation.error) : null;
  const resendError = resendMutation.isError ? bannerMessageFor(resendMutation.error) : null;
  const emailError = emailMutation.isError ? bannerMessageFor(emailMutation.error) : null;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to {context.maskedDestination}.
        </Text>
      </View>

      <View style={styles.form}>
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
          label={onCooldown ? `Resend code (${formatCountdown(remaining)})` : "Resend code"}
          variant="secondary"
          onPress={() => resendMutation.mutate()}
          loading={resendMutation.isPending}
          disabled={onCooldown}
        />
        {context.channel !== "email" ? (
          <Button
            label="Email me a code instead"
            variant="secondary"
            onPress={() => emailMutation.mutate()}
            loading={emailMutation.isPending}
          />
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText} onPress={() => router.back()} accessibilityRole="link">
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
    otpWrap: {
      alignItems: "center",
      gap: 8,
    },
    otpError: {
      fontSize: 13,
      color: colors.error,
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
