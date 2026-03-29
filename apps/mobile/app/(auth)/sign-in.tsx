import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { ActionButton, Screen, TextField } from "../../src/components/ui";
import { mobileMetadata, mobileTheme } from "../../src/metadata";
import { useSession } from "../../src/session";

export default function SignInScreen() {
  const [email, setEmail] = useState("ajay@example.com");
  const [password, setPassword] = useState("password");
  const { signIn } = useSession();

  async function handleSignIn() {
    await signIn({ email, password });
    router.replace("/(tabs)");
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
              Reset. Move. Recover.
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.78)", lineHeight: 20 }}>
              Sign in to continue to your workouts, resets, progress, and store.
            </Text>

            <View style={{ gap: 12, marginTop: 8 }}>
              <TextField value={email} onChangeText={setEmail} placeholder="Email address" autoCapitalize="none" keyboardType="email-address" />
              <TextField value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
              <ActionButton label={`Enter ${mobileMetadata.appName}`} onPress={handleSignIn} />
              <ActionButton label="Use demo session" variant="secondary" onPress={handleSignIn} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
