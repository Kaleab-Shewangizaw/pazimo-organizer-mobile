import { useFonts } from "@expo-google-fonts/manrope";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LoadingScreen } from "@/components/LoadingScreen";
import { fontAssets } from "@/lib/fonts";
import { queryClient } from "@/lib/queryClient";
import { useResolvedScheme } from "@/lib/useColors";
import { useAuthStore } from "@/store/authStore";

// Held open until fonts are loaded and the session bootstrap (see
// authStore.bootstrap) resolves, so the native splash (white/near-black,
// following system appearance — see app.json's expo-splash-screen plugin)
// never drops to a blank frame before the first real screen is ready to draw.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const status = useAuthStore((s) => s.status);
  const role = useAuthStore((s) => s.user?.role);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const [fontsLoaded] = useFonts(fontAssets);
  const scheme = useResolvedScheme();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const isReady = status !== "checking" && fontsLoaded;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return <LoadingScreen />;
  }

  const isOrganizer = status === "signedIn" && role === "organizer";
  const isCashier = status === "signedIn" && role === "cinema";
  const isUsher = status === "signedIn" && role === "usher";
  const isUnsupportedRole =
    status === "signedIn" && !isOrganizer && !isCashier && !isUsher;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={status === "signedOut"}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>

          <Stack.Protected guard={isOrganizer}>
            <Stack.Screen name="organizer" />
          </Stack.Protected>

          <Stack.Protected guard={isCashier}>
            <Stack.Screen name="cashier" />
          </Stack.Protected>

          <Stack.Protected guard={isUsher}>
            <Stack.Screen name="usher" />
          </Stack.Protected>

          <Stack.Protected guard={isUnsupportedRole}>
            <Stack.Screen name="unsupported-role" />
          </Stack.Protected>
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
