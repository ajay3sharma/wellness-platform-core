import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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
  Screen,
  SectionTitle,
  Surface,
  TextField
} from "../../src/components/ui";
import { useSession } from "../../src/session";
import { formatDurationLabel, formatMinutesLabel, resolveDeviceTimeZone } from "../../src/wellness";

const resetNeeds: Array<ResetRecommendationNeed | ""> = ["", "calm", "focus", "sleep", "recovery"];

function ChoiceChip({
  label,
  selected,
  onPress
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: selected ? "#122036" : "#FFFFFF",
        borderWidth: 1,
        borderColor: selected ? "#122036" : "rgba(18, 32, 54, 0.12)"
      }}
    >
      <Text style={{ color: selected ? "#FFFFFF" : "#122036", fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

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
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
      >
        <Surface>
          <SectionTitle
            eyebrow="Reset"
            title="Wellness rituals"
            subtitle="Daily quote, panchang, guided relaxation, and music now come from the live API."
          />
          {snapshot ? (
            <Text style={{ color: "#607084" }}>
              Device day {snapshot.resolvedDate} • {snapshot.timeZone}
            </Text>
          ) : null}
          {error ? <Text style={{ color: "#A94442", marginTop: 8 }}>{error}</Text> : null}
        </Surface>

        <Surface>
          <SectionTitle
            eyebrow="AI recommendations"
            title="Get a faster reset suggestion"
            subtitle="AI only ranks the published relaxation and music already available in your app."
          />
          <Text style={{ color: "#607084", marginBottom: 12 }}>{formatQuotaCopy(quota)}</Text>
          {resetAvailability ? (
            <Text style={{ color: resetAvailability.status === "available" ? "#607084" : "#A94442" }}>
              {resetAvailability.message}
            </Text>
          ) : null}
          {recommendationError ? (
            <Text style={{ color: "#A94442", marginTop: 10 }}>{recommendationError}</Text>
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
              <Text style={{ color: "#607084", fontWeight: "700" }}>Need</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {resetNeeds.map((option) => (
                  <ChoiceChip
                    key={option || "any"}
                    label={option || "Any"}
                    onPress={() => setNeed(option)}
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
                <Surface compact>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#8A5B3A" }}>
                    AI relaxation pick
                  </Text>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#122036" }}>
                      {recommendationResult.relaxation.technique.title}
                    </Text>
                    <Text style={{ color: "#607084" }}>
                      {recommendationResult.relaxation.explanation}
                    </Text>
                    <Text style={{ color: "#607084" }}>
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
                <Surface compact>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#8A5B3A" }}>
                    AI music pick
                  </Text>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#122036" }}>
                      {recommendationResult.music.track.title}
                    </Text>
                    <Text style={{ color: "#607084" }}>{recommendationResult.music.explanation}</Text>
                    <Text style={{ color: "#607084" }}>
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
                <Surface compact>
                  <Text style={{ color: "#607084" }}>
                    AI could not find a strong reset match yet. Try a clearer intent or different
                    duration.
                  </Text>
                </Surface>
              ) : null}
            </View>
          ) : null}
        </Surface>

        <Surface>
          <SectionTitle
            eyebrow="Daily feed"
            title="Quote and panchang"
            subtitle="These entries follow the device timezone passed from the mobile app."
          />
          <View style={{ gap: 12 }}>
            <Surface compact>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#8A5B3A", textTransform: "uppercase" }}>
                Daily quote
              </Text>
              {snapshot?.quote ? (
                <View style={{ gap: 8, marginTop: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#122036" }}>
                    “{snapshot.quote.quoteText}”
                  </Text>
                  <Text style={{ color: "#607084" }}>{snapshot.quote.author ?? "Unknown author"}</Text>
                </View>
              ) : (
                <Text style={{ color: "#607084", marginTop: 8 }}>
                  No quote has been published for today yet.
                </Text>
              )}
            </Surface>

            <Surface compact>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#8A5B3A", textTransform: "uppercase" }}>
                Panchang
              </Text>
              {snapshot?.panchang ? (
                <View style={{ gap: 8, marginTop: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#122036" }}>
                    {snapshot.panchang.headline}
                  </Text>
                  <Text style={{ color: "#607084" }}>
                    {snapshot.panchang.tithi} • {snapshot.panchang.nakshatra}
                  </Text>
                  <Text style={{ color: "#607084" }}>
                    Sunrise {snapshot.panchang.sunriseTime} • Sunset {snapshot.panchang.sunsetTime}
                  </Text>
                  <Text style={{ color: "#607084" }}>{snapshot.panchang.focusText}</Text>
                  {snapshot.panchang.notes ? (
                    <Text style={{ color: "#607084" }}>{snapshot.panchang.notes}</Text>
                  ) : null}
                </View>
              ) : (
                <Text style={{ color: "#607084", marginTop: 8 }}>
                  No panchang entry has been published for today yet.
                </Text>
              )}
            </Surface>
          </View>
        </Surface>

        <Surface>
          <SectionTitle
            eyebrow="Relaxation"
            title="Guided reset techniques"
            subtitle="Each technique opens into a local step-by-step session."
          />
          <View style={{ gap: 12 }}>
            {relaxation.map((technique) => (
              <Surface compact key={technique.id}>
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#122036" }}>
                    {technique.title}
                  </Text>
                  <Text style={{ color: "#607084" }}>{technique.description}</Text>
                  <Text style={{ color: "#607084" }}>
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
              <Surface compact>
                <Text style={{ color: "#607084" }}>No relaxation techniques are published yet.</Text>
              </Surface>
            ) : null}
          </View>
        </Surface>

        <Surface>
          <SectionTitle
            eyebrow="Music"
            title="Ambient tracks"
            subtitle="Stream a published track inside the app with lightweight playback controls."
          />
          <View style={{ gap: 12 }}>
            {music.map((track) => (
              <Surface key={track.id} compact>
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#122036" }}>{track.title}</Text>
                  <Text style={{ color: "#607084" }}>{track.description}</Text>
                  <Text style={{ color: "#607084" }}>
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
              <Surface compact>
                <Text style={{ color: "#607084" }}>No music tracks are published yet.</Text>
              </Surface>
            ) : null}
          </View>
        </Surface>

        {loading ? (
          <Surface compact>
            <Text style={{ color: "#607084" }}>Loading wellness content...</Text>
          </Surface>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
