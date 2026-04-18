"use client";

import { createApiClient } from "@platform/sdk";
import type {
  ApiError,
  CoachUserHistory,
  CoachUserRecord,
  UserDirectoryRecord,
  WorkoutListItem
} from "@platform/types";
import { useEffect, useMemo, useState } from "react";
import { SectionCard } from "../../../components/section-card";
import { useAdminSession } from "../../../lib/session";

export default function UsersPage() {
  const { session } = useAdminSession();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );
  const [adminUsers, setAdminUsers] = useState<UserDirectoryRecord[]>([]);
  const [coachUsers, setCoachUsers] = useState<CoachUserRecord[]>([]);
  const [publishedWorkouts, setPublishedWorkouts] = useState<WorkoutListItem[]>([]);
  const [histories, setHistories] = useState<Record<string, CoachUserHistory>>({});
  const [coachSelections, setCoachSelections] = useState<Record<string, string>>({});
  const [workoutSelections, setWorkoutSelections] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    void loadWorkspace();
  }, [api, session]);

  async function loadWorkspace() {
    if (!session) {
      return;
    }

    try {
      setError(null);

      if (session.user.role === "admin") {
        const users = await api.adminUsers.list();
        setAdminUsers(users);
        setCoachSelections(
          Object.fromEntries(users.map((user) => [user.id, user.coachId ?? ""]))
        );
        return;
      }

      const [users, workouts] = await Promise.all([api.coachUsers.list(), api.workouts.list()]);
      setCoachUsers(users);
      setPublishedWorkouts(workouts.filter((workout) => workout.status === "published"));
      setWorkoutSelections(
        Object.fromEntries(users.map((user) => [user.id, user.assignedWorkouts[0]?.workoutId ?? ""]))
      );
      setNoteDrafts(
        Object.fromEntries(users.map((user) => [user.id, user.latestCoachNote?.note ?? ""]))
      );
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to load workspace users.");
    }
  }

  async function approveRole(userId: string) {
    try {
      await api.adminUsers.approveRole(userId);
      await loadWorkspace();
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to approve the requested role.");
    }
  }

  async function assignCoach(userId: string) {
    const coachId = coachSelections[userId];

    if (!coachId) {
      setError("Choose a coach before saving the assignment.");
      return;
    }

    try {
      await api.adminUsers.assignCoach(userId, { coachId });
      await loadWorkspace();
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to save coach assignment.");
    }
  }

  async function loadHistory(userId: string) {
    try {
      const history = await api.coachUsers.history(userId);
      setHistories((current) => ({ ...current, [userId]: history }));
      setNoteDrafts((current) => ({ ...current, [userId]: history.note?.note ?? "" }));
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to load user history.");
    }
  }

  async function assignWorkout(userId: string) {
    const workoutId = workoutSelections[userId];

    if (!workoutId) {
      setError("Choose a published workout before assigning it.");
      return;
    }

    try {
      await api.coachUsers.assignWorkout(userId, {
        workoutId
      });
      await loadWorkspace();
      await loadHistory(userId);
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to assign workout.");
    }
  }

  async function saveNote(userId: string) {
    try {
      const history = await api.coachUsers.saveNote(userId, {
        note: noteDrafts[userId] ?? ""
      });
      setHistories((current) => ({ ...current, [userId]: history }));
    } catch (unknownError) {
      const apiError = unknownError as ApiError;
      setError(apiError.message || "Unable to save coach note.");
    }
  }

  if (!session) {
    return null;
  }

  if (session.user.role === "admin") {
    const activeCoaches = adminUsers.filter(
      (user) => user.role === "coach" && user.status === "active"
    );
    const pendingUsers = adminUsers.filter((user) => user.status === "pending_approval");
    const activeUsers = adminUsers.filter((user) => user.role === "user" && user.status === "active");

    return (
      <div className="stack">
        <section className="hero">
          <div className="hero-panel">
            <p className="eyebrow">Users</p>
            <h1 className="display-title">Approve access and map users to coaches.</h1>
            <p className="display-copy">
              Admins handle privileged access approvals and coach assignments in Phase 1.
            </p>
            {error ? <p className="error-banner">{error}</p> : null}
          </div>
          <SectionCard
            title="Workspace counts"
            description="Quick status across approvals, users, and coach capacity."
          >
            <div className="stack-tight">
              <div className="pill">
                <strong>Pending approvals</strong> {pendingUsers.length}
              </div>
              <div className="pill">
                <strong>Active coaches</strong> {activeCoaches.length}
              </div>
              <div className="pill">
                <strong>Active users</strong> {activeUsers.length}
              </div>
            </div>
          </SectionCard>
        </section>

        <section className="admin-card">
          <p className="eyebrow">Pending privileged access</p>
          <div className="stack-tight">
            {pendingUsers.map((user) => (
              <div className="exercise-card" key={user.id}>
                <div className="button-row">
                  <div>
                    <strong>{user.displayName}</strong>
                    <p className="muted" style={{ marginTop: 6 }}>
                      {user.email} requested {user.requestedRole}
                    </p>
                  </div>
                  <button
                    className="button button-primary"
                    onClick={() => void approveRole(user.id)}
                    type="button"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
            {pendingUsers.length === 0 ? <p className="muted">No pending approvals.</p> : null}
          </div>
        </section>

        <section className="admin-card">
          <p className="eyebrow">User directory</p>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Coach</th>
                <th>Assign coach</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.displayName}</strong>
                    <br />
                    <span className="muted">{user.email}</span>
                  </td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                  <td>{user.coachDisplayName ?? "Unassigned"}</td>
                  <td>
                    {user.role === "user" && user.status === "active" ? (
                      <div className="inline-action">
                        <select
                          onChange={(event) =>
                            setCoachSelections((current) => ({
                              ...current,
                              [user.id]: event.target.value
                            }))
                          }
                          value={coachSelections[user.id] ?? ""}
                        >
                          <option value="">Choose coach</option>
                          {activeCoaches.map((coach) => (
                            <option key={coach.id} value={coach.id}>
                              {coach.displayName}
                            </option>
                          ))}
                        </select>
                        <button
                          className="button button-secondary"
                          onClick={() => void assignCoach(user.id)}
                          type="button"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span className="muted">No action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-panel">
          <p className="eyebrow">Coach Workspace</p>
          <h1 className="display-title">Assigned users, workouts, and notes.</h1>
          <p className="display-copy">
            Coaches can assign published workouts, review session history, and maintain one note per user.
          </p>
          {error ? <p className="error-banner">{error}</p> : null}
        </div>
        <SectionCard
          title="Coach queue"
          description="This workspace only shows users assigned to the signed-in coach."
        >
          <div className="stack-tight">
            <div className="pill">
              <strong>Users</strong> {coachUsers.length}
            </div>
            <div className="pill">
              <strong>Published workouts</strong> {publishedWorkouts.length}
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="stack">
        {coachUsers.map((user) => {
          const history = histories[user.id];

          return (
            <div className="admin-card" key={user.id}>
              <div className="button-row">
                <div>
                  <p className="eyebrow">Assigned user</p>
                  <h2 style={{ margin: 0 }}>{user.displayName}</h2>
                  <p className="muted" style={{ marginTop: 8 }}>
                    {user.email}
                  </p>
                </div>
                <button
                  className="button button-secondary"
                  onClick={() => void loadHistory(user.id)}
                  type="button"
                >
                  {history ? "Refresh detail" : "Load detail"}
                </button>
              </div>

              <div className="form-grid" style={{ marginTop: 16 }}>
                <div className="field">
                  <label htmlFor={`workout-${user.id}`}>Assign published workout</label>
                  <select
                    id={`workout-${user.id}`}
                    onChange={(event) =>
                      setWorkoutSelections((current) => ({
                        ...current,
                        [user.id]: event.target.value
                      }))
                    }
                    value={workoutSelections[user.id] ?? ""}
                  >
                    <option value="">Choose workout</option>
                    {publishedWorkouts.map((workout) => (
                      <option key={workout.id} value={workout.id}>
                        {workout.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ alignSelf: "end" }}>
                  <button
                    className="button button-primary"
                    onClick={() => void assignWorkout(user.id)}
                    type="button"
                  >
                    Assign workout
                  </button>
                </div>
              </div>

              <div className="pill-row" style={{ marginTop: 16 }}>
                {user.assignedWorkouts.map((assignment) => (
                  <span className="pill" key={assignment.id}>
                    <strong>{assignment.workoutTitle}</strong>
                  </span>
                ))}
                {user.assignedWorkouts.length === 0 ? <span className="muted">No assigned workouts yet.</span> : null}
              </div>

              <div className="field" style={{ marginTop: 16 }}>
                <label htmlFor={`note-${user.id}`}>Coach note</label>
                <textarea
                  id={`note-${user.id}`}
                  onChange={(event) =>
                    setNoteDrafts((current) => ({
                      ...current,
                      [user.id]: event.target.value
                    }))
                  }
                  rows={4}
                  value={noteDrafts[user.id] ?? ""}
                />
              </div>
              <div className="button-row" style={{ marginTop: 12 }}>
                <button
                  className="button button-secondary"
                  onClick={() => void saveNote(user.id)}
                  type="button"
                >
                  Save note
                </button>
                <span className="muted">
                  Last completion: {user.lastCompletedSessionAt ? new Date(user.lastCompletedSessionAt).toLocaleString() : "none"}
                </span>
              </div>

              {history ? (
                <div className="stack-tight" style={{ marginTop: 18 }}>
                  <p className="eyebrow">Workout history</p>
                  {history.sessions.map((sessionRecord) => (
                    <div className="exercise-card" key={sessionRecord.id}>
                      <div className="button-row">
                        <strong>{sessionRecord.workoutTitle}</strong>
                        <span className="status">{sessionRecord.status}</span>
                      </div>
                      <p className="muted">
                        {sessionRecord.completedExercises}/{sessionRecord.totalExercises} exercises completed
                      </p>
                      <p className="muted">
                        Started {new Date(sessionRecord.startedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {history.sessions.length === 0 ? <p className="muted">No completed workout history yet.</p> : null}
                </div>
              ) : null}
            </div>
          );
        })}
        {coachUsers.length === 0 ? <p className="muted">No users are assigned to this coach yet.</p> : null}
      </section>
    </div>
  );
}
