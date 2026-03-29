import { ScrollView, Text, View } from "react-native";
import { resetSessions } from "../../src/content";
import { ActionButton, Screen, SectionTitle, Surface } from "../../src/components/ui";

export default function ResetScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <Surface>
          <SectionTitle
            eyebrow="Reset"
            title="Recovery rituals"
            subtitle="Meditation, breathing, and audio are scaffolded here."
          />
        </Surface>

        {resetSessions.map((session) => (
          <Surface key={session.title} compact>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#122036" }}>{session.title}</Text>
              <Text style={{ color: "#607084" }}>{session.description}</Text>
              <Text style={{ color: "#607084" }}>{session.duration}</Text>
            </View>
            <View style={{ marginTop: 14 }}>
              <ActionButton label="Start session" onPress={() => {}} />
            </View>
          </Surface>
        ))}
      </ScrollView>
    </Screen>
  );
}

