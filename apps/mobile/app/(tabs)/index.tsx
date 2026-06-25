import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { createApiClient } from "@platform/sdk";
import type { WorkoutListItem, WorkoutSessionSummary } from "@platform/types";
import { ContentCard } from "../../src/components/cards";
import {
  ActionButton,
  MetricCard,
  Screen,
  SectionTitle,
  Surface,
  ThemeModeToggle
} from "../../src/components/ui";
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
    <Screen routeTheme="home">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <Surface routeTheme="home">
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <SectionTitle
                eyebrow="Today"
                title={mobileMetadata.headline}
                subtitle={mobileMetadata.subheadline}
              />
            </View>
            <ThemeModeToggle />
          </View>
        </Surface>

        <Surface routeTheme="home">
          <SectionTitle
            eyebrow="Summary"
            title="Your activity"
            subtitle="A quick view of workouts, assignments, and completed sessions."
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <MetricCard label="Workouts" value={String(workouts.length)} hint="Available" routeTheme="workouts" />
            <MetricCard label="Assigned" value={String(assignedCount)} hint="From coach" routeTheme="reset" />
            <MetricCard label="Done" value={String(completedCount)} hint="Completed" routeTheme="progress" />
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

        <Surface routeTheme="workouts">
          <SectionTitle
            eyebrow="Next"
            title="Choose a workout"
            subtitle="Open a session when you are ready."
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

        <Surface routeTheme="reset">
          <SectionTitle
            eyebrow="Reset"
            title="Take a reset"
            subtitle="Use guided breathing, relaxation, and quiet music between training sessions."
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
