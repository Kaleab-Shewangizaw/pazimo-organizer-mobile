import { useMutation } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { login, organizerSendOtp, verifyOrganizerOtp } from "@/api/auth";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { OtpInput } from "@/components/OtpInput";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { loginSchema, otpSchema } from "@/features/auth/schemas";
import { bannerMessageFor, VALIDATION_ERROR_MESSAGE } from "@/lib/errors";
import { colors } from "@/lib/theme";
import { useAuthStore } from "@/store/authStore";
import type { OtpChannel } from "@/types";

interface OtpContext {
  email: string;
  channel: OtpChannel;
  maskedDestination: string;
}

export default function LoginScreen() {
  const [otpContext, setOtpContext] = useState<OtpContext | null>(null);

  if (otpContext) {
    return (
      <VerifyLoginOtp context={otpContext} onBack={() => setOtpContext(null)} />
    );
  }

  return <PasswordStep onRequiresOtp={setOtpContext} />;
}

function PasswordStep({
  onRequiresOtp,
}: {
  onRequiresOtp: (ctx: OtpContext) => void;
}) {
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
        onRequiresOtp(res.data);
        return;
      }
      await signIn(res.data.token, res.data.user);
    },
  });

  const topLevelError = mutation.isError ? bannerMessageFor(mutation.error) : null;

  return (
    <Screen>
      <View style={styles.header}>
        <Image
          source={require("../../assets/icon.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Pazimo Organizer</Text>
        <Text style={styles.subtitle}>Sign in to manage your events</Text>
      </View>

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
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>New organizer?</Text>
        <Link href="/organizer-signup" style={styles.link}>
          Create an account
        </Link>
      </View>
    </Screen>
  );
}

/**
 * Organizers get a mandatory second factor after the password check
 * (backend/src/controllers/authController.js login(), added 2026-09-04).
 * This step completes that with POST /api/auth/organizer/verify-otp — the
 * same endpoint the backend's standalone "sign in with a code" path uses.
 */
function VerifyLoginOtp({
  context,
  onBack,
}: {
  context: OtpContext;
  onBack: () => void;
}) {
  const signIn = useAuthStore((s) => s.signIn);
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
      await signIn(res.data.token, res.data.user);
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => organizerSendOtp(context.email, context.channel),
  });

  const verifyError = verifyMutation.isError ? bannerMessageFor(verifyMutation.error) : null;
  const resendError = resendMutation.isError ? bannerMessageFor(resendMutation.error) : null;

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
        {resendMutation.isSuccess ? (
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
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText} onPress={onBack} accessibilityRole="link">
          ‹ Back to sign in
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    gap: 6,
    marginTop: 40,
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
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
    gap: 6,
    marginTop: 32,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  link: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
});
