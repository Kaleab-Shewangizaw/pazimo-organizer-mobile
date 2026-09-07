import { useMemo, useRef } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

const CODE_LENGTH = 6;

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

/**
 * Boxed input for the usher event-unlock code — same "hidden input drives
 * visible boxes" approach as OtpInput, but alphanumeric and uppercased
 * instead of numeric-only, since event codes mix letters and digits.
 */
export function CodeInput({ value, onChange, autoFocus }: CodeInputProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inputRef = useRef<TextInput>(null);
  const chars = value.padEnd(CODE_LENGTH, " ").split("").slice(0, CODE_LENGTH);

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <View style={styles.row}>
        {chars.map((char, index) => (
          <View
            key={index}
            style={[styles.box, index === value.length && styles.boxActive]}
          >
            <TextInput editable={false} value={char.trim()} style={styles.boxText} />
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) =>
          onChange(text.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH))
        }
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus={autoFocus}
        maxLength={CODE_LENGTH}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    box: {
      width: 44,
      height: 52,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
    },
    boxActive: {
      borderColor: colors.accent,
    },
    boxText: {
      fontSize: 19,
      fontWeight: "700",
      color: colors.ink,
      textAlign: "center",
      padding: 0,
    },
    hiddenInput: {
      position: "absolute",
      opacity: 0,
      height: 1,
      width: 1,
    },
  });
