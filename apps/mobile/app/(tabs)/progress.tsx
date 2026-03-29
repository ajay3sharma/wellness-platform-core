import { ScrollView, Text, View } from "react-native";
import { progressHighlights } from "../../src/content";
import { Screen, SectionTitle, Surface } from "../../src/components/ui";

export default function ProgressScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <Surface>
          <SectionTitle
            eyebrow="Progress"
            title="Track the climb"
            subtitle="Your charts, streaks, and achievements can slot in here next."
          />
        </Surface>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {progressHighlights.map((item) => (
            <View
              key={item.label}
              style={{
                flexBasis: "48%",
                borderRadius: 22,
                padding: 16,
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "rgba(18, 32, 54, 0.08)"
              }}
            >
              <Text style={{ color: "#607084", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#122036", marginVertical: 6 }}>{item.value}</Text>
              <Text style={{ color: "#607084" }}>{item.detail}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

