import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text } from "react-native";
import { Screen, Surface } from "../src/components/ui";

export default function CheckoutReturnScreen() {
  const params = useLocalSearchParams<{
    status?: string;
    checkoutSessionId?: string;
  }>();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace({
        pathname: "/(tabs)/store",
        params: {
          checkoutStatus: params.status ?? "returned",
          checkoutSessionId: params.checkoutSessionId ?? ""
        }
      } as never);
    }, 500);

    return () => clearTimeout(timeout);
  }, [params.checkoutSessionId, params.status]);

  return (
    <Screen>
      <Surface>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#122036" }}>
          Returning to store
        </Text>
        <Text style={{ color: "#607084", marginTop: 8 }}>
          The app is syncing your latest checkout status now.
        </Text>
      </Surface>
    </Screen>
  );
}
