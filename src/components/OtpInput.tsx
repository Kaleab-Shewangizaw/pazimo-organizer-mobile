import { useRef } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { colors } from "@/lib/theme";

const CODE_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

/**
 * A single hidden TextInput driving a row of visible digit boxes — simpler
 * and less fragile than wiring focus management across N separate inputs.
 */
export function OtpInput({ value, onChange, autoFocus }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(CODE_LENGTH, " ").split("").slice(0, CODE_LENGTH);

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <View style={styles.row}>
        {digits.map((digit, index) => (
          <View
            key={index}
            style={[
              styles.box,
              index === value.length && styles.boxActive,
            ]}
          >
            <TextInput
              editable={false}
              value={digit.trim()}
              style={styles.boxText}
            />
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH))}
        keyboardType="number-pad"
        autoFocus={autoFocus}
        maxLength={CODE_LENGTH}
        style={styles.hiddenInput}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  box: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  boxActive: {
    borderColor: colors.navy,
  },
  boxText: {
    fontSize: 20,
    fontWeight: "600",
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
