import { Stack } from "expo-router";
import { SessionProvider } from "../src/session";
import { mobileMetadata, mobileTheme } from "../src/metadata";

export default function RootLayout() {
  return (
    <SessionProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: mobileTheme.colors.surface
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
        <Stack.Screen name="relaxation/[techniqueId]" />
        <Stack.Screen name="music/[trackId]" />
      </Stack>
    </SessionProvider>
  );
}
