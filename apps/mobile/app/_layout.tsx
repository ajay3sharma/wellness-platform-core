import { Stack } from "expo-router";
import { SessionProvider } from "../src/session";
import { mobileMetadata } from "../src/metadata";
import { ThemeProvider, useThemeMode } from "../src/theme/theme-context";

function ThemedStack() {
  const { theme } = useThemeMode();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.canvas
        }
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: mobileMetadata.appName
        }}
      />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="checkout-return" />
      <Stack.Screen name="relaxation/[techniqueId]" />
      <Stack.Screen name="music/[trackId]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ThemedStack />
      </SessionProvider>
    </ThemeProvider>
  );
}
