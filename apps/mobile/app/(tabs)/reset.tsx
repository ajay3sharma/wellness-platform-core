import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { createApiClient } from "@platform/sdk";
import type {
  ApiError,
  MusicTrackListItem,
  RelaxationTechniqueListItem,
  TodayWellnessSnapshot
} from "@platform/types";
import { ActionButton, Screen, SectionTitle, Surface } from "../../src/components/ui";
import { useSession } from "../../src/session";
import { formatDurationLabel, formatMinutesLabel, resolveDeviceTimeZone } from "../../src/wellness";

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

  useEffect(() => {
    if (!session) {
      return;
    }

    const timeZone = resolveDeviceTimeZone();

    void (async () => {
      try {
        setLoading(true);
        setError(null);

        const [dailySnapshot, relaxationTechniques, musicTracks] = await Promise.all([
          api.wellness.daily(timeZone),
          api.wellness.listRelaxation(),
          api.wellness.listMusic()
        ]);

        setSnapshot(dailySnapshot);
        setRelaxation(relaxationTechniques);
        setMusic(musicTracks);
      } catch (unknownError) {
        const apiError = unknownError as ApiError;
        setError(apiError.message || "Unable to load wellness content.");
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
                <Text style={{ color: "#607084" }}>
                  No relaxation techniques are published yet.
                </Text>
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
                <Text style={{ color: "#607084" }}>
                  No music tracks are published yet.
                </Text>
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
