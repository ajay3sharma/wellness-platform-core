import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import type { ApiError } from "@platform/types";
import { ActionButton, Screen, TextField } from "../../src/components/ui";
import { mobileMetadata, mobileTheme } from "../../src/metadata";
import { useSession } from "../../src/session";

export default function SignUpScreen() {
  const { registerUser } = useSession();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("dev-password");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
              Create your training account.
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.78)", lineHeight: 20 }}>
              Public signup is open for users in Phase 1. Coach and admin access is requested through the admin portal.
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
              {error ? (
                <Text style={{ color: "#FFD4D4", lineHeight: 20 }}>
                  {error}
                </Text>
              ) : null}
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
