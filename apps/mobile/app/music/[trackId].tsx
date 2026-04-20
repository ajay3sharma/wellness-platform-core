import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { createApiClient } from "@platform/sdk";
import type { ApiError, MusicTrackDetail } from "@platform/types";
import { ActionButton, Screen, SectionTitle, Surface } from "../../src/components/ui";
import { useSession } from "../../src/session";
import { formatClock, formatDurationLabel } from "../../src/wellness";

export default function MusicTrackScreen() {
  const { trackId } = useLocalSearchParams<{ trackId: string }>();
  const { session } = useSession();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );
  const [track, setTrack] = useState<MusicTrackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const player = useAudioPlayer(track?.audioUrl ?? null, {
    updateInterval: 500
  });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (!session || !trackId) {
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        setError(null);
        setTrack(await api.wellness.detailMusic(trackId));
      } catch (unknownError) {
        const apiError = unknownError as ApiError;
        setError(apiError.message || "Unable to load this music track.");
      } finally {
        setLoading(false);
      }
    })();
  }, [api, session, trackId]);

  useEffect(() => {
    if (!track || loading) {
      return;
    }

    if (!status.isLoaded && !status.isBuffering && status.reasonForWaitingToPlay) {
      setPlaybackError("This track could not be loaded from the provided audio URL.");
    }
  }, [loading, status.isBuffering, status.isLoaded, status.reasonForWaitingToPlay, track]);

  async function togglePlayback() {
    try {
      setPlaybackError(null);

      if (status.playing) {
        player.pause();
        return;
      }

      player.play();
    } catch {
      setPlaybackError("Unable to play this track right now.");
    }
  }

  async function stopPlayback() {
    try {
      setPlaybackError(null);
      player.pause();
      player.seekTo(0);
    } catch {
      setPlaybackError("Unable to stop this track cleanly.");
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <ActionButton label="Back to reset" onPress={() => router.back()} variant="secondary" />

        {loading ? (
          <Surface compact>
            <Text style={{ color: "#607084" }}>Loading track...</Text>
          </Surface>
        ) : null}

        {track ? (
          <>
            <Surface>
              <SectionTitle
                eyebrow="Music"
                title={track.title}
                subtitle={`${track.artistName} • ${formatDurationLabel(track.durationSeconds)}`}
              />
              <Text style={{ color: "#607084", lineHeight: 20 }}>{track.description}</Text>
              {track.category ? (
                <Text style={{ color: "#607084", marginTop: 10 }}>{track.category}</Text>
              ) : null}
            </Surface>

            <Surface>
              <SectionTitle
                eyebrow="Player"
                title={status.playing ? "Now playing" : "Ready to play"}
                subtitle="Phase 2 keeps playback simple: play, pause, stop, and progress display."
              />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                <View
                  style={{
                    flexBasis: "48%",
                    borderRadius: 20,
                    padding: 14,
                    backgroundColor: "#FFFFFF",
                    borderWidth: 1,
                    borderColor: "rgba(18, 32, 54, 0.08)"
                  }}
                >
                  <Text style={{ color: "#607084", fontSize: 12, textTransform: "uppercase" }}>
                    Position
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: "700", color: "#122036", marginTop: 6 }}>
                    {formatClock(Math.round(status.currentTime ?? 0))}
                  </Text>
                </View>
                <View
                  style={{
                    flexBasis: "48%",
                    borderRadius: 20,
                    padding: 14,
                    backgroundColor: "#FFFFFF",
                    borderWidth: 1,
                    borderColor: "rgba(18, 32, 54, 0.08)"
                  }}
                >
                  <Text style={{ color: "#607084", fontSize: 12, textTransform: "uppercase" }}>
                    Duration
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: "700", color: "#122036", marginTop: 6 }}>
                    {formatClock(Math.round(status.duration || track.durationSeconds))}
                  </Text>
                </View>
              </View>

              <View style={{ gap: 10, marginTop: 16 }}>
                <ActionButton
                  label={status.playing ? "Pause" : "Play"}
                  onPress={() => void togglePlayback()}
                />
                <ActionButton label="Stop" onPress={() => void stopPlayback()} variant="secondary" />
              </View>
            </Surface>
          </>
        ) : null}

        {playbackError ? (
          <Surface compact>
            <Text style={{ color: "#A94442" }}>{playbackError}</Text>
          </Surface>
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
