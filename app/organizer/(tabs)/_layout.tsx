import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { TabBar } from "@/components/TabBar";
import { TabBarHeightProvider } from "@/components/TabBarHeightProvider";

export default function OrganizerTabsLayout() {
  return (
    <TabBarHeightProvider>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "grid" : "grid-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tickets"
          options={{
            title: "Tickets",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "ticket" : "ticket-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bar"
          options={{
            title: "Bar",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "wine" : "wine-outline"} size={size} color={color} />
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
