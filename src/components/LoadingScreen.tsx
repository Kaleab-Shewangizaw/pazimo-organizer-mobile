import { Image, StyleSheet, View } from "react-native";

import { useColors, useResolvedScheme } from "@/lib/useColors";

const LOGO_LIGHT = require("../../assets/partners-logo-light.png");
const LOGO_DARK = require("../../assets/partners-logo-dark.png");
// Same width as the native splash (app.json's expo-splash-screen imageWidth)
// and the same light/dark artwork, so in a release build the hand-off from
// the splash to this screen is invisible.
const LOGO_WIDTH = 220;
const LOGO_RATIO = { light: 1976 / 888, dark: 1972 / 888 };

/**
 * Shown by the root layout while fonts load and the stored session is
 * checked against the server. In a release build the native splash still
 * covers it; in Expo Go (which ignores the splash config) it's what you
 * actually see — so it's the logo, not a spinner. Screens with data to
 * wait on use their own skeletons (see ScreenSkeletons.tsx) instead.
 */
export function LoadingScreen() {
  const colors = useColors();
  const scheme = useResolvedScheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      accessible
      accessibilityLabel="Loading"
      accessibilityState={{ busy: true }}
    >
      <Image
        source={scheme === "dark" ? LOGO_DARK : LOGO_LIGHT}
        resizeMode="contain"
        style={{ width: LOGO_WIDTH, height: LOGO_WIDTH / LOGO_RATIO[scheme] }}
      />
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
