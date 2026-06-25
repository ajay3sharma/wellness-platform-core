import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { createApiClient } from "@platform/sdk";
import type {
  ApiError,
  UserAiQuotaStatus,
  WorkoutDifficulty,
  WorkoutRecommendationResponse,
  WorkoutListItem
} from "@platform/types";
import {
  ActionButton,
  Badge,
  ChoiceChip,
  EmptyState,
  Screen,
  SectionTitle,
  StatusBanner,
  Surface,
  TextField
} from "../../src/components/ui";
import { useSession } from "../../src/session";
import { useThemeMode } from "../../src/theme/theme-context";

const difficultyOptions: WorkoutDifficulty[] = ["beginner", "intermediate", "advanced"];

function formatQuotaCopy(quota: UserAiQuotaStatus | null) {
  if (!quota) {
    return "Loading AI quota and availability.";
  }

  return `${quota.remainingRequests} requests left today • ${quota.remainingTokens} tokens left • resets ${new Date(quota.resetAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })} UTC`;
}

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
  const [quota, setQuota] = useState<UserAiQuotaStatus | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationResult, setRecommendationResult] =
    useState<WorkoutRecommendationResponse | null>(null);
  const [goal, setGoal] = useState("");
  const [availableMinutes, setAvailableMinutes] = useState("20");
  const [preferredDifficulty, setPreferredDifficulty] = useState<WorkoutDifficulty>("beginner");
  const [focusTags, setFocusTags] = useState("");
  const { theme } = useThemeMode();

  useEffect(() => {
    if (!session) {
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        setError(null);

        const [workoutResult, quotaResult] = await Promise.allSettled([
          api.workouts.list(),
          api.ai.quota()
        ]);

        if (workoutResult.status === "fulfilled") {
          setWorkouts(workoutResult.value);
        } else {
          throw workoutResult.reason;
        }

        if (quotaResult.status === "fulfilled") {
          setQuota(quotaResult.value);
        }
      } catch (unknownError) {
        const apiError = unknownError as ApiError;
        setError(apiError.message || "Unable to load workouts.");
      } finally {
        setLoading(false);
      }
    })();
  }, [api, session]);

  const workoutAvailability = quota?.features.user_workout_recommendation ?? null;
  const recommendationDisabled =
    recommendationLoading ||
    !goal.trim() ||
    !workoutAvailability ||
    workoutAvailability.status !== "available";

  async function generateRecommendations() {
    if (recommendationDisabled) {
      return;
    }

    try {
      setRecommendationLoading(true);
      setRecommendationError(null);

      const response = await api.ai.workoutRecommendations({
        goal: goal.trim(),
        availableMinutes: Number(availableMinutes || "0"),
        preferredDifficulty,
        focusTags: focusTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      });

      setRecommendationResult(response);
      setQuota(response.quota);
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setRecommendationError(apiError.message || "Unable to generate workout recommendations.");
      setRecommendationResult(null);
    } finally {
      setRecommendationLoading(false);
    }
  }

  return (
    <Screen routeTheme="workouts">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
      >
        <Surface routeTheme="workouts">
          <SectionTitle
            eyebrow="Workouts"
            title="Published sessions"
            subtitle="Browse the live catalog, including workouts assigned by your coach."
          />
          {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
        </Surface>

        <Surface routeTheme="workouts">
          <SectionTitle
            eyebrow="AI recommendations"
            title="Find the best match faster"
            subtitle="AI only ranks the workouts already published in your library. It never creates new programs here."
          />
          <Text style={{ color: theme.colors.textMuted, marginBottom: 12 }}>{formatQuotaCopy(quota)}</Text>
          {workoutAvailability ? (
            <StatusBanner tone={workoutAvailability.status === "available" ? "neutral" : "danger"}>
              {workoutAvailability.message}
            </StatusBanner>
          ) : null}
          {recommendationError ? <StatusBanner tone="danger">{recommendationError}</StatusBanner> : null}
          <View style={{ gap: 12, marginTop: 14 }}>
            <TextField
              onChangeText={setGoal}
              placeholder="Goal, like build consistency, core strength, or better mobility"
              value={goal}
            />
            <TextField
              keyboardType="numeric"
              onChangeText={setAvailableMinutes}
              placeholder="Available minutes"
              value={availableMinutes}
            />
            <View style={{ gap: 8 }}>
              <Text style={{ color: theme.colors.textMuted, fontWeight: "700" }}>Preferred intensity</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {difficultyOptions.map((difficulty) => (
                  <ChoiceChip
                    key={difficulty}
                    label={difficulty}
                    onPress={() => setPreferredDifficulty(difficulty)}
                    routeTheme="workouts"
                    selected={preferredDifficulty === difficulty}
                  />
                ))}
              </View>
            </View>
            <TextField
              onChangeText={setFocusTags}
              placeholder="Optional tags, like recovery, posture, low impact"
              value={focusTags}
            />
            <View style={{ gap: 10 }}>
              <ActionButton
                disabled={recommendationDisabled}
                label={recommendationLoading ? "Generating..." : "Recommend workouts"}
                onPress={() => void generateRecommendations()}
              />
              <ActionButton
                label="Clear AI inputs"
                onPress={() => {
                  setGoal("");
                  setAvailableMinutes("20");
                  setPreferredDifficulty("beginner");
                  setFocusTags("");
                  setRecommendationError(null);
                  setRecommendationResult(null);
                }}
                variant="secondary"
              />
            </View>
          </View>

          {recommendationResult ? (
            <View style={{ gap: 12, marginTop: 16 }}>
              {recommendationResult.recommendations.length > 0 ? (
                recommendationResult.recommendations.map((recommendation) => (
                  <Surface compact key={recommendation.workoutId} routeTheme="workouts">
                    <View style={{ gap: 8 }}>
                      <Badge label="AI match" routeTheme="workouts" tone="accent" />
                      <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.textStrong }}>
                        {recommendation.workout.title}
                      </Text>
                      <Text style={{ color: theme.colors.textMuted }}>{recommendation.explanation}</Text>
                      <Text style={{ color: theme.colors.textMuted }}>
                        {recommendation.workout.durationMinutes} min •{" "}
                        {recommendation.workout.difficulty}
                      </Text>
                    </View>
                    <View style={{ marginTop: 14 }}>
                      <ActionButton
                        label="Open recommended workout"
                        onPress={() =>
                          router.push({
                            pathname: "/workouts/[workoutId]",
                            params: { workoutId: recommendation.workoutId }
                          } as never)
                        }
                      />
                    </View>
                  </Surface>
                ))
              ) : (
                <EmptyState
                  title="No strong match yet"
                  description="Try a clearer goal or a different duration and ask again."
                />
              )}
            </View>
          ) : null}
        </Surface>

        {loading ? <Text style={{ color: theme.colors.textMuted }}>Loading workouts...</Text> : null}

        {workouts.map((workout) => (
          <Surface key={workout.id} compact routeTheme="workouts">
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.textStrong }}>{workout.title}</Text>
              <Text style={{ color: theme.colors.textMuted }}>{workout.description}</Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {workout.durationMinutes} min • {workout.difficulty}
              </Text>
              {workout.assignment ? (
                <Badge
                  label={`Assigned by ${workout.assignment.coachDisplayName}`}
                  routeTheme="workouts"
                  tone="accent"
                />
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
          <EmptyState
            title="No workouts published yet"
            description="Ask your admin or coach to publish the first session."
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
