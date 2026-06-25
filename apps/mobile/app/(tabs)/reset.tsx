import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { createApiClient } from "@platform/sdk";
import type {
  ApiError,
  MusicTrackListItem,
  RelaxationTechniqueListItem,
  ResetRecommendationNeed,
  ResetRecommendationResponse,
  TodayWellnessSnapshot,
  UserAiQuotaStatus
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
import { formatDurationLabel, formatMinutesLabel, resolveDeviceTimeZone } from "../../src/wellness";

const resetNeeds: Array<ResetRecommendationNeed | ""> = ["", "calm", "focus", "sleep", "recovery"];

function formatQuotaCopy(quota: UserAiQuotaStatus | null) {
  if (!quota) {
    return "Loading AI quota and availability.";
  }

  return `${quota.remainingRequests} requests left today • ${quota.remainingTokens} tokens left • resets ${new Date(quota.resetAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })} UTC`;
}

export default function ResetScreen() {
  const { session } = useSession();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );
  const [snapshot, setSnapshot] = useState<TodayWellnessSnapshot | null>(null);
  const [relaxation, setRelaxation] = useState<RelaxationTechniqueListItem[]>([]);
  const [music, setMusic] = useState<MusicTrackListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<UserAiQuotaStatus | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationResult, setRecommendationResult] =
    useState<ResetRecommendationResponse | null>(null);
  const [intent, setIntent] = useState("");
  const [availableMinutes, setAvailableMinutes] = useState("10");
  const [need, setNeed] = useState<ResetRecommendationNeed | "">("");
  const { theme } = useThemeMode();

  useEffect(() => {
    if (!session) {
      return;
    }

    const timeZone = resolveDeviceTimeZone();

    void (async () => {
      try {
        setLoading(true);
        setError(null);

        const [dailyResult, relaxationResult, musicResult, quotaResult] = await Promise.allSettled([
          api.wellness.daily(timeZone),
          api.wellness.listRelaxation(),
          api.wellness.listMusic(),
          api.ai.quota()
        ]);

        if (dailyResult.status === "fulfilled") {
          setSnapshot(dailyResult.value);
        } else {
          throw dailyResult.reason;
        }

        if (relaxationResult.status === "fulfilled") {
          setRelaxation(relaxationResult.value);
        }

        if (musicResult.status === "fulfilled") {
          setMusic(musicResult.value);
        }

        if (quotaResult.status === "fulfilled") {
          setQuota(quotaResult.value);
        }
      } catch (unknownError) {
        const apiError = unknownError as ApiError;
        setError(apiError.message || "Unable to load wellness content.");
      } finally {
        setLoading(false);
      }
    })();
  }, [api, session]);

  const resetAvailability = quota?.features.user_reset_recommendation ?? null;
  const recommendationDisabled =
    recommendationLoading ||
    !intent.trim() ||
    !resetAvailability ||
    resetAvailability.status !== "available";

  async function generateRecommendations() {
    if (recommendationDisabled) {
      return;
    }

    try {
      setRecommendationLoading(true);
      setRecommendationError(null);

      const response = await api.ai.resetRecommendations({
        intent: intent.trim(),
        availableMinutes: Number(availableMinutes || "0"),
        need: need || null
      });

      setRecommendationResult(response);
      setQuota(response.quota);
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setRecommendationError(apiError.message || "Unable to generate reset recommendations.");
      setRecommendationResult(null);
    } finally {
      setRecommendationLoading(false);
    }
  }

  return (
    <Screen routeTheme="reset">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
      >
        <Surface routeTheme="reset">
          <SectionTitle
            eyebrow="Reset"
            title="Wellness rituals"
            subtitle="Daily guidance, relaxation, and music for recovery."
          />
          {snapshot ? (
            <Text style={{ color: theme.colors.textMuted }}>
              Device day {snapshot.resolvedDate} • {snapshot.timeZone}
            </Text>
          ) : null}
          {error ? <StatusBanner routeTheme="reset" tone="danger">{error}</StatusBanner> : null}
        </Surface>

        <Surface routeTheme="reset">
          <SectionTitle
            eyebrow="AI recommendations"
            title="Get a faster reset suggestion"
            subtitle="AI only ranks the published relaxation and music already available in your app."
          />
          <Text style={{ color: theme.colors.textMuted, marginBottom: 12 }}>{formatQuotaCopy(quota)}</Text>
          {resetAvailability ? (
            <StatusBanner
              routeTheme="reset"
              tone={resetAvailability.status === "available" ? "neutral" : "danger"}
            >
              {resetAvailability.message}
            </StatusBanner>
          ) : null}
          {recommendationError ? (
            <StatusBanner routeTheme="reset" tone="danger">
              {recommendationError}
            </StatusBanner>
          ) : null}
          <View style={{ gap: 12, marginTop: 14 }}>
            <TextField
              onChangeText={setIntent}
              placeholder="How do you want to feel, like calmer, clearer, or ready for sleep?"
              value={intent}
            />
            <TextField
              keyboardType="numeric"
              onChangeText={setAvailableMinutes}
              placeholder="Available minutes"
              value={availableMinutes}
            />
            <View style={{ gap: 8 }}>
              <Text style={{ color: theme.colors.textMuted, fontWeight: "700" }}>Need</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {resetNeeds.map((option) => (
                  <ChoiceChip
                    key={option || "any"}
                    label={option || "Any"}
                    onPress={() => setNeed(option)}
                    routeTheme="reset"
                    selected={need === option}
                  />
                ))}
              </View>
            </View>
            <View style={{ gap: 10 }}>
              <ActionButton
                disabled={recommendationDisabled}
                label={recommendationLoading ? "Generating..." : "Recommend a reset"}
                onPress={() => void generateRecommendations()}
              />
              <ActionButton
                label="Clear AI inputs"
                onPress={() => {
                  setIntent("");
                  setAvailableMinutes("10");
                  setNeed("");
                  setRecommendationError(null);
                  setRecommendationResult(null);
                }}
                variant="secondary"
              />
            </View>
          </View>

          {recommendationResult ? (
            <View style={{ gap: 12, marginTop: 16 }}>
              {recommendationResult.relaxation ? (
                <Surface compact routeTheme="reset">
                  <Badge label="AI relaxation pick" routeTheme="reset" tone="accent" />
                  <View style={{ gap: 8, marginTop: 8 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.textStrong }}>
                      {recommendationResult.relaxation.technique.title}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted }}>
                      {recommendationResult.relaxation.explanation}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted }}>
                      {formatMinutesLabel(
                        recommendationResult.relaxation.technique.estimatedDurationMinutes
                      )}
                    </Text>
                  </View>
                  <View style={{ marginTop: 14 }}>
                    <ActionButton
                      label="Open technique"
                      onPress={() =>
                        router.push({
                          pathname: "/relaxation/[techniqueId]",
                          params: {
                            techniqueId: recommendationResult.relaxation?.techniqueId ?? ""
                          }
                        } as never)
                      }
                    />
                  </View>
                </Surface>
              ) : null}

              {recommendationResult.music ? (
                <Surface compact routeTheme="reset">
                  <Badge label="AI music pick" routeTheme="reset" tone="accent" />
                  <View style={{ gap: 8, marginTop: 8 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.textStrong }}>
                      {recommendationResult.music.track.title}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted }}>{recommendationResult.music.explanation}</Text>
                    <Text style={{ color: theme.colors.textMuted }}>
                      {recommendationResult.music.track.artistName} •{" "}
                      {formatDurationLabel(recommendationResult.music.track.durationSeconds)}
                    </Text>
                  </View>
                  <View style={{ marginTop: 14 }}>
                    <ActionButton
                      label="Open player"
                      onPress={() =>
                        router.push({
                          pathname: "/music/[trackId]",
                          params: { trackId: recommendationResult.music?.trackId ?? "" }
                        } as never)
                      }
                    />
                  </View>
                </Surface>
              ) : null}

              {!recommendationResult.relaxation && !recommendationResult.music ? (
                <EmptyState
                  title="No strong reset match yet"
                  description="Try a clearer intent or a different duration and ask again."
                />
              ) : null}
            </View>
          ) : null}
        </Surface>

        <Surface routeTheme="reset">
          <SectionTitle
            eyebrow="Daily feed"
            title="Quote and panchang"
            subtitle="These entries follow the device timezone passed from the mobile app."
          />
          <View style={{ gap: 12 }}>
            <Surface compact routeTheme="reset">
              <Badge label="Daily quote" routeTheme="reset" tone="accent" />
              {snapshot?.quote ? (
                <View style={{ gap: 8, marginTop: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.textStrong }}>
                    “{snapshot.quote.quoteText}”
                  </Text>
                  <Text style={{ color: theme.colors.textMuted }}>{snapshot.quote.author ?? "Unknown author"}</Text>
                </View>
              ) : (
                <Text style={{ color: theme.colors.textMuted, marginTop: 8 }}>
                  No quote has been published for today yet.
                </Text>
              )}
            </Surface>

            <Surface compact routeTheme="reset">
              <Badge label="Panchang" routeTheme="reset" tone="accent" />
              {snapshot?.panchang ? (
                <View style={{ gap: 8, marginTop: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.textStrong }}>
                    {snapshot.panchang.headline}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted }}>
                    {snapshot.panchang.tithi} • {snapshot.panchang.nakshatra}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted }}>
                    Sunrise {snapshot.panchang.sunriseTime} • Sunset {snapshot.panchang.sunsetTime}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted }}>{snapshot.panchang.focusText}</Text>
                  {snapshot.panchang.notes ? (
                    <Text style={{ color: theme.colors.textMuted }}>{snapshot.panchang.notes}</Text>
                  ) : null}
                </View>
              ) : (
                <Text style={{ color: theme.colors.textMuted, marginTop: 8 }}>
                  No panchang entry has been published for today yet.
                </Text>
              )}
            </Surface>
          </View>
        </Surface>

        <Surface routeTheme="reset">
          <SectionTitle
            eyebrow="Relaxation"
            title="Guided reset techniques"
            subtitle="Each technique opens into a local step-by-step session."
          />
          <View style={{ gap: 12 }}>
            {relaxation.map((technique) => (
              <Surface compact key={technique.id} routeTheme="reset">
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.textStrong }}>
                    {technique.title}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted }}>{technique.description}</Text>
                  <Text style={{ color: theme.colors.textMuted }}>
                    {formatMinutesLabel(technique.estimatedDurationMinutes)}
                    {technique.category ? ` • ${technique.category}` : ""}
                  </Text>
                </View>
                <View style={{ marginTop: 14 }}>
                  <ActionButton
                    label="Open technique"
                    onPress={() =>
                      router.push({
                        pathname: "/relaxation/[techniqueId]",
                        params: { techniqueId: technique.id }
                      } as never)
                    }
                  />
                </View>
              </Surface>
            ))}
            {!loading && relaxation.length === 0 ? (
              <EmptyState
                title="No relaxation techniques yet"
                description="Nothing is published for this section right now."
              />
            ) : null}
          </View>
        </Surface>

        <Surface routeTheme="reset">
          <SectionTitle
            eyebrow="Music"
            title="Ambient tracks"
            subtitle="Stream a published track inside the app with lightweight playback controls."
          />
          <View style={{ gap: 12 }}>
            {music.map((track) => (
              <Surface key={track.id} compact routeTheme="reset">
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.textStrong }}>{track.title}</Text>
                  <Text style={{ color: theme.colors.textMuted }}>{track.description}</Text>
                  <Text style={{ color: theme.colors.textMuted }}>
                    {track.artistName} • {formatDurationLabel(track.durationSeconds)}
                  </Text>
                </View>
                <View style={{ marginTop: 14 }}>
                  <ActionButton
                    label="Open player"
                    onPress={() =>
                      router.push({
                        pathname: "/music/[trackId]",
                        params: { trackId: track.id }
                      } as never)
                    }
                  />
                </View>
              </Surface>
            ))}
            {!loading && music.length === 0 ? (
              <EmptyState
                title="No music tracks yet"
                description="Nothing is published for this section right now."
              />
            ) : null}
          </View>
        </Surface>

        {loading ? (
          <StatusBanner routeTheme="reset">Loading wellness content...</StatusBanner>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
