import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { createApiClient } from "@platform/sdk";
import type { ApiError, WorkoutDetail } from "@platform/types";
import { ActionButton, Screen, SectionTitle, Surface } from "../../src/components/ui";
import { useSession } from "../../src/session";

export default function WorkoutDetailScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const { session } = useSession();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!session || !workoutId) {
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        setError(null);
        setWorkout(await api.workouts.detail(workoutId));
      } catch (unknownError) {
        const apiError = unknownError as ApiError;
        setError(apiError.message || "Unable to load workout details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [api, session, workoutId]);

  async function startWorkout() {
    if (!workout) {
      return;
    }

    setStarting(true);

    try {
      const nextSession = await api.workoutSessions.start({
        workoutId: workout.id
      });
      router.replace({
        pathname: "/workout-sessions/[sessionId]",
        params: { sessionId: nextSession.id }
      } as never);
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to start workout.");
      setStarting(false);
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <ActionButton label="Back to workouts" onPress={() => router.back()} variant="secondary" />

        {loading ? (
          <Surface compact>
            <Text style={{ color: "#607084" }}>Loading workout...</Text>
          </Surface>
        ) : null}

        {workout ? (
          <>
            <Surface>
              <SectionTitle
                eyebrow="Workout detail"
                title={workout.title}
                subtitle={`${workout.durationMinutes} min • ${workout.difficulty}`}
              />
              <Text style={{ color: "#607084", lineHeight: 20 }}>{workout.description}</Text>
              {workout.assignment ? (
                <View
                  style={{
                    marginTop: 14,
                    alignSelf: "flex-start",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: "rgba(135, 168, 164, 0.18)"
                  }}
                >
                  <Text style={{ fontWeight: "700", color: "#122036" }}>
                    Assigned by {workout.assignment.coachDisplayName}
                  </Text>
                </View>
              ) : null}
            </Surface>

            {workout.exercises.map((exercise) => (
              <Surface compact key={exercise.id}>
                <View style={{ gap: 6 }}>
                  <Text style={{ color: "#122036", fontSize: 18, fontWeight: "700" }}>
                    {exercise.sequence}. {exercise.name}
                  </Text>
                  {exercise.instruction ? <Text style={{ color: "#607084" }}>{exercise.instruction}</Text> : null}
                  <Text style={{ color: "#607084" }}>
                    {exercise.repTarget ?? "Open target"}
                    {exercise.timeTargetSeconds ? ` • ${exercise.timeTargetSeconds}s` : ""}
                    {exercise.distanceTargetMeters ? ` • ${exercise.distanceTargetMeters}m` : ""}
                    {exercise.restSeconds ? ` • Rest ${exercise.restSeconds}s` : ""}
                  </Text>
                </View>
              </Surface>
            ))}

            <ActionButton
              disabled={starting}
              label={starting ? "Starting..." : "Start workout"}
              onPress={() => void startWorkout()}
            />
          </>
        ) : null}

        {error ? (
          <Surface compact>
            <Text style={{ color: "#A94442" }}>{error}</Text>
          </Surface>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
