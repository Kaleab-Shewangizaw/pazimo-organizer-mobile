import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { TabBar } from "@/components/TabBar";
import { TabBarHeightProvider } from "@/components/TabBarHeightProvider";

export default function UsherTabsLayout() {
  return (
    <TabBarHeightProvider>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Events",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: "Scan",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "scan" : "scan-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: "Account",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </TabBarHeightProvider>
  );
}
