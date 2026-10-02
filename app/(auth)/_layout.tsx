import { Stack } from "expo-router";

import { useColors } from "@/lib/useColors";

export default function AuthLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { color: colors.ink },
        // Arrow only. iOS otherwise labels the back button with the previous
        // screen's title, and the welcome screen (index) has none since it
        // hides its header — so it read "index" next to the arrow.
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="organizer-login" options={{ title: "" }} />
      <Stack.Screen name="usher-login" options={{ title: "" }} />
      <Stack.Screen name="usher-signup" options={{ title: "Create usher account" }} />
      <Stack.Screen name="cashier-login" options={{ title: "" }} />
      <Stack.Screen name="verify-otp" options={{ title: "" }} />
      <Stack.Screen
        name="forgot-password"
        options={{ title: "Reset password" }}
      />
      {/* Not linked from anywhere right now (see README) — still routable
          directly if organizer self-signup comes back. */}
      <Stack.Screen
        name="organizer-signup"
        options={{ title: "Create organizer account" }}
      />
    </Stack>
  );
}
