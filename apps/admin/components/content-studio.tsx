"use client";

import { createApiClient } from "@platform/sdk";
import type {
  ApiError,
  DailyPanchangRecord,
  DailyQuoteRecord,
  MusicTrackListItem,
  RelaxationTechniqueListItem,
  SaveWorkoutRequest,
  WorkoutDifficulty,
  WorkoutListItem
} from "@platform/types";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAdminSession } from "../lib/session";
import { SectionCard } from "./section-card";

type ContentSection = "workouts" | "relaxation" | "music" | "quotes" | "panchang";
type WorkoutExerciseForm = SaveWorkoutRequest["exercises"][number];

interface WorkoutFormState {
  title: string;
  description: string;
  difficulty: WorkoutDifficulty;
  durationMinutes: string;
  category: string;
  tags: string;
  exercises: WorkoutExerciseForm[];
}

interface RelaxationStepFormState {
  title: string;
  instruction: string;
  durationSeconds: string;
  sequence: number;
}

interface RelaxationFormState {
  title: string;
  description: string;
  category: string;
  tags: string;
  estimatedDurationMinutes: string;
  coverImageUrl: string;
  steps: RelaxationStepFormState[];
}

interface MusicFormState {
  title: string;
  description: string;
  category: string;
  tags: string;
  artistName: string;
  durationSeconds: string;
  audioUrl: string;
  artworkUrl: string;
}

interface QuoteFormState {
  entryDate: string;
  quoteText: string;
  author: string;
}

interface PanchangFormState {
  entryDate: string;
  headline: string;
  tithi: string;
  nakshatra: string;
  sunriseTime: string;
  sunsetTime: string;
  focusText: string;
  notes: string;
}

const contentSections: Array<{ key: ContentSection; label: string }> = [
  { key: "workouts", label: "Workouts" },
  { key: "relaxation", label: "Relaxation" },
  { key: "music", label: "Music" },
  { key: "quotes", label: "Daily Quote" },
  { key: "panchang", label: "Panchang" }
];

const emptyWorkoutExercise = (sequence: number): WorkoutExerciseForm => ({
  name: "",
  instruction: "",
  repTarget: "",
  timeTargetSeconds: null,
  distanceTargetMeters: null,
  restSeconds: 30,
  sequence
});

const emptyRelaxationStep = (sequence: number): RelaxationStepFormState => ({
  title: "",
  instruction: "",
  durationSeconds: "60",
  sequence
});

function createWorkoutForm(): WorkoutFormState {
  return {
    title: "",
    description: "",
    difficulty: "beginner",
    durationMinutes: "20",
    category: "",
    tags: "",
    exercises: [emptyWorkoutExercise(1)]
  };
}

function createRelaxationForm(): RelaxationFormState {
  return {
    title: "",
    description: "",
    category: "",
    tags: "",
    estimatedDurationMinutes: "10",
    coverImageUrl: "",
    steps: [emptyRelaxationStep(1)]
  };
}

function createMusicForm(): MusicFormState {
  return {
    title: "",
    description: "",
    category: "",
    tags: "",
    artistName: "",
    durationSeconds: "300",
    audioUrl: "",
    artworkUrl: ""
  };
}

function createQuoteForm(): QuoteFormState {
  return {
    entryDate: "",
    quoteText: "",
    author: ""
  };
}

function createPanchangForm(): PanchangFormState {
  return {
    entryDate: "",
    headline: "",
    tithi: "",
    nakshatra: "",
    sunriseTime: "06:00",
    sunsetTime: "18:00",
    focusText: "",
    notes: ""
  };
}

