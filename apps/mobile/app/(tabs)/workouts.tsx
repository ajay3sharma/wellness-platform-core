import { ScrollView, Text, View } from "react-native";
import { featuredWorkouts } from "../../src/content";
import { ActionButton, Screen, SectionTitle, Surface } from "../../src/components/ui";

export default function WorkoutsScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <Surface>
          <SectionTitle
            eyebrow="Workouts"
            title="Planned sessions"
            subtitle="This screen is ready for the real workout catalog and player."
          />
        </Surface>

        {featuredWorkouts.map((workout) => (
          <Surface key={workout.title} compact>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#122036" }}>{workout.title}</Text>
              <Text style={{ color: "#607084" }}>{workout.focus}</Text>
              <Text style={{ color: "#607084" }}>{workout.duration} • {workout.difficulty}</Text>
            </View>
            <View style={{ marginTop: 14 }}>
              <ActionButton label="Open workout" onPress={() => {}} />
            </View>
          </Surface>
        ))}
      </ScrollView>
    </Screen>
  );
}

