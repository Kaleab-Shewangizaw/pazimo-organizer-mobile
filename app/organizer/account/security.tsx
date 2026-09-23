import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { updateOrganizerPassword } from "@/api/organizers";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { newPasswordSchema } from "@/features/auth/schemas";
import { bannerMessageFor, VALIDATION_ERROR_MESSAGE } from "@/lib/errors";
import { fonts } from "@/lib/fonts";
import { goBack } from "@/lib/navigation";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

export default function OrganizerSecurityScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async () => {
      const errors: Record<string, string> = {};
      if (!currentPassword) errors.currentPassword = "Enter your current password";
      const parsedNew = newPasswordSchema.safeParse(newPassword);
      if (!parsedNew.success) errors.newPassword = parsedNew.error.issues[0]?.message ?? "Invalid password";
      if (parsedNew.success && confirmPassword !== newPassword) {
        errors.confirmPassword = "Passwords don't match";
      }
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        throw new Error(VALIDATION_ERROR_MESSAGE);
      }
      setFieldErrors({});
      await updateOrganizerPassword({ currentPassword, newPassword });
    },
    onSuccess: () => {
      Alert.alert("Password updated", "Use your new password next time you sign in.");
      goBack("/organizer/account/menu");
    },
  });

  const topLevelError = mutation.isError ? bannerMessageFor(mutation.error) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBack("/organizer/account/menu")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>Change password</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {topLevelError ? <Banner kind="error" message={topLevelError} /> : null}

        <TextField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          error={fieldErrors.currentPassword}
          isPassword
          autoComplete="current-password"
        />
        <TextField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          error={fieldErrors.newPassword}
          isPassword
          autoComplete="new-password"
        />
        <TextField
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={fieldErrors.confirmPassword}
          isPassword
          autoComplete="new-password"
        />

        <Button
          label="Update password"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
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
