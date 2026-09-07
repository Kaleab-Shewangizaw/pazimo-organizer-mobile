import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { fonts } from "@/lib/fonts";
import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
}: ButtonProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.buttonPrimaryText : colors.ink}
        />
      ) : (
        <Text style={variant === "primary" ? styles.primaryText : styles.secondaryText}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      minHeight: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    primary: {
      backgroundColor: colors.buttonPrimaryBg,
    },
    secondary: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.85,
    },
    primaryText: {
      fontFamily: fonts.semibold,
      color: colors.buttonPrimaryText,
      fontSize: 16,
    },
    secondaryText: {
      fontFamily: fonts.semibold,
      color: colors.ink,
      fontSize: 16,
    },
  });
