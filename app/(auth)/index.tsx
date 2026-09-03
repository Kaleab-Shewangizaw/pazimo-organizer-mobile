import { useMutation } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { login } from "@/api/auth";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { loginSchema } from "@/features/auth/schemas";
import { colors } from "@/lib/theme";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/types";

export default function LoginScreen() {
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
        throw new Error("VALIDATION");
      }
      setFieldErrors({});
      const res = await login(parsed.data.email, parsed.data.password);
      await signIn(res.data.token, res.data.user);
    },
  });

  const topLevelError =
    mutation.isError && mutation.error instanceof ApiError
      ? mutation.error.message
      : null;

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
  },
  form: {
    gap: 16,
  },
  submit: {
    marginTop: 8,
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
