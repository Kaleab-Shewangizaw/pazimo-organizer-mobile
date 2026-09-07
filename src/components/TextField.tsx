import { useMemo } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

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
      fontSize: 14,
      fontWeight: "600",
      color: colors.ink,
    },
    input: {
      height: 50,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 14,
      fontSize: 16,
      color: colors.ink,
      backgroundColor: colors.surfaceAlt,
    },
    inputError: {
      borderColor: colors.error,
    },
    error: {
      fontSize: 13,
      color: colors.error,
    },
  });
