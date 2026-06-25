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

export default function SignInScreen() {
  const [email, setEmail] = useState("member@example.com");
  const [password, setPassword] = useState("dev-password");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useSession();
  const { theme } = useThemeMode();

  async function handleSignIn() {
    setSubmitting(true);
    setError(null);

    try {
      await signIn({ email, password });
      router.replace("/(tabs)");
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to sign in right now.");
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
              Sign in to continue your workout plan.
            </Text>
            <Text
              style={{
                color: theme.colors.textMuted,
                lineHeight: 21,
                maxWidth: 300
              }}
            >
              Access your workouts, assigned sessions, and history.
            </Text>

            <View style={{ gap: 12, marginTop: 8 }}>
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
                label={submitting ? "Signing in..." : `Enter ${mobileMetadata.appName}`}
                onPress={() => void handleSignIn()}
              />
              <ActionButton
                label="Create account"
                onPress={() => router.push("/sign-up" as never)}
                variant="secondary"
              />
            </View>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
