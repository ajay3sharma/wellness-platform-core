import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { mobileMetadata, mobileTheme } from "../src/metadata";
import { useSession } from "../src/session";

export default function EntryRoute() {
  const { status } = useSession();

  if (status === "booting") {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: mobileTheme.colors.surface
        }}
      >
        <ActivityIndicator color={mobileTheme.colors.primary} />
        <Text style={{ marginTop: 12, color: "#526173" }}>{mobileMetadata.appName}</Text>
      </View>
    );
  }

  return <Redirect href={status === "signed-in" ? "/(tabs)" : "/(auth)/sign-in"} />;
}

