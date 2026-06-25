import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { createApiClient } from "@platform/sdk";
import type { ApiError, WorkoutSessionRecord } from "@platform/types";
import { ActionButton, Screen, SectionTitle, Surface } from "../../src/components/ui";
import { useSession } from "../../src/session";
import { useThemeMode } from "../../src/theme/theme-context";

export default function WorkoutSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { session } = useSession();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );
  const [workoutSession, setWorkoutSession] = useState<WorkoutSessionRecord | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { theme } = useThemeMode();

  useEffect(() => {
    if (!session || !sessionId) {
      return;
    }

    void (async () => {
      try {
        setError(null);
        const detail = await api.workoutSessions.detail(sessionId);
        setWorkoutSession(detail);
        setNotes(detail.notes ?? "");
      } catch (unknownError) {
        const apiError = unknownError as ApiError;
        setError(apiError.message || "Unable to load workout session.");
      }
    })();
  }, [api, session, sessionId]);

  async function saveProgress() {
    if (!workoutSession) {
      return;
    }

    setSaving(true);

    try {
      const updated = await api.workoutSessions.update(workoutSession.id, {
        notes,
        exercises: workoutSession.exercises.map((exercise) => ({
          id: exercise.id,
          completed: exercise.completed,
          notes: exercise.notes
        }))
      });
      setWorkoutSession(updated);
      setNotes(updated.notes ?? "");
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to save progress.");
    } finally {
      setSaving(false);
    }
  }

  async function completeWorkout() {
    if (!workoutSession) {
      return;
    }

    setSaving(true);

    try {
      await api.workoutSessions.complete(workoutSession.id, {
        notes,
        exercises: workoutSession.exercises.map((exercise) => ({
          id: exercise.id,
          completed: true,
          notes: exercise.notes
        }))
      });
      router.replace("/(tabs)/progress");
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to complete workout.");
      setSaving(false);
    }
  }

  function toggleExercise(exerciseId: string) {
    setWorkoutSession((current) =>
      current
        ? {
            ...current,
            exercises: current.exercises.map((exercise) =>
              exercise.id === exerciseId ? { ...exercise, completed: !exercise.completed } : exercise
            )
          }
        : current
    );
  }

  function updateExerciseNote(exerciseId: string, value: string) {
    setWorkoutSession((current) =>
      current
        ? {
            ...current,
            exercises: current.exercises.map((exercise) =>
              exercise.id === exerciseId ? { ...exercise, notes: value } : exercise
            )
          }
        : current
    );
  }

  return (
    <Screen routeTheme="workouts">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <ActionButton label="Back" onPress={() => router.back()} variant="secondary" />

        {workoutSession ? (
          <>
            <Surface routeTheme="workouts">
              <SectionTitle
                eyebrow="Active workout"
                title={workoutSession.workoutTitle}
                subtitle={`Track each exercise and save your notes before finishing.`}
              />
              <Text style={{ color: theme.colors.textMuted }}>
                {workoutSession.exercises.filter((exercise) => exercise.completed).length}/
                {workoutSession.exercises.length} exercises completed
              </Text>
            </Surface>

            {workoutSession.exercises.map((exercise) => (
              <Surface compact key={exercise.id} routeTheme="workouts">
                <View style={{ gap: 10 }}>
                  <Pressable
                    onPress={() => toggleExercise(exercise.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: exercise.completed ? theme.colors.primaryStrong : theme.colors.borderStrong,
                        backgroundColor: exercise.completed ? theme.colors.primaryStrong : "transparent"
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: "700", color: theme.colors.textStrong }}>
                        {exercise.sequence}. {exercise.name}
                      </Text>
                      {exercise.instruction ? (
                        <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>{exercise.instruction}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                  <TextInput
                    multiline
                    onChangeText={(value) => updateExerciseNote(exercise.id, value)}
                    placeholder="Optional exercise note"
                    placeholderTextColor={theme.colors.textMuted}
                    style={{
                      minHeight: 84,
                      borderRadius: 10,
                      padding: 12,
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.borderSoft,
                      color: theme.colors.textStrong
                    }}
                    value={exercise.notes ?? ""}
                  />
                </View>
              </Surface>
            ))}

            <Surface compact routeTheme="workouts">
              <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.textStrong, marginBottom: 12 }}>
                Session note
              </Text>
              <TextInput
                multiline
                onChangeText={setNotes}
                placeholder="How did this workout feel?"
                placeholderTextColor={theme.colors.textMuted}
                style={{
                  minHeight: 96,
                  borderRadius: 10,
                  padding: 12,
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.borderSoft,
                  color: theme.colors.textStrong
                }}
                value={notes}
              />
            </Surface>

            <View style={{ gap: 10 }}>
              <ActionButton
                disabled={saving}
                label={saving ? "Saving..." : "Save progress"}
                onPress={() => void saveProgress()}
                variant="secondary"
              />
              <ActionButton
                disabled={saving}
                label={saving ? "Finishing..." : "Complete workout"}
                onPress={() => void completeWorkout()}
              />
            </View>
          </>
        ) : null}

        {error ? (
          <Surface compact routeTheme="workouts">
            <Text style={{ color: theme.colors.danger }}>{error}</Text>
          </Surface>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
