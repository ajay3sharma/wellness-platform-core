import { ScrollView, View } from "react-native";
import { featuredWorkouts, dashboardMetrics } from "../../src/content";
import { AccentBanner, ContentCard } from "../../src/components/cards";
import { ActionButton, MetricCard, Screen, SectionTitle, Surface } from "../../src/components/ui";
import { mobileMetadata } from "../../src/metadata";
import { router } from "expo-router";

export default function DashboardScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <AccentBanner
          title={mobileMetadata.headline}
          subtitle={mobileMetadata.subheadline}
        />

        <Surface>
          <SectionTitle
            eyebrow="Today"
            title="A clean daily rhythm"
            subtitle="Start with movement, add a reset, and keep the streak alive."
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {dashboardMetrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </View>
        </Surface>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <ActionButton label="Start workout" onPress={() => router.push("/(tabs)/workouts")} />
          </View>
          <View style={{ flex: 1 }}>
            <ActionButton label="Reset now" variant="secondary" onPress={() => router.push("/(tabs)/reset")} />
          </View>
        </View>

        <Surface>
          <SectionTitle
            eyebrow="Featured"
            title="Pick your next session"
            subtitle="These are scaffolded placeholders for the later workout engine."
          />
          <View style={{ gap: 12 }}>
            {featuredWorkouts.map((workout) => (
              <ContentCard
                key={workout.title}
                title={workout.title}
                meta={`${workout.duration} • ${workout.difficulty}`}
                description={workout.focus}
              />
            ))}
          </View>
        </Surface>
      </ScrollView>
    </Screen>
  );
}
