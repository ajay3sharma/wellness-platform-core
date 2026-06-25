import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import type { ApiError } from "@platform/types";
import {
  ActionButton,
  Screen,
  StatusBanner,
  Surface,
  TextField,
  ThemeModeToggle
} from "../../src/components/ui";
import { mobileMetadata } from "../../src/metadata";
import { useSession } from "../../src/session";
import { useThemeMode } from "../../src/theme/theme-context";

export default function SignUpScreen() {
  const { registerUser } = useSession();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("dev-password");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { theme } = useThemeMode();

  async function handleRegister() {
    setSubmitting(true);
    setError(null);

    try {
      const result = await registerUser({
        displayName,
        email,
        password
      });

      if (!result.session) {
        setError(result.message);
        return;
      }

      router.replace("/(tabs)");
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen routeTheme="profile">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
          <View style={{ alignItems: "flex-start", marginBottom: 14 }}>
            <ThemeModeToggle />
          </View>
          <Surface routeTheme="profile">
            <Text
              style={{
                color: theme.colors.textMuted,
                fontSize: 13,
                fontWeight: "600"
              }}
            >
              {mobileMetadata.appName}
            </Text>
            <Text
              style={{
                color: theme.colors.textStrong,
                fontSize: 30,
                lineHeight: 35,
                fontWeight: "700",
                maxWidth: 280
              }}
            >
              Create your training account.
            </Text>
            <Text
              style={{
                color: theme.colors.textMuted,
                lineHeight: 21,
                maxWidth: 320
              }}
            >
              Create a member account for workouts, reset sessions, and progress tracking.
            </Text>

            <View style={{ gap: 12, marginTop: 8 }}>
              <TextField onChangeText={setDisplayName} placeholder="Display name" value={displayName} />
              <TextField
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="Email address"
                value={email}
              />
              <TextField
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                value={password}
              />
              {error ? <StatusBanner routeTheme="profile" tone="danger">{error}</StatusBanner> : null}
              <ActionButton
                disabled={submitting}
                label={submitting ? "Creating..." : "Create account"}
                onPress={() => void handleRegister()}
              />
              <ActionButton
                label="Back to sign in"
                onPress={() => router.push("/(auth)/sign-in")}
                variant="secondary"
              />
            </View>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
