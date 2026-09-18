import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { TabBar } from "@/components/TabBar";
import { TabBarHeightProvider } from "@/components/TabBarHeightProvider";
import { useAuthStore } from "@/store/authStore";

export default function CashierTabsLayout() {
  const user = useAuthStore((s) => s.user);
  // Only the cinema business ITSELF (role "cinema") gets the money-bearing
  // tabs — Dashboard's finance tiles, Tickets' revenue, Bar's takings and
  // catalog. A real "cashier" account (cinema- or venue-scoped counter
  // staff) never sees sales data: it gets Scan (which already covers
  // admitting tickets and redeeming both cinema concessions and venue
  // drinks) plus its own Account. `href: null` removes a tab from the bar
  // while keeping the route itself intact — see index.tsx's redirect for
  // where a cashier actually lands.
  const isOwner = user?.role === "cinema";

  return (
    <TabBarHeightProvider>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            href: isOwner ? undefined : null,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "grid" : "grid-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tickets"
          options={{
            title: "Tickets",
            href: isOwner ? undefined : null,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "ticket" : "ticket-outline"} size={size} color={color} />
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
          name="bar"
          options={{
            title: "Bar",
            href: isOwner ? undefined : null,
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
