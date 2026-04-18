import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { createApiClient } from "@platform/sdk";
import type { ApiError, WorkoutSessionRecord } from "@platform/types";
import { ActionButton, Screen, SectionTitle, Surface } from "../../src/components/ui";
import { useSession } from "../../src/session";

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
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <ActionButton label="Back" onPress={() => router.back()} variant="secondary" />

        {workoutSession ? (
          <>
            <Surface>
              <SectionTitle
                eyebrow="Active workout"
                title={workoutSession.workoutTitle}
                subtitle={`Track each exercise and save your notes before finishing.`}
              />
              <Text style={{ color: "#607084" }}>
                {workoutSession.exercises.filter((exercise) => exercise.completed).length}/
                {workoutSession.exercises.length} exercises completed
              </Text>
            </Surface>

            {workoutSession.exercises.map((exercise) => (
              <Surface compact key={exercise.id}>
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
                        borderRadius: 999,
                        borderWidth: 2,
                        borderColor: exercise.completed ? "#87A8A4" : "#B5C0CF",
                        backgroundColor: exercise.completed ? "#87A8A4" : "transparent"
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: "700", color: "#122036" }}>
                        {exercise.sequence}. {exercise.name}
                      </Text>
                      {exercise.instruction ? (
                        <Text style={{ color: "#607084", marginTop: 4 }}>{exercise.instruction}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                  <TextInput
                    multiline
                    onChangeText={(value) => updateExerciseNote(exercise.id, value)}
                    placeholder="Optional exercise note"
                    placeholderTextColor="#8A94A6"
                    style={{
                      minHeight: 84,
                      borderRadius: 18,
                      padding: 14,
                      backgroundColor: "#FFFFFF",
                      borderWidth: 1,
                      borderColor: "rgba(18, 32, 54, 0.1)",
                      color: "#122036"
                    }}
                    value={exercise.notes ?? ""}
                  />
                </View>
              </Surface>
            ))}

            <Surface compact>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#122036", marginBottom: 12 }}>
                Session note
              </Text>
              <TextInput
                multiline
                onChangeText={setNotes}
                placeholder="How did this workout feel?"
                placeholderTextColor="#8A94A6"
                style={{
                  minHeight: 96,
                  borderRadius: 18,
                  padding: 14,
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "rgba(18, 32, 54, 0.1)",
                  color: "#122036"
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
          <Surface compact>
            <Text style={{ color: "#A94442" }}>{error}</Text>
          </Surface>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
