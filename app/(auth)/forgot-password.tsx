import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { forgotPassword, resetPassword, verifyResetCode } from "@/api/auth";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { OtpInput } from "@/components/OtpInput";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import {
  identifierSchema,
  newPasswordSchema,
  otpSchema,
} from "@/features/auth/schemas";
import { bannerMessageFor, VALIDATION_ERROR_MESSAGE } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<"request" | "code" | "newPassword">("request");
  const [identifier, setIdentifier] = useState("");
  const [maskedDestination, setMaskedDestination] = useState("");
  const [code, setCode] = useState("");

  if (step === "code") {
    return (
      <EnterCodeStep
        identifier={identifier}
        maskedDestination={maskedDestination}
        onBack={() => setStep("request")}
        onVerified={(verifiedCode) => {
          setCode(verifiedCode);
          setStep("newPassword");
        }}
      />
    );
  }

  if (step === "newPassword") {
    return <NewPasswordStep identifier={identifier} code={code} />;
  }

  return (
    <RequestCodeStep
      identifier={identifier}
      onChangeIdentifier={setIdentifier}
      onSent={(masked) => {
        setMaskedDestination(masked);
        setStep("code");
      }}
    />
  );
}

function RequestCodeStep({
  identifier,
  onChangeIdentifier,
  onSent,
}: {
  identifier: string;
  onChangeIdentifier: (v: string) => void;
  onSent: (maskedDestination: string) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [fieldError, setFieldError] = useState<string | undefined>();

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = identifierSchema.safeParse(identifier);
      if (!parsed.success) {
        setFieldError(parsed.error.issues[0]?.message);
        throw new Error(VALIDATION_ERROR_MESSAGE);
      }
      setFieldError(undefined);
      return forgotPassword(parsed.data);
    },
    onSuccess: (res) => onSent(res.maskedDestination),
  });

  const topLevelError = mutation.isError ? bannerMessageFor(mutation.error) : null;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>
          Enter the email or phone number on your account and we'll send you
          a code.
        </Text>
      </View>

      <View style={styles.form}>
        {topLevelError ? <Banner kind="error" message={topLevelError} /> : null}

        <TextField
          label="Email or phone number"
          value={identifier}
          onChangeText={onChangeIdentifier}
          error={fieldError}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com or 0912345678"
        />

        <Button
          label="Send code"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText} onPress={() => router.back()} accessibilityRole="link">
          ‹ Back to sign in
        </Text>
      </View>
    </Screen>
  );
}

function EnterCodeStep({
  identifier,
  maskedDestination,
  onBack,
  onVerified,
}: {
  identifier: string;
  maskedDestination: string;
  onBack: () => void;
  onVerified: (code: string) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      await verifyResetCode(identifier, parsed.data);
      return parsed.data;
    },
    onSuccess: onVerified,
  });

  const resendMutation = useMutation({
    mutationFn: () => forgotPassword(identifier),
  });

  const verifyError = verifyMutation.isError ? bannerMessageFor(verifyMutation.error) : null;
  const resendError = resendMutation.isError ? bannerMessageFor(resendMutation.error) : null;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to {maskedDestination}.
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
          label="Continue"
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
          ‹ Back
        </Text>
      </View>
    </Screen>
  );
}

function NewPasswordStep({ identifier, code }: { identifier: string; code: string }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const signIn = useAuthStore((s) => s.signIn);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = newPasswordSchema.safeParse(password);
      if (!parsed.success) {
        setErrors({ password: parsed.error.issues[0]?.message });
        throw new Error(VALIDATION_ERROR_MESSAGE);
      }
      if (password !== confirmPassword) {
        setErrors({ confirmPassword: "Passwords don't match" });
        throw new Error(VALIDATION_ERROR_MESSAGE);
      }
      setErrors({});
      const res = await resetPassword(identifier, code, parsed.data);
      await signIn(res.data.token, res.data.user);
    },
  });

  const topLevelError = mutation.isError ? bannerMessageFor(mutation.error) : null;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Set a new password</Text>
        <Text style={styles.subtitle}>
          You'll be signed in automatically once it's changed.
        </Text>
      </View>

      <View style={styles.form}>
        {topLevelError ? <Banner kind="error" message={topLevelError} /> : null}

        <TextField
          label="New password"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
          placeholder="At least 6 characters"
        />
        <TextField
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
          secureTextEntry
          placeholder="Re-enter your new password"
        />

        <Button
          label="Reset password"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
        />
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
      fontSize: 22,
      color: colors.ink,
    },
    subtitle: {
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
