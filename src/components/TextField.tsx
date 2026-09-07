import { useMemo } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextField({ label, error, style, ...inputProps }: TextFieldProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, !!error && styles.inputError, style]}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: 6,
    },
    label: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: colors.textMuted,
    },
    input: {
      height: 54,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 16,
      fontFamily: fonts.body,
      fontSize: 15,
      color: colors.ink,
      backgroundColor: colors.surface,
    },
    inputError: {
      borderColor: colors.error,
    },
    error: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.error,
    },
  });
