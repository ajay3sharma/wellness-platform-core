import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { createApiClient } from "@platform/sdk";
import type { ApiError, WorkoutListItem } from "@platform/types";
import { ActionButton, Screen, SectionTitle, Surface } from "../../src/components/ui";
import { useSession } from "../../src/session";

export default function WorkoutsScreen() {
  const { session } = useSession();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        setError(null);
        setWorkouts(await api.workouts.list());
      } catch (unknownError) {
        const apiError = unknownError as ApiError;
        setError(apiError.message || "Unable to load workouts.");
      } finally {
        setLoading(false);
      }
    })();
  }, [api, session]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <Surface>
          <SectionTitle
            eyebrow="Workouts"
            title="Published sessions"
            subtitle="Browse the live catalog, including workouts assigned by your coach."
          />
          {error ? <Text style={{ color: "#A94442" }}>{error}</Text> : null}
        </Surface>

        {loading ? <Text style={{ color: "#607084" }}>Loading workouts...</Text> : null}

        {workouts.map((workout) => (
          <Surface key={workout.id} compact>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#122036" }}>{workout.title}</Text>
              <Text style={{ color: "#607084" }}>{workout.description}</Text>
              <Text style={{ color: "#607084" }}>
                {workout.durationMinutes} min • {workout.difficulty}
              </Text>
              {workout.assignment ? (
                <View
                  style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: "rgba(135, 168, 164, 0.18)"
                  }}
                >
                  <Text style={{ color: "#122036", fontWeight: "700" }}>
                    Assigned by {workout.assignment.coachDisplayName}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={{ marginTop: 14 }}>
              <ActionButton
                label="Open workout"
                onPress={() =>
                  router.push({
                    pathname: "/workouts/[workoutId]",
                    params: { workoutId: workout.id }
                  } as never)
                }
              />
            </View>
          </Surface>
        ))}

        {!loading && workouts.length === 0 ? (
          <Surface compact>
            <Text style={{ color: "#607084" }}>
              No published workouts are available yet. Ask your admin or coach to publish the first session.
            </Text>
          </Surface>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
