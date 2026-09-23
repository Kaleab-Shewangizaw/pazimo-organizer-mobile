import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  /**
   * Renders a show/hide eye toggle inside the field and manages
   * secureTextEntry itself (starts hidden) — use this instead of passing
   * secureTextEntry directly on any field that holds a password.
   */
  isPassword?: boolean;
}

export function TextField({ label, error, style, isPassword, ...inputProps }: TextFieldProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            isPassword && styles.inputWithIcon,
            !!error && styles.inputError,
            style,
          ]}
          {...inputProps}
          secureTextEntry={isPassword ? hidden : inputProps.secureTextEntry}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={10}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
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
    inputWrap: {
      justifyContent: "center",
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
    inputWithIcon: {
      paddingRight: 46,
    },
    inputError: {
      borderColor: colors.error,
    },
    eyeButton: {
      position: "absolute",
      right: 14,
      height: 54,
      alignItems: "center",
      justifyContent: "center",
    },
    error: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.error,
    },
  });
