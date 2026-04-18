"use client";

import { createApiClient } from "@platform/sdk";
import type {
  ApiError,
  SaveWorkoutRequest,
  WorkoutDifficulty,
  WorkoutListItem
} from "@platform/types";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SectionCard } from "../../../components/section-card";
import { useAdminSession } from "../../../lib/session";

type ExerciseForm = SaveWorkoutRequest["exercises"][number];

interface WorkoutFormState {
  title: string;
  description: string;
  difficulty: WorkoutDifficulty;
  durationMinutes: string;
  category: string;
  tags: string;
  exercises: ExerciseForm[];
}

const emptyExercise = (sequence: number): ExerciseForm => ({
  name: "",
  instruction: "",
  repTarget: "",
  timeTargetSeconds: null,
  distanceTargetMeters: null,
  restSeconds: 30,
  sequence
});

function createEmptyForm(): WorkoutFormState {
  return {
    title: "",
    description: "",
    difficulty: "beginner",
    durationMinutes: "20",
    category: "",
    tags: "",
    exercises: [emptyExercise(1)]
  };
}

export default function ContentPage() {
  const { session } = useAdminSession();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [form, setForm] = useState<WorkoutFormState>(createEmptyForm);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || session.user.role !== "admin") {
      setLoading(false);
      return;
    }

    void loadWorkouts();
  }, [api, session]);

  async function loadWorkouts() {
    try {
      setLoading(true);
      setError(null);
      const nextWorkouts = await api.adminWorkouts.list();
      setWorkouts(nextWorkouts);
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to load workouts.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingWorkoutId(null);
    setForm(createEmptyForm());
  }

  async function startEdit(workoutId: string) {
    try {
      const workout = await api.workouts.detail(workoutId);
      setEditingWorkoutId(workout.id);
      setForm({
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
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to load workout details.");
    }
  }

  function updateExercise(sequence: number, nextValue: Partial<ExerciseForm>) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.sequence === sequence ? { ...exercise, ...nextValue } : exercise
      )
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: SaveWorkoutRequest = {
      title: form.title,
      description: form.description,
      difficulty: form.difficulty,
      durationMinutes: Number(form.durationMinutes),
      category: form.category || null,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      exercises: form.exercises.map((exercise, index) => ({
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

    try {
      if (editingWorkoutId) {
        await api.adminWorkouts.update(editingWorkoutId, payload);
      } else {
        await api.adminWorkouts.create(payload);
      }

      await loadWorkouts();
      resetForm();
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to save workout.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(workout: WorkoutListItem) {
    try {
      if (workout.status === "published") {
        await api.adminWorkouts.unpublish(workout.id);
      } else {
        await api.adminWorkouts.publish(workout.id);
      }

      await loadWorkouts();
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to update workout status.");
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
              Workout authoring and publishing stay reserved for admins in Phase 1.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-panel">
          <p className="eyebrow">Workout Studio</p>
          <h1 className="display-title">Create, edit, and publish workouts.</h1>
          <p className="display-copy">
            Phase 1 keeps this area focused on workout CRUD and publishing so the mobile app and coach workspace both share one trusted catalog.
          </p>
          {error ? <p className="error-banner">{error}</p> : null}
        </div>
        <SectionCard
          title="Catalog state"
          description="Drafts stay hidden from users until they are published."
        >
          <div className="stack-tight">
            <div className="pill">
              <strong>Total</strong> {workouts.length}
            </div>
            <div className="pill">
              <strong>Published</strong> {workouts.filter((workout) => workout.status === "published").length}
            </div>
            <div className="pill">
              <strong>Drafts</strong> {workouts.filter((workout) => workout.status === "draft").length}
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="split-grid">
        <div className="admin-card">
          <p className="eyebrow">{editingWorkoutId ? "Edit workout" : "New workout"}</p>
          <form className="stack-tight" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                value={form.title}
              />
            </div>
            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={4}
                value={form.description}
              />
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="difficulty">Difficulty</label>
                <select
                  id="difficulty"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      difficulty: event.target.value as WorkoutDifficulty
                    }))
                  }
                  value={form.difficulty}
                >
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="durationMinutes">Duration (minutes)</label>
                <input
                  id="durationMinutes"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, durationMinutes: event.target.value }))
                  }
                  type="number"
                  value={form.durationMinutes}
                />
              </div>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  value={form.category}
                />
              </div>
              <div className="field">
                <label htmlFor="tags">Tags</label>
                <input
                  id="tags"
                  onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                  placeholder="mobility, core, low impact"
                  value={form.tags}
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
                    setForm((current) => ({
                      ...current,
                      exercises: [...current.exercises, emptyExercise(current.exercises.length + 1)]
                    }))
                  }
                  type="button"
                >
                  Add exercise
                </button>
              </div>
              {form.exercises.map((exercise, index) => (
                <div className="exercise-card" key={`${exercise.sequence}-${index}`}>
                  <div className="button-row">
                    <strong>Exercise {index + 1}</strong>
                    {form.exercises.length > 1 ? (
                      <button
                        className="button button-secondary"
                        onClick={() =>
                          setForm((current) => ({
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
                        onChange={(event) => updateExercise(exercise.sequence, { name: event.target.value })}
                        value={exercise.name}
                      />
                    </div>
                    <div className="field">
                      <label>Rep target</label>
                      <input
                        onChange={(event) =>
                          updateExercise(exercise.sequence, { repTarget: event.target.value })
                        }
                        value={exercise.repTarget ?? ""}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Instruction</label>
                    <textarea
                      onChange={(event) =>
                        updateExercise(exercise.sequence, { instruction: event.target.value })
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
                          updateExercise(exercise.sequence, {
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
                          updateExercise(exercise.sequence, {
                            distanceTargetMeters: event.target.value ? Number(event.target.value) : null
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
                          updateExercise(exercise.sequence, {
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
              <button className="button button-secondary" onClick={resetForm} type="button">
                Reset form
              </button>
            </div>
          </form>
        </div>

        <div className="admin-card">
          <p className="eyebrow">Catalog</p>
          {loading ? <p className="muted">Loading workouts...</p> : null}
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
                  <button className="button button-secondary" onClick={() => void startEdit(workout.id)} type="button">
                    Edit
                  </button>
                  <button
                    className="button button-primary"
                    onClick={() => void togglePublish(workout)}
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
    </div>
  );
}
