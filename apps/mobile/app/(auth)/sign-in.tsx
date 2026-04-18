import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import type { ApiError } from "@platform/types";
import { ActionButton, Screen, TextField } from "../../src/components/ui";
import { mobileMetadata, mobileTheme } from "../../src/metadata";
import { useSession } from "../../src/session";

export default function SignInScreen() {
  const [email, setEmail] = useState("member@example.com");
  const [password, setPassword] = useState("dev-password");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useSession();

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
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
          <View
            style={{
              borderRadius: 32,
              padding: 22,
              backgroundColor: "#122036",
              overflow: "hidden",
              gap: 14
            }}
          >
            <View
              style={{
                position: "absolute",
                width: 140,
                height: 140,
                borderRadius: 999,
                backgroundColor: mobileTheme.colors.accent,
                opacity: 0.16,
                right: -28,
                top: -28
              }}
            />
            <Text style={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", letterSpacing: 1.5, fontSize: 11 }}>
              {mobileMetadata.appName}
            </Text>
            <Text style={{ color: "#FFFFFF", fontSize: 30, lineHeight: 36, fontWeight: "700", maxWidth: 260 }}>
              Sign in to continue your workout plan.
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.78)", lineHeight: 20 }}>
              Use your Phase 1 account to access workouts, assigned sessions, and history.
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
              {error ? (
                <Text style={{ color: "#FFD4D4", lineHeight: 20 }}>
                  {error}
                </Text>
              ) : null}
              <ActionButton disabled={submitting} label={submitting ? "Signing in..." : `Enter ${mobileMetadata.appName}`} onPress={() => void handleSignIn()} />
              <ActionButton
                label="Create account"
                onPress={() => router.push("/sign-up" as never)}
                variant="secondary"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
