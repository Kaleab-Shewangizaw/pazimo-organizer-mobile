import type { ReactNode } from "react";
import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAvoider, keyboardScrollProps } from "@/components/KeyboardAvoider";

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
    <ScrollView {...keyboardScrollProps} contentContainerStyle={styles.scrollContent}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.flexContent}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoider style={styles.flex} ios={!scroll}>
        {content}
      </KeyboardAvoider>
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
