import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { mobileMetadata } from "../src/metadata";
import { useSession } from "../src/session";
import { useThemeMode } from "../src/theme/theme-context";

export default function EntryRoute() {
  const { status } = useSession();
  const { theme } = useThemeMode();

  if (status === "booting") {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.surface
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={{ marginTop: 12, color: theme.colors.textMuted }}>{mobileMetadata.appName}</Text>
      </View>
    );
  }

  return <Redirect href={status === "signed-in" ? "/(tabs)" : "/(auth)/sign-in"} />;
}
