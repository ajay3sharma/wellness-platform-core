import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { createApiClient } from "@platform/sdk";
import type { ApiError, WorkoutSessionSummary } from "@platform/types";
import { Screen, SectionTitle, Surface } from "../../src/components/ui";
import { useSession } from "../../src/session";

export default function ProgressScreen() {
  const { session } = useSession();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );
  const [history, setHistory] = useState<WorkoutSessionSummary[]>([]);
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
        setHistory(await api.workoutSessions.listMine());
      } catch (unknownError) {
        const apiError = unknownError as ApiError;
        setError(apiError.message || "Unable to load workout history.");
      } finally {
        setLoading(false);
      }
    })();
  }, [api, session]);

  const completedSessions = history.filter((item) => item.status === "completed");

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <Surface>
          <SectionTitle
            eyebrow="Progress"
            title="Workout history"
            subtitle="Phase 1 keeps progress simple: completed sessions, exercise counts, and timestamps."
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <View
              style={{
                flexBasis: "48%",
                borderRadius: 22,
                padding: 16,
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "rgba(18, 32, 54, 0.08)"
              }}
            >
              <Text style={{ color: "#607084", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                Completed
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#122036", marginVertical: 6 }}>
                {completedSessions.length}
              </Text>
              <Text style={{ color: "#607084" }}>Finished workout sessions</Text>
            </View>
            <View
              style={{
                flexBasis: "48%",
                borderRadius: 22,
                padding: 16,
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "rgba(18, 32, 54, 0.08)"
              }}
            >
              <Text style={{ color: "#607084", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                In progress
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#122036", marginVertical: 6 }}>
                {history.length - completedSessions.length}
              </Text>
              <Text style={{ color: "#607084" }}>Sessions still open</Text>
            </View>
          </View>
        </Surface>

        {loading ? <Text style={{ color: "#607084" }}>Loading history...</Text> : null}
        {error ? <Text style={{ color: "#A94442" }}>{error}</Text> : null}

        {history.map((item) => (
          <Surface compact key={item.id}>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#122036" }}>{item.workoutTitle}</Text>
              <Text style={{ color: "#607084" }}>
                {item.completedExercises}/{item.totalExercises} exercises completed
              </Text>
              <Text style={{ color: "#607084" }}>
                Started {new Date(item.startedAt).toLocaleString()}
              </Text>
              {item.completedAt ? (
                <Text style={{ color: "#607084" }}>
                  Finished {new Date(item.completedAt).toLocaleString()}
                </Text>
              ) : null}
              <View
                style={{
                  alignSelf: "flex-start",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor:
                    item.status === "completed"
                      ? "rgba(47, 111, 87, 0.12)"
                      : "rgba(217, 125, 84, 0.16)"
                }}
              >
                <Text style={{ color: "#122036", fontWeight: "700" }}>{item.status}</Text>
              </View>
            </View>
          </Surface>
        ))}

        {!loading && history.length === 0 ? (
          <Surface compact>
            <Text style={{ color: "#607084" }}>
              No workout history yet. Start a session from the workouts tab to see progress here.
            </Text>
          </Surface>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
