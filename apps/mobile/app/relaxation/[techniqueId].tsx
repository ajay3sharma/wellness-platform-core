import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { createApiClient } from "@platform/sdk";
import type { ApiError, RelaxationTechniqueDetail } from "@platform/types";
import { ActionButton, Screen, SectionTitle, Surface } from "../../src/components/ui";
import { useSession } from "../../src/session";
import { formatClock, formatDurationLabel, formatMinutesLabel } from "../../src/wellness";

export default function RelaxationDetailScreen() {
  const { techniqueId } = useLocalSearchParams<{ techniqueId: string }>();
  const { session } = useSession();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );
  const [technique, setTechnique] = useState<RelaxationTechniqueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!session || !techniqueId) {
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await api.wellness.detailRelaxation(techniqueId);
        setTechnique(detail);
        setCurrentStepIndex(0);
        setRemainingSeconds(detail.steps[0]?.durationSeconds ?? 0);
        setHasStarted(false);
        setRunning(false);
        setCompleted(false);
      } catch (unknownError) {
        const apiError = unknownError as ApiError;
        setError(apiError.message || "Unable to load this relaxation technique.");
      } finally {
        setLoading(false);
      }
    })();
  }, [api, session, techniqueId]);

  const currentStep = technique?.steps[currentStepIndex] ?? null;

  useEffect(() => {
    if (!running || !technique || !currentStep) {
      return;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds((currentValue) => {
        if (currentValue > 1) {
          return currentValue - 1;
        }

        if (currentStepIndex >= technique.steps.length - 1) {
          setRunning(false);
          setCompleted(true);
          return 0;
        }

        const nextIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextIndex);
        return technique.steps[nextIndex].durationSeconds;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [currentStep, currentStepIndex, running, technique]);

  function beginSession() {
    if (!technique || technique.steps.length === 0) {
      return;
    }

    setCurrentStepIndex(0);
    setRemainingSeconds(technique.steps[0].durationSeconds);
    setHasStarted(true);
    setCompleted(false);
    setRunning(true);
  }

  function restartSession() {
    if (!technique || technique.steps.length === 0) {
      return;
    }

    setCurrentStepIndex(0);
    setRemainingSeconds(technique.steps[0].durationSeconds);
    setHasStarted(true);
    setCompleted(false);
    setRunning(false);
  }

  function moveToStep(direction: -1 | 1) {
    if (!technique || !currentStep) {
      return;
    }

    const nextIndex = currentStepIndex + direction;
    if (nextIndex < 0 || nextIndex >= technique.steps.length) {
      return;
    }

    setCurrentStepIndex(nextIndex);
    setRemainingSeconds(technique.steps[nextIndex].durationSeconds);
    setCompleted(false);
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <ActionButton label="Back to reset" onPress={() => router.back()} variant="secondary" />

        {loading ? (
          <Surface compact>
            <Text style={{ color: "#607084" }}>Loading technique...</Text>
          </Surface>
        ) : null}

        {technique ? (
          <>
            <Surface>
              <SectionTitle
                eyebrow="Relaxation"
                title={technique.title}
                subtitle={`${formatMinutesLabel(technique.estimatedDurationMinutes)} • ${technique.steps.length} guided steps`}
              />
              <Text style={{ color: "#607084", lineHeight: 20 }}>{technique.description}</Text>
              {technique.category ? (
                <Text style={{ color: "#607084", marginTop: 10 }}>{technique.category}</Text>
              ) : null}
            </Surface>

            {currentStep ? (
              <Surface>
                <SectionTitle
                  eyebrow={completed ? "Complete" : "Current step"}
                  title={completed ? "Session finished" : `${currentStep.sequence}. ${currentStep.title}`}
                  subtitle={
                    completed
                      ? "You can restart the flow anytime."
                      : `${formatClock(remainingSeconds)} remaining • ${formatDurationLabel(currentStep.durationSeconds)} total`
                  }
                />
                {!completed ? (
                  <Text style={{ color: "#607084", lineHeight: 20 }}>{currentStep.instruction}</Text>
                ) : (
                  <Text style={{ color: "#607084", lineHeight: 20 }}>
                    This reset was completed locally on your device. Phase 2 keeps relaxation playback lightweight and does not save history yet.
                  </Text>
                )}
              </Surface>
            ) : null}

            <View style={{ gap: 10 }}>
              {!hasStarted ? (
                <ActionButton label="Start relaxation" onPress={beginSession} />
              ) : (
                <>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <ActionButton
                        label={running ? "Pause" : completed ? "Resume from start" : "Resume"}
                        onPress={() => {
                          if (completed) {
                            beginSession();
                            return;
                          }

                          setRunning((currentValue) => !currentValue);
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ActionButton label="Restart" onPress={restartSession} variant="secondary" />
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <ActionButton
                        label="Previous"
                        onPress={() => moveToStep(-1)}
                        variant="secondary"
                        disabled={currentStepIndex === 0}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ActionButton
                        label="Next"
                        onPress={() => moveToStep(1)}
                        variant="secondary"
                        disabled={!technique || currentStepIndex >= technique.steps.length - 1}
                      />
                    </View>
                  </View>
                </>
              )}
            </View>

            <Surface compact>
              <SectionTitle
                eyebrow="Step map"
                title="Guided sequence"
                subtitle="Use previous and next to move through the technique manually."
              />
              <View style={{ gap: 10 }}>
                {technique.steps.map((step, index) => (
                  <View
                    key={step.id}
                    style={{
                      borderRadius: 18,
                      padding: 14,
                      backgroundColor:
                        index === currentStepIndex
                          ? "rgba(135, 168, 164, 0.18)"
                          : "rgba(255, 255, 255, 0.72)"
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#122036" }}>
                      {step.sequence}. {step.title}
                    </Text>
                    <Text style={{ color: "#607084", marginTop: 4 }}>{step.instruction}</Text>
                    <Text style={{ color: "#607084", marginTop: 4 }}>
                      {formatDurationLabel(step.durationSeconds)}
                    </Text>
                  </View>
                ))}
              </View>
            </Surface>
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
