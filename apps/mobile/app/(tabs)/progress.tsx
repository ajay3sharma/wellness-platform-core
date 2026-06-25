import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { createApiClient } from "@platform/sdk";
import type { ApiError, WorkoutSessionSummary } from "@platform/types";
import { Screen, SectionTitle, Surface } from "../../src/components/ui";
import { useSession } from "../../src/session";
import { useThemeMode } from "../../src/theme/theme-context";

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
  const { theme } = useThemeMode();

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
    <Screen routeTheme="progress">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <Surface routeTheme="progress">
          <SectionTitle
            eyebrow="Progress"
            title="Workout history"
            subtitle="See completed sessions, exercise counts, and timestamps."
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <View
              style={{
                flexBasis: "48%",
                borderRadius: 12,
                padding: 14,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.borderSoft
              }}
            >
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" }}>
                Completed
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: theme.colors.textStrong, marginVertical: 6 }}>
                {completedSessions.length}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>Finished workout sessions</Text>
            </View>
            <View
              style={{
                flexBasis: "48%",
                borderRadius: 12,
                padding: 14,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.borderSoft
              }}
            >
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" }}>
                In progress
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: theme.colors.textStrong, marginVertical: 6 }}>
                {history.length - completedSessions.length}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>Sessions still open</Text>
            </View>
          </View>
        </Surface>

        {loading ? <Text style={{ color: theme.colors.textMuted }}>Loading history...</Text> : null}
        {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}

        {history.map((item) => (
          <Surface compact key={item.id} routeTheme="progress">
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.textStrong }}>{item.workoutTitle}</Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {item.completedExercises}/{item.totalExercises} exercises completed
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                Started {new Date(item.startedAt).toLocaleString()}
              </Text>
              {item.completedAt ? (
                <Text style={{ color: theme.colors.textMuted }}>
                  Finished {new Date(item.completedAt).toLocaleString()}
                </Text>
              ) : null}
              <View
                style={{
                  alignSelf: "flex-start",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor:
                    item.status === "completed"
                      ? `${theme.colors.success}18`
                      : `${theme.colors.warning}18`
                }}
              >
                <Text style={{ color: theme.colors.textStrong, fontWeight: "700" }}>{item.status}</Text>
              </View>
            </View>
          </Surface>
        ))}

        {!loading && history.length === 0 ? (
          <Surface compact routeTheme="progress">
            <Text style={{ color: theme.colors.textMuted }}>
              No workout history yet. Start a session from the workouts tab to see progress here.
            </Text>
          </Surface>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
