import { ActivityIndicator, StyleSheet, View } from "react-native";

import { accentAlt } from "@/lib/theme";
import { useColors } from "@/lib/useColors";

export function LoadingScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={accentAlt(colors)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
