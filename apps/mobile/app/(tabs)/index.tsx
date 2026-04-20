import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { createApiClient } from "@platform/sdk";
import type { WorkoutListItem, WorkoutSessionSummary } from "@platform/types";
import { AccentBanner, ContentCard } from "../../src/components/cards";
import { ActionButton, MetricCard, Screen, SectionTitle, Surface } from "../../src/components/ui";
import { mobileMetadata } from "../../src/metadata";
import { useSession } from "../../src/session";

export default function DashboardScreen() {
  const { session } = useSession();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [history, setHistory] = useState<WorkoutSessionSummary[]>([]);

  useEffect(() => {
    if (!session) {
      return;
    }

    void Promise.all([api.workouts.list(), api.workoutSessions.listMine()])
      .then(([nextWorkouts, nextHistory]) => {
        setWorkouts(nextWorkouts);
        setHistory(nextHistory);
      })
      .catch(() => undefined);
  }, [api, session]);

  const assignedCount = workouts.filter((workout) => workout.assignment).length;
  const completedCount = history.filter((item) => item.status === "completed").length;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <AccentBanner title={mobileMetadata.headline} subtitle={mobileMetadata.subheadline} />

        <Surface>
          <SectionTitle
            eyebrow="Today"
            title="Your live training and reset dashboard"
            subtitle="Published workouts, assigned sessions, recent completion history, and your reset tab all come from the current platform baseline."
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <MetricCard label="Published workouts" value={String(workouts.length)} hint="Current catalog count" />
            <MetricCard label="Assigned" value={String(assignedCount)} hint="Coach-assigned workouts" />
            <MetricCard label="Completed" value={String(completedCount)} hint="Finished workout sessions" />
          </View>
        </Surface>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <ActionButton label="Start workout" onPress={() => router.push("/(tabs)/workouts")} />
          </View>
          <View style={{ flex: 1 }}>
            <ActionButton
              label="View history"
              variant="secondary"
              onPress={() => router.push("/(tabs)/progress")}
            />
          </View>
        </View>

        <Surface>
          <SectionTitle
            eyebrow="Available now"
            title="Pick your next session"
            subtitle="Jump into a workout here, then use the reset tab for relaxation and music."
          />
          <View style={{ gap: 12 }}>
            {workouts.slice(0, 3).map((workout) => (
              <ContentCard
                key={workout.id}
                title={workout.title}
                meta={`${workout.durationMinutes} min • ${workout.difficulty}`}
                description={workout.assignment ? `Assigned by ${workout.assignment.coachDisplayName}` : workout.description}
              />
            ))}
          </View>
        </Surface>

        <Surface>
          <SectionTitle
            eyebrow="Reset"
            title="Wellness is live"
            subtitle="Daily quote, panchang, guided relaxation, and music now live inside the reset tab."
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <ActionButton label="Open reset tab" onPress={() => router.push("/(tabs)/reset")} />
            </View>
          </View>
        </Surface>
      </ScrollView>
    </Screen>
  );
}
