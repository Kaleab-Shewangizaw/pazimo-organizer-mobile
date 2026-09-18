import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { updateProfile } from "@/api/auth";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { editNameSchema } from "@/features/auth/schemas";
import { bannerMessageFor, VALIDATION_ERROR_MESSAGE } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { goBack } from "@/lib/navigation";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";

/**
 * A cashier/usher account has no organization, no editable phone (the login
 * identifier) — its whole edit surface is a name. Uses the generic
 * PUT /auth/update-profile (role-agnostic) rather than organizer's
 * /organizers/profile.
 */
export default function CashierEditNameScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = editNameSchema.safeParse({ firstName, lastName });
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          errors[String(issue.path[0])] = issue.message;
        }
        setFieldErrors(errors);
        throw new Error(VALIDATION_ERROR_MESSAGE);
      }
      setFieldErrors({});
      const res = await updateProfile(parsed.data);
      setUser(res.data);
    },
    onSuccess: () => goBack("/cashier/(tabs)/account"),
  });

  const topLevelError = saveMutation.isError ? bannerMessageFor(saveMutation.error) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBack("/cashier/(tabs)/account")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>Edit name</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {topLevelError ? <Banner kind="error" message={topLevelError} /> : null}

        <TextField
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          error={fieldErrors.firstName}
          autoCapitalize="words"
        />
        <TextField
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          error={fieldErrors.lastName}
          autoCapitalize="words"
        />

        <Button
          label="Save changes"
          onPress={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          style={styles.submit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    topBarTitle: {
      fontFamily: fonts.bold,
      fontSize: 17,
      color: colors.ink,
    },
    content: {
      padding: 20,
      gap: 16,
      paddingBottom: 40,
    },
    submit: {
      marginTop: 8,
    },
  });
