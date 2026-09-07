import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { ThemeColors } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
}

/** Standard screen chrome: safe area + keyboard avoidance + optional scroll. */
export function Screen({ children, scroll = true }: ScreenProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.flexContent}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    flexContent: {
      flex: 1,
      padding: 20,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 20,
    },
  });
