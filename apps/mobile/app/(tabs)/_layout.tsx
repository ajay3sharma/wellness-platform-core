import { Tabs } from "expo-router";
import { useThemeMode } from "../../src/theme/theme-context";

export default function TabsLayout() {
  const { theme, mode } = useThemeMode();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primaryStrong,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 12,
          backgroundColor: mode === "dark" ? theme.colors.surfaceGlass : "rgba(255, 255, 255, 0.92)",
          borderTopColor: theme.colors.borderSoft,
          borderTopWidth: 1,
          borderRadius: 28,
          height: theme.profile.navHeight + 8,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: "#000000",
          shadowOpacity: mode === "dark" ? 0.24 : 0.1,
          shadowRadius: 18,
          shadowOffset: { width: 4, height: 8 },
          elevation: 8
        },
        tabBarItemStyle: {
          borderRadius: 22,
          marginHorizontal: 2
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700"
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
