import { Tabs } from "expo-router";
import { mobileTheme } from "../../src/metadata";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: mobileTheme.colors.primary,
        tabBarInactiveTintColor: "#8A94A6",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "rgba(18, 32, 54, 0.08)",
          height: 62,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600"
        }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="workouts" options={{ title: "Workouts" }} />
      <Tabs.Screen name="reset" options={{ title: "Reset" }} />
      <Tabs.Screen name="progress" options={{ title: "Progress" }} />
      <Tabs.Screen name="store" options={{ title: "Store" }} />
    </Tabs>
  );
}
