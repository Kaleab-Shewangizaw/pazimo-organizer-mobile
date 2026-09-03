import { Stack } from "expo-router";

import { colors } from "@/lib/theme";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { color: colors.ink },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="organizer-login" options={{ title: "" }} />
      <Stack.Screen name="usher-login" options={{ title: "" }} />
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
