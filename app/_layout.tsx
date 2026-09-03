import { useFonts } from "@expo-google-fonts/manrope";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LoadingScreen } from "@/components/LoadingScreen";
import { fontAssets } from "@/lib/fonts";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";

export default function RootLayout() {
  const status = useAuthStore((s) => s.status);
  const role = useAuthStore((s) => s.user?.role) as string | undefined;
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const [fontsLoaded] = useFonts(fontAssets);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (status === "checking" || !fontsLoaded) {
    return <LoadingScreen />;
  }

  const isOrganizer = status === "signedIn" && role === "organizer";
  // "usher" is not a role the backend issues today — see README
  // "Backend limitations". This branch stays wired so the moment the
  // backend adds it, the app routes there with no further changes.
  const isUsher = status === "signedIn" && role === "usher";
  const isUnsupportedRole = status === "signedIn" && !isOrganizer && !isUsher;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={status === "signedOut"}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>

          <Stack.Protected guard={isOrganizer}>
            <Stack.Screen name="organizer" />
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
