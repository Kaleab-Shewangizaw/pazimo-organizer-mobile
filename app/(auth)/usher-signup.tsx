import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { usherSignUp } from "@/api/ushers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { usherSignUpSchema, type UsherSignUpValues } from "@/features/auth/schemas";
import { bannerMessageFor, VALIDATION_ERROR_MESSAGE } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";

const EMPTY_VALUES: UsherSignUpValues = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

/**
 * POST /api/ushers/sign-up — lets an usher create their own account instead
 * of waiting for an admin to hand one out (see usherController.createUsher
 * vs. signUpUsher on the backend). Unlike organizer sign-up there's no
 * approval step: the account works immediately, but it still can't scan
 * anything until the person redeems a real event's code (app/usher/unlock.tsx),
 * so this form signs them straight into the usher tabs on success rather than
 * bouncing back to a login screen.
 */
export default function UsherSignUpScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const signIn = useAuthStore((s) => s.signIn);
  const [values, setValues] = useState<UsherSignUpValues>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set<K extends keyof UsherSignUpValues>(key: K, value: UsherSignUpValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = usherSignUpSchema.safeParse(values);
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          errors[String(issue.path[0])] = issue.message;
        }
        setFieldErrors(errors);
        throw new Error(VALIDATION_ERROR_MESSAGE);
      }
      setFieldErrors({});
      const res = await usherSignUp({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phoneNumber: parsed.data.phoneNumber,
        password: parsed.data.password,
      });
      await signIn(res.data.token, res.data.user);
    },
  });

  const topLevelError = mutation.isError ? bannerMessageFor(mutation.error) : null;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Scan tickets for events once an organizer shares their event code with you.
        </Text>
      </View>

      <View style={styles.form}>
        {topLevelError ? <Banner kind="error" message={topLevelError} /> : null}

        <View style={styles.row}>
          <View style={styles.rowField}>
            <TextField
              label="First name"
              value={values.firstName}
              onChangeText={(v) => set("firstName", v)}
              error={fieldErrors.firstName}
              autoCapitalize="words"
              placeholder="Abebe"
            />
          </View>
          <View style={styles.rowField}>
            <TextField
              label="Last name"
              value={values.lastName}
              onChangeText={(v) => set("lastName", v)}
              error={fieldErrors.lastName}
              autoCapitalize="words"
              placeholder="Kebede"
            />
          </View>
        </View>

        <TextField
          label="Phone number"
          value={values.phoneNumber}
          onChangeText={(v) => set("phoneNumber", v)}
          error={fieldErrors.phoneNumber}
          keyboardType="phone-pad"
          placeholder="0912345678"
        />
        <TextField
          label="Password"
          value={values.password}
          onChangeText={(v) => set("password", v)}
          error={fieldErrors.password}
          isPassword
          autoComplete="password-new"
          placeholder="At least 8 characters"
        />
        <TextField
          label="Confirm password"
          value={values.confirmPassword}
          onChangeText={(v) => set("confirmPassword", v)}
          error={fieldErrors.confirmPassword}
          isPassword
          autoComplete="password-new"
          placeholder="Re-enter your password"
        />

        <Button
          label="Create account"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          style={styles.submit}
        />

        <Text style={styles.footer}>
          Already have an account?{" "}
          <Text style={styles.footerLink} onPress={() => router.back()}>
            Sign in
          </Text>
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
      marginTop: 8,
      marginBottom: 28,
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
    row: {
      flexDirection: "row",
      gap: 12,
    },
    rowField: {
      flex: 1,
    },
    submit: {
      marginTop: 8,
    },
    footer: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: 4,
    },
    footerLink: {
      fontFamily: fonts.bodyMedium,
      color: colors.ink,
      fontWeight: "600",
    },
  });