function formatSecondsLabel(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

export function ContentStudio() {
  const { session } = useAdminSession();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );

  const [currentSection, setCurrentSection] = useState<ContentSection>("workouts");
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [relaxation, setRelaxation] = useState<RelaxationTechniqueListItem[]>([]);
  const [music, setMusic] = useState<MusicTrackListItem[]>([]);
  const [quotes, setQuotes] = useState<DailyQuoteRecord[]>([]);
  const [panchangEntries, setPanchangEntries] = useState<DailyPanchangRecord[]>([]);

  const [workoutForm, setWorkoutForm] = useState<WorkoutFormState>(createWorkoutForm);
  const [relaxationForm, setRelaxationForm] = useState<RelaxationFormState>(createRelaxationForm);
  const [musicForm, setMusicForm] = useState<MusicFormState>(createMusicForm);
  const [quoteForm, setQuoteForm] = useState<QuoteFormState>(createQuoteForm);
  const [panchangForm, setPanchangForm] = useState<PanchangFormState>(createPanchangForm);

  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingRelaxationId, setEditingRelaxationId] = useState<string | null>(null);
  const [editingMusicId, setEditingMusicId] = useState<string | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editingPanchangId, setEditingPanchangId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || session.user.role !== "admin") {
      setLoading(false);
      return;
    }

    void loadContent();
  }, [api, session]);

  async function loadContent() {
    if (!session || session.user.role !== "admin") {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [nextWorkouts, nextRelaxation, nextMusic, nextQuotes, nextPanchang] = await Promise.all([
        api.adminWorkouts.list(),
        api.adminWellness.relaxation.list(),
        api.adminWellness.music.list(),
        api.adminWellness.dailyQuotes.list(),
        api.adminWellness.panchang.list()
      ]);

      setWorkouts(nextWorkouts);
      setRelaxation(nextRelaxation);
      setMusic(nextMusic);
      setQuotes(nextQuotes);
      setPanchangEntries(nextPanchang);
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to load content studio.");
    } finally {
      setLoading(false);
    }
  }

  function resetWorkoutForm() {
    setEditingWorkoutId(null);
    setWorkoutForm(createWorkoutForm());
  }

  function resetRelaxationForm() {
    setEditingRelaxationId(null);
    setRelaxationForm(createRelaxationForm());
  }

  function resetMusicForm() {
    setEditingMusicId(null);
    setMusicForm(createMusicForm());
  }

  function resetQuoteForm() {
    setEditingQuoteId(null);
    setQuoteForm(createQuoteForm());
  }

  function resetPanchangForm() {
    setEditingPanchangId(null);
    setPanchangForm(createPanchangForm());
  }

  function updateWorkoutExercise(sequence: number, nextValue: Partial<WorkoutExerciseForm>) {
    setWorkoutForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.sequence === sequence ? { ...exercise, ...nextValue } : exercise
      )
    }));
  }

  function updateRelaxationStep(sequence: number, nextValue: Partial<RelaxationStepFormState>) {
    setRelaxationForm((current) => ({
      ...current,
      steps: current.steps.map((step) =>
        step.sequence === sequence ? { ...step, ...nextValue } : step
      )
    }));
  }

  function removeRelaxationStep(sequence: number) {
    setRelaxationForm((current) => ({
      ...current,
      steps: current.steps
        .filter((step) => step.sequence !== sequence)
        .map((step, index) => ({
          ...step,
          sequence: index + 1
        }))
    }));
  }

  function moveRelaxationStep(sequence: number, direction: -1 | 1) {
    setRelaxationForm((current) => {
      const currentIndex = current.steps.findIndex((step) => step.sequence === sequence);
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= current.steps.length) {
        return current;
      }

      const steps = [...current.steps];
      const [movedStep] = steps.splice(currentIndex, 1);
      steps.splice(nextIndex, 0, movedStep);

      return {
        ...current,
        steps: steps.map((step, index) => ({
          ...step,
          sequence: index + 1
        }))
      };
    });
  }

  async function startEditWorkout(workoutId: string) {
    try {
      const workout = await api.workouts.detail(workoutId);
      setEditingWorkoutId(workout.id);
      setWorkoutForm({
        title: workout.title,
        description: workout.description,
        difficulty: workout.difficulty,
        durationMinutes: String(workout.durationMinutes),
        category: workout.category ?? "",
        tags: workout.tags.join(", "),
        exercises: workout.exercises.map((exercise) => ({
          name: exercise.name,
          instruction: exercise.instruction ?? "",
          repTarget: exercise.repTarget ?? "",
          timeTargetSeconds: exercise.timeTargetSeconds,
          distanceTargetMeters: exercise.distanceTargetMeters,
          restSeconds: exercise.restSeconds,
          sequence: exercise.sequence
        }))
      });
      setError(null);
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to load workout details.");
    }
  }

  async function startEditRelaxation(techniqueId: string) {
    try {
      const detail = await api.adminWellness.relaxation.detail(techniqueId);
      setEditingRelaxationId(detail.id);
      setRelaxationForm({
        title: detail.title,
        description: detail.description,
        category: detail.category ?? "",
        tags: detail.tags.join(", "),
        estimatedDurationMinutes: String(detail.estimatedDurationMinutes),
        coverImageUrl: detail.coverImageUrl ?? "",
        steps: detail.steps.map((step) => ({
          title: step.title,
          instruction: step.instruction,
          durationSeconds: String(step.durationSeconds),
          sequence: step.sequence
        }))
      });
      setError(null);
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to load relaxation details.");
    }
  }

  function startEditMusic(track: MusicTrackListItem) {
    setEditingMusicId(track.id);
    setMusicForm({
      title: track.title,
      description: track.description,
      category: track.category ?? "",
      tags: track.tags.join(", "),
      artistName: track.artistName,
      durationSeconds: String(track.durationSeconds),
      audioUrl: track.audioUrl,
      artworkUrl: track.artworkUrl ?? ""
    });
    setError(null);
  }

  function startEditQuote(quote: DailyQuoteRecord) {
    setEditingQuoteId(quote.id);
    setQuoteForm({
      entryDate: quote.entryDate,
      quoteText: quote.quoteText,
      author: quote.author ?? ""
    });
    setError(null);
  }

  function startEditPanchang(entry: DailyPanchangRecord) {
    setEditingPanchangId(entry.id);
    setPanchangForm({
      entryDate: entry.entryDate,
      headline: entry.headline,
      tithi: entry.tithi,
      nakshatra: entry.nakshatra,
      sunriseTime: entry.sunriseTime,
      sunsetTime: entry.sunsetTime,
      focusText: entry.focusText,
      notes: entry.notes ?? ""
    });
    setError(null);
  }

  async function handleWorkoutSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: SaveWorkoutRequest = {
        title: workoutForm.title,
        description: workoutForm.description,
        difficulty: workoutForm.difficulty,
        durationMinutes: Number(workoutForm.durationMinutes),
        category: workoutForm.category || null,
        tags: workoutForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        exercises: workoutForm.exercises.map((exercise, index) => ({
          name: exercise.name,
          instruction: exercise.instruction || null,
          repTarget: exercise.repTarget || null,
          timeTargetSeconds: exercise.timeTargetSeconds ? Number(exercise.timeTargetSeconds) : null,
          distanceTargetMeters: exercise.distanceTargetMeters
            ? Number(exercise.distanceTargetMeters)
            : null,
          restSeconds: exercise.restSeconds ? Number(exercise.restSeconds) : null,
          sequence: index + 1
        }))
      };

      if (editingWorkoutId) {
        await api.adminWorkouts.update(editingWorkoutId, payload);
      } else {
        await api.adminWorkouts.create(payload);
      }

      await loadContent();
      resetWorkoutForm();
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to save workout.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRelaxationSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: relaxationForm.title,
        description: relaxationForm.description,
        category: relaxationForm.category || null,
        tags: relaxationForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        estimatedDurationMinutes: Number(relaxationForm.estimatedDurationMinutes),
        coverImageUrl: relaxationForm.coverImageUrl || null,
        steps: relaxationForm.steps.map((step, index) => ({
          title: step.title,
          instruction: step.instruction,
          durationSeconds: Number(step.durationSeconds),
          sequence: index + 1
        }))
      };

      if (editingRelaxationId) {
        await api.adminWellness.relaxation.update(editingRelaxationId, payload);
      } else {
        await api.adminWellness.relaxation.create(payload);
      }

      await loadContent();
      resetRelaxationForm();
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to save relaxation technique.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMusicSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: musicForm.title,
        description: musicForm.description,
        category: musicForm.category || null,
        tags: musicForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        artistName: musicForm.artistName,
        durationSeconds: Number(musicForm.durationSeconds),
        audioUrl: musicForm.audioUrl,
        artworkUrl: musicForm.artworkUrl || null
      };

      if (editingMusicId) {
        await api.adminWellness.music.update(editingMusicId, payload);
      } else {
        await api.adminWellness.music.create(payload);
      }

      await loadContent();
      resetMusicForm();
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to save music track.");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuoteSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        entryDate: quoteForm.entryDate,
        quoteText: quoteForm.quoteText,
        author: quoteForm.author || null
      };

      if (editingQuoteId) {
        await api.adminWellness.dailyQuotes.update(editingQuoteId, payload);
      } else {
        await api.adminWellness.dailyQuotes.create(payload);
      }

      await loadContent();
      resetQuoteForm();
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to save daily quote.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePanchangSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        entryDate: panchangForm.entryDate,
        headline: panchangForm.headline,
        tithi: panchangForm.tithi,
        nakshatra: panchangForm.nakshatra,
        sunriseTime: panchangForm.sunriseTime,
        sunsetTime: panchangForm.sunsetTime,
        focusText: panchangForm.focusText,
        notes: panchangForm.notes || null
      };

      if (editingPanchangId) {
        await api.adminWellness.panchang.update(editingPanchangId, payload);
      } else {
        await api.adminWellness.panchang.create(payload);
      }

      await loadContent();
      resetPanchangForm();
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to save panchang.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleWorkoutPublish(workout: WorkoutListItem) {
    try {
      if (workout.status === "published") {
        await api.adminWorkouts.unpublish(workout.id);
      } else {
        await api.adminWorkouts.publish(workout.id);
      }

      await loadContent();
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to update workout status.");
    }
  }

  async function toggleRelaxationPublish(item: RelaxationTechniqueListItem) {
    try {
      if (item.status === "published") {
        await api.adminWellness.relaxation.unpublish(item.id);
      } else {
        await api.adminWellness.relaxation.publish(item.id);
      }

      await loadContent();
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to update relaxation status.");
    }
  }

  async function toggleMusicPublish(track: MusicTrackListItem) {
    try {
      if (track.status === "published") {
        await api.adminWellness.music.unpublish(track.id);
      } else {
        await api.adminWellness.music.publish(track.id);
      }

      await loadContent();
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to update music status.");
    }
  }

  async function toggleQuotePublish(quote: DailyQuoteRecord) {
    try {
      if (quote.status === "published") {
        await api.adminWellness.dailyQuotes.unpublish(quote.id);
      } else {
        await api.adminWellness.dailyQuotes.publish(quote.id);
      }

      await loadContent();
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to update quote status.");
    }
  }

  async function togglePanchangPublish(entry: DailyPanchangRecord) {
    try {
      if (entry.status === "published") {
        await api.adminWellness.panchang.unpublish(entry.id);
      } else {
        await api.adminWellness.panchang.publish(entry.id);
      }

      await loadContent();
    } catch (unknownError) {
      setError((unknownError as ApiError).message || "Unable to update panchang status.");
    }
  }

  if (!session) {
    return null;
  }

  if (session.user.role !== "admin") {
    return (
      <div className="stack">
        <section className="hero">
          <div className="hero-panel">
            <p className="eyebrow">Content</p>
            <h1 className="display-title">Admin-only workspace</h1>
            <p className="display-copy">
              Wellness authoring, workout publishing, and daily content management stay reserved for admins in Phase 2.
            </p>
          </div>
        </section>
      </div>
    );
  }

  const currentRecords = {
    workouts,
    relaxation,
    music,
    quotes,
    panchang: panchangEntries
  }[currentSection];
  const currentPublishedCount = currentRecords.filter((record) => record.status === "published").length;
  const currentDraftCount = currentRecords.filter((record) => record.status === "draft").length;

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-panel">
          <p className="eyebrow">Content Studio</p>
          <h1 className="display-title">Manage workouts and wellness content in one place.</h1>
          <p className="display-copy">
            Phase 2 keeps the existing workout studio intact and expands this admin surface with guided relaxation, music, daily quote, and panchang publishing.
          </p>
          {error ? <p className="error-banner">{error}</p> : null}
        </div>
        <SectionCard
          title="Current section"
          description="Published content is visible to mobile users. Drafts remain internal until you publish them."
        >
          <div className="stack-tight">
            <div className="pill">
              <strong>Section</strong> {contentSections.find((section) => section.key === currentSection)?.label}
            </div>
            <div className="pill">
              <strong>Published</strong> {currentPublishedCount}
            </div>
            <div className="pill">
              <strong>Drafts</strong> {currentDraftCount}
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="admin-card">
        <p className="eyebrow">Content type</p>
        <div className="button-row">
          {contentSections.map((section) => (
            <button
              className={`button ${section.key === currentSection ? "button-primary" : "button-secondary"}`}
              key={section.key}
              onClick={() => setCurrentSection(section.key)}
              type="button"
            >
              {section.label}
            </button>
          ))}
        </div>
      </section>

      {currentSection === "workouts" ? (
        <section className="split-grid">
          <div className="admin-card">
            <p className="eyebrow">{editingWorkoutId ? "Edit workout" : "New workout"}</p>
            <form className="stack-tight" onSubmit={handleWorkoutSubmit}>
              <div className="field">
                <label htmlFor="workout-title">Title</label>
                <input
                  id="workout-title"
                  onChange={(event) =>
                    setWorkoutForm((current) => ({ ...current, title: event.target.value }))
                  }
                  value={workoutForm.title}
                />
              </div>
              <div className="field">
                <label htmlFor="workout-description">Description</label>
                <textarea
                  id="workout-description"
                  onChange={(event) =>
                    setWorkoutForm((current) => ({ ...current, description: event.target.value }))
                  }
                  rows={4}
                  value={workoutForm.description}
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="workout-difficulty">Difficulty</label>
                  <select
                    id="workout-difficulty"
                    onChange={(event) =>
                      setWorkoutForm((current) => ({
                        ...current,
                        difficulty: event.target.value as WorkoutDifficulty
                      }))
                    }
                    value={workoutForm.difficulty}
                  >
                    <option value="beginner">beginner</option>
                    <option value="intermediate">intermediate</option>
                    <option value="advanced">advanced</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="workout-duration">Duration (minutes)</label>
                  <input
                    id="workout-duration"
                    onChange={(event) =>
                      setWorkoutForm((current) => ({
                        ...current,
                        durationMinutes: event.target.value
                      }))
                    }
                    type="number"
                    value={workoutForm.durationMinutes}
                  />
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="workout-category">Category</label>
                  <input
                    id="workout-category"
                    onChange={(event) =>
                      setWorkoutForm((current) => ({ ...current, category: event.target.value }))
                    }
                    value={workoutForm.category}
                  />
                </div>
                <div className="field">
                  <label htmlFor="workout-tags">Tags</label>
                  <input
                    id="workout-tags"
                    onChange={(event) =>
                      setWorkoutForm((current) => ({ ...current, tags: event.target.value }))
                    }
                    placeholder="mobility, strength, low impact"
                    value={workoutForm.tags}
                  />
                </div>
              </div>

              <div className="stack-tight">
                <div className="button-row">
                  <p className="eyebrow" style={{ marginBottom: 0 }}>
                    Exercises
                  </p>
                  <button
                    className="button button-secondary"
                    onClick={() =>
                      setWorkoutForm((current) => ({
                        ...current,
                        exercises: [
                          ...current.exercises,
                          emptyWorkoutExercise(current.exercises.length + 1)
                        ]
                      }))
                    }
                    type="button"
                  >
                    Add exercise
                  </button>
                </div>
                {workoutForm.exercises.map((exercise, index) => (
                  <div className="exercise-card" key={`${exercise.sequence}-${index}`}>
                    <div className="button-row">
                      <strong>Exercise {index + 1}</strong>
                      {workoutForm.exercises.length > 1 ? (
                        <button
                          className="button button-secondary"
                          onClick={() =>
                            setWorkoutForm((current) => ({
                              ...current,
                              exercises: current.exercises
                                .filter((item) => item.sequence !== exercise.sequence)
                                .map((item, itemIndex) => ({
                                  ...item,
                                  sequence: itemIndex + 1
                                }))
                            }))
                          }
                          type="button"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <div className="form-grid">
                      <div className="field">
                        <label>Name</label>
                        <input
                          onChange={(event) =>
                            updateWorkoutExercise(exercise.sequence, { name: event.target.value })
                          }
                          value={exercise.name}
                        />
                      </div>
                      <div className="field">
                        <label>Rep target</label>
                        <input
                          onChange={(event) =>
                            updateWorkoutExercise(exercise.sequence, {
                              repTarget: event.target.value
                            })
                          }
                          value={exercise.repTarget ?? ""}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label>Instruction</label>
                      <textarea
                        onChange={(event) =>
                          updateWorkoutExercise(exercise.sequence, {
                            instruction: event.target.value
                          })
                        }
                        rows={3}
                        value={exercise.instruction ?? ""}
                      />
                    </div>
                    <div className="form-grid">
                      <div className="field">
                        <label>Time target (seconds)</label>
                        <input
                          onChange={(event) =>
                            updateWorkoutExercise(exercise.sequence, {
                              timeTargetSeconds: event.target.value ? Number(event.target.value) : null
                            })
                          }
                          type="number"
                          value={exercise.timeTargetSeconds ?? ""}
                        />
                      </div>
                      <div className="field">
                        <label>Distance target (meters)</label>
                        <input
                          onChange={(event) =>
                            updateWorkoutExercise(exercise.sequence, {
                              distanceTargetMeters: event.target.value
                                ? Number(event.target.value)
                                : null
                            })
                          }
                          type="number"
                          value={exercise.distanceTargetMeters ?? ""}
                        />
                      </div>
                      <div className="field">
                        <label>Rest (seconds)</label>
                        <input
                          onChange={(event) =>
                            updateWorkoutExercise(exercise.sequence, {
                              restSeconds: event.target.value ? Number(event.target.value) : null
                            })
                          }
                          type="number"
                          value={exercise.restSeconds ?? ""}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="button-row">
                <button className="button button-primary" disabled={saving} type="submit">
                  {saving ? "Saving..." : editingWorkoutId ? "Update workout" : "Create workout"}
                </button>
                <button className="button button-secondary" onClick={resetWorkoutForm} type="button">
                  Reset form
                </button>
              </div>
            </form>
          </div>

          <div className="admin-card">
            <p className="eyebrow">Workout catalog</p>
            {loading ? <p className="muted">Loading content...</p> : null}
            <div className="stack-tight">
              {workouts.map((workout) => (
                <div className="exercise-card" key={workout.id}>
                  <div className="button-row">
                    <div>
                      <strong>{workout.title}</strong>
                      <p className="muted" style={{ marginTop: 6 }}>
                        {workout.durationMinutes} min • {workout.difficulty} • {workout.exerciseCount} exercises
                      </p>
                    </div>
                    <span className="status">{workout.status}</span>
                  </div>
                  <p className="muted">{workout.description}</p>
                  <div className="pill-row">
                    {workout.tags.map((tag) => (
                      <span className="pill" key={`${workout.id}-${tag}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="button-row">
                    <button
                      className="button button-secondary"
                      onClick={() => void startEditWorkout(workout.id)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="button button-primary"
                      onClick={() => void toggleWorkoutPublish(workout)}
                      type="button"
                    >
                      {workout.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              ))}
              {!loading && workouts.length === 0 ? <p className="muted">No workouts created yet.</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {currentSection === "relaxation" ? (
        <section className="split-grid">
          <div className="admin-card">
            <p className="eyebrow">{editingRelaxationId ? "Edit technique" : "New technique"}</p>
            <form className="stack-tight" onSubmit={handleRelaxationSubmit}>
              <div className="field">
                <label htmlFor="relaxation-title">Title</label>
                <input
                  id="relaxation-title"
                  onChange={(event) =>
                    setRelaxationForm((current) => ({ ...current, title: event.target.value }))
                  }
                  value={relaxationForm.title}
                />
              </div>
              <div className="field">
                <label htmlFor="relaxation-description">Description</label>
                <textarea
                  id="relaxation-description"
                  onChange={(event) =>
                    setRelaxationForm((current) => ({
                      ...current,
                      description: event.target.value
                    }))
                  }
                  rows={4}
                  value={relaxationForm.description}
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="relaxation-duration">Estimated duration (minutes)</label>
                  <input
                    id="relaxation-duration"
                    onChange={(event) =>
                      setRelaxationForm((current) => ({
                        ...current,
                        estimatedDurationMinutes: event.target.value
                      }))
                    }
                    type="number"
                    value={relaxationForm.estimatedDurationMinutes}
                  />
                </div>
                <div className="field">
                  <label htmlFor="relaxation-category">Category</label>
                  <input
                    id="relaxation-category"
                    onChange={(event) =>
                      setRelaxationForm((current) => ({
                        ...current,
                        category: event.target.value
                      }))
                    }
                    value={relaxationForm.category}
                  />
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="relaxation-tags">Tags</label>
                  <input
                    id="relaxation-tags"
                    onChange={(event) =>
                      setRelaxationForm((current) => ({ ...current, tags: event.target.value }))
                    }
                    placeholder="breathing, evening, focus"
                    value={relaxationForm.tags}
                  />
                </div>
                <div className="field">
                  <label htmlFor="relaxation-cover">Cover image URL</label>
                  <input
                    id="relaxation-cover"
                    onChange={(event) =>
                      setRelaxationForm((current) => ({
                        ...current,
                        coverImageUrl: event.target.value
                      }))
                    }
                    value={relaxationForm.coverImageUrl}
                  />
                </div>
              </div>

              <div className="stack-tight">
                <div className="button-row">
                  <p className="eyebrow" style={{ marginBottom: 0 }}>
                    Guided steps
                  </p>
                  <button
                    className="button button-secondary"
                    onClick={() =>
                      setRelaxationForm((current) => ({
                        ...current,
                        steps: [...current.steps, emptyRelaxationStep(current.steps.length + 1)]
                      }))
                    }
                    type="button"
                  >
                    Add step
                  </button>
                </div>
                {relaxationForm.steps.map((step, index) => (
                  <div className="exercise-card" key={`${step.sequence}-${index}`}>
                    <div className="button-row">
                      <strong>Step {index + 1}</strong>
                      <div className="button-row">
                        <button
                          className="button button-secondary"
                          disabled={index === 0}
                          onClick={() => moveRelaxationStep(step.sequence, -1)}
                          type="button"
                        >
                          Move up
                        </button>
                        <button
                          className="button button-secondary"
                          disabled={index === relaxationForm.steps.length - 1}
                          onClick={() => moveRelaxationStep(step.sequence, 1)}
                          type="button"
                        >
                          Move down
                        </button>
                        {relaxationForm.steps.length > 1 ? (
                          <button
                            className="button button-secondary"
                            onClick={() => removeRelaxationStep(step.sequence)}
                            type="button"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="field">
                      <label>Title</label>
                      <input
                        onChange={(event) =>
                          updateRelaxationStep(step.sequence, { title: event.target.value })
                        }
                        value={step.title}
                      />
                    </div>
                    <div className="field">
                      <label>Instruction</label>
                      <textarea
                        onChange={(event) =>
                          updateRelaxationStep(step.sequence, { instruction: event.target.value })
                        }
                        rows={3}
                        value={step.instruction}
                      />
                    </div>
                    <div className="field">
                      <label>Duration (seconds)</label>
                      <input
                        onChange={(event) =>
                          updateRelaxationStep(step.sequence, {
                            durationSeconds: event.target.value
                          })
                        }
                        type="number"
                        value={step.durationSeconds}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="button-row">
                <button className="button button-primary" disabled={saving} type="submit">
                  {saving ? "Saving..." : editingRelaxationId ? "Update technique" : "Create technique"}
                </button>
                <button className="button button-secondary" onClick={resetRelaxationForm} type="button">
                  Reset form
                </button>
              </div>
            </form>
          </div>

          <div className="admin-card">
            <p className="eyebrow">Relaxation catalog</p>
            {loading ? <p className="muted">Loading content...</p> : null}
            <div className="stack-tight">
              {relaxation.map((technique) => (
                <div className="exercise-card" key={technique.id}>
                  <div className="button-row">
                    <div>
                      <strong>{technique.title}</strong>
                      <p className="muted" style={{ marginTop: 6 }}>
                        {technique.estimatedDurationMinutes} min
                        {technique.category ? ` • ${technique.category}` : ""}
                      </p>
                    </div>
                    <span className="status">{technique.status}</span>
                  </div>
                  <p className="muted">{technique.description}</p>
                  <div className="pill-row">
                    {technique.tags.map((tag) => (
                      <span className="pill" key={`${technique.id}-${tag}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="button-row">
                    <button
                      className="button button-secondary"
                      onClick={() => void startEditRelaxation(technique.id)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="button button-primary"
                      onClick={() => void toggleRelaxationPublish(technique)}
                      type="button"
                    >
                      {technique.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              ))}
              {!loading && relaxation.length === 0 ? (
                <p className="muted">No relaxation techniques created yet.</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {currentSection === "music" ? (
        <section className="split-grid">
          <div className="admin-card">
            <p className="eyebrow">{editingMusicId ? "Edit track" : "New track"}</p>
            <form className="stack-tight" onSubmit={handleMusicSubmit}>
              <div className="field">
                <label htmlFor="music-title">Title</label>
                <input
                  id="music-title"
                  onChange={(event) =>
                    setMusicForm((current) => ({ ...current, title: event.target.value }))
                  }
                  value={musicForm.title}
                />
              </div>
              <div className="field">
                <label htmlFor="music-description">Description</label>
                <textarea
                  id="music-description"
                  onChange={(event) =>
                    setMusicForm((current) => ({
                      ...current,
                      description: event.target.value
                    }))
                  }
                  rows={4}
                  value={musicForm.description}
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="music-artist">Artist</label>
                  <input
                    id="music-artist"
                    onChange={(event) =>
                      setMusicForm((current) => ({ ...current, artistName: event.target.value }))
                    }
                    value={musicForm.artistName}
                  />
                </div>
                <div className="field">
                  <label htmlFor="music-duration">Duration (seconds)</label>
                  <input
                    id="music-duration"
                    onChange={(event) =>
                      setMusicForm((current) => ({
                        ...current,
                        durationSeconds: event.target.value
                      }))
                    }
                    type="number"
                    value={musicForm.durationSeconds}
                  />
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="music-category">Category</label>
                  <input
                    id="music-category"
                    onChange={(event) =>
                      setMusicForm((current) => ({ ...current, category: event.target.value }))
                    }
                    value={musicForm.category}
                  />
                </div>
                <div className="field">
                  <label htmlFor="music-tags">Tags</label>
                  <input
                    id="music-tags"
                    onChange={(event) =>
                      setMusicForm((current) => ({ ...current, tags: event.target.value }))
                    }
                    placeholder="ambient, breathwork, recovery"
                    value={musicForm.tags}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="music-audio">Audio URL</label>
                <input
                  id="music-audio"
                  onChange={(event) =>
                    setMusicForm((current) => ({ ...current, audioUrl: event.target.value }))
                  }
                  value={musicForm.audioUrl}
                />
              </div>
              <div className="field">
                <label htmlFor="music-artwork">Artwork URL</label>
                <input
                  id="music-artwork"
                  onChange={(event) =>
                    setMusicForm((current) => ({ ...current, artworkUrl: event.target.value }))
                  }
                  value={musicForm.artworkUrl}
                />
              </div>
              <div className="button-row">
                <button className="button button-primary" disabled={saving} type="submit">
                  {saving ? "Saving..." : editingMusicId ? "Update track" : "Create track"}
                </button>
                <button className="button button-secondary" onClick={resetMusicForm} type="button">
                  Reset form
                </button>
              </div>
            </form>
          </div>

          <div className="admin-card">
            <p className="eyebrow">Music catalog</p>
            {loading ? <p className="muted">Loading content...</p> : null}
            <div className="stack-tight">
              {music.map((track) => (
                <div className="exercise-card" key={track.id}>
                  <div className="button-row">
                    <div>
                      <strong>{track.title}</strong>
                      <p className="muted" style={{ marginTop: 6 }}>
                        {track.artistName} • {formatSecondsLabel(track.durationSeconds)}
                      </p>
                    </div>
                    <span className="status">{track.status}</span>
                  </div>
                  <p className="muted">{track.description}</p>
                  <div className="button-row">
                    <button
                      className="button button-secondary"
                      onClick={() => startEditMusic(track)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="button button-primary"
                      onClick={() => void toggleMusicPublish(track)}
                      type="button"
                    >
                      {track.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              ))}
              {!loading && music.length === 0 ? <p className="muted">No music tracks created yet.</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {currentSection === "quotes" ? (
        <section className="split-grid">
          <div className="admin-card">
            <p className="eyebrow">{editingQuoteId ? "Edit daily quote" : "New daily quote"}</p>
            <form className="stack-tight" onSubmit={handleQuoteSubmit}>
              <div className="field">
                <label htmlFor="quote-date">Entry date</label>
                <input
                  id="quote-date"
                  onChange={(event) =>
                    setQuoteForm((current) => ({ ...current, entryDate: event.target.value }))
                  }
                  type="date"
                  value={quoteForm.entryDate}
                />
              </div>
              <div className="field">
                <label htmlFor="quote-text">Quote</label>
                <textarea
                  id="quote-text"
                  onChange={(event) =>
                    setQuoteForm((current) => ({ ...current, quoteText: event.target.value }))
                  }
                  rows={5}
                  value={quoteForm.quoteText}
                />
              </div>
              <div className="field">
                <label htmlFor="quote-author">Author</label>
                <input
                  id="quote-author"
                  onChange={(event) =>
                    setQuoteForm((current) => ({ ...current, author: event.target.value }))
                  }
                  value={quoteForm.author}
                />
              </div>
              <div className="button-row">
                <button className="button button-primary" disabled={saving} type="submit">
                  {saving ? "Saving..." : editingQuoteId ? "Update quote" : "Create quote"}
                </button>
                <button className="button button-secondary" onClick={resetQuoteForm} type="button">
                  Reset form
                </button>
              </div>
            </form>
          </div>

          <div className="admin-card">
            <p className="eyebrow">Quote catalog</p>
            {loading ? <p className="muted">Loading content...</p> : null}
            <div className="stack-tight">
              {quotes.map((quote) => (
                <div className="exercise-card" key={quote.id}>
                  <div className="button-row">
                    <div>
                      <strong>{quote.entryDate}</strong>
                      <p className="muted" style={{ marginTop: 6 }}>
                        {quote.author ?? "Unknown author"}
                      </p>
                    </div>
                    <span className="status">{quote.status}</span>
                  </div>
                  <p className="muted">{quote.quoteText}</p>
                  <div className="button-row">
                    <button
                      className="button button-secondary"
                      onClick={() => startEditQuote(quote)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="button button-primary"
                      onClick={() => void toggleQuotePublish(quote)}
                      type="button"
                    >
                      {quote.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              ))}
              {!loading && quotes.length === 0 ? <p className="muted">No daily quotes created yet.</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {currentSection === "panchang" ? (
        <section className="split-grid">
          <div className="admin-card">
            <p className="eyebrow">{editingPanchangId ? "Edit panchang" : "New panchang"}</p>
            <form className="stack-tight" onSubmit={handlePanchangSubmit}>
              <div className="field">
                <label htmlFor="panchang-date">Entry date</label>
                <input
                  id="panchang-date"
                  onChange={(event) =>
                    setPanchangForm((current) => ({ ...current, entryDate: event.target.value }))
                  }
                  type="date"
                  value={panchangForm.entryDate}
                />
              </div>
              <div className="field">
                <label htmlFor="panchang-headline">Headline</label>
                <input
                  id="panchang-headline"
                  onChange={(event) =>
                    setPanchangForm((current) => ({ ...current, headline: event.target.value }))
                  }
                  value={panchangForm.headline}
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="panchang-tithi">Tithi</label>
                  <input
                    id="panchang-tithi"
                    onChange={(event) =>
                      setPanchangForm((current) => ({ ...current, tithi: event.target.value }))
                    }
                    value={panchangForm.tithi}
                  />
                </div>
                <div className="field">
                  <label htmlFor="panchang-nakshatra">Nakshatra</label>
                  <input
                    id="panchang-nakshatra"
                    onChange={(event) =>
                      setPanchangForm((current) => ({
                        ...current,
                        nakshatra: event.target.value
                      }))
                    }
                    value={panchangForm.nakshatra}
                  />
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="panchang-sunrise">Sunrise</label>
                  <input
                    id="panchang-sunrise"
                    onChange={(event) =>
                      setPanchangForm((current) => ({
                        ...current,
                        sunriseTime: event.target.value
                      }))
                    }
                    type="time"
                    value={panchangForm.sunriseTime}
                  />
                </div>
                <div className="field">
                  <label htmlFor="panchang-sunset">Sunset</label>
                  <input
                    id="panchang-sunset"
                    onChange={(event) =>
                      setPanchangForm((current) => ({
                        ...current,
                        sunsetTime: event.target.value
                      }))
                    }
                    type="time"
                    value={panchangForm.sunsetTime}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="panchang-focus">Focus text</label>
                <textarea
                  id="panchang-focus"
                  onChange={(event) =>
                    setPanchangForm((current) => ({
                      ...current,
                      focusText: event.target.value
                    }))
                  }
                  rows={4}
                  value={panchangForm.focusText}
                />
              </div>
              <div className="field">
                <label htmlFor="panchang-notes">Notes</label>
                <textarea
                  id="panchang-notes"
                  onChange={(event) =>
                    setPanchangForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  rows={4}
                  value={panchangForm.notes}
                />
              </div>
              <div className="button-row">
                <button className="button button-primary" disabled={saving} type="submit">
                  {saving ? "Saving..." : editingPanchangId ? "Update panchang" : "Create panchang"}
                </button>
                <button
                  className="button button-secondary"
                  onClick={resetPanchangForm}
                  type="button"
                >
                  Reset form
                </button>
              </div>
            </form>
          </div>

          <div className="admin-card">
            <p className="eyebrow">Panchang catalog</p>
            {loading ? <p className="muted">Loading content...</p> : null}
            <div className="stack-tight">
              {panchangEntries.map((entry) => (
                <div className="exercise-card" key={entry.id}>
                  <div className="button-row">
                    <div>
                      <strong>{entry.entryDate}</strong>
                      <p className="muted" style={{ marginTop: 6 }}>
                        {entry.tithi} • {entry.nakshatra}
                      </p>
                    </div>
                    <span className="status">{entry.status}</span>
                  </div>
                  <p className="muted">{entry.headline}</p>
                  <p className="muted">{entry.focusText}</p>
                  <div className="button-row">
                    <button
                      className="button button-secondary"
                      onClick={() => startEditPanchang(entry)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="button button-primary"
                      onClick={() => void togglePanchangPublish(entry)}
                      type="button"
                    >
                      {entry.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              ))}
              {!loading && panchangEntries.length === 0 ? (
                <p className="muted">No panchang entries created yet.</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
