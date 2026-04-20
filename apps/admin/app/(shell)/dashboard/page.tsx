"use client";

import { createApiClient } from "@platform/sdk";
import type { AdminAiQuotaStatus } from "@platform/types";
import { useEffect, useMemo, useState } from "react";
import { SectionCard } from "../../../components/section-card";
import { StatCard } from "../../../components/stat-card";
import { adminMetadata, adminBasePath } from "../../../lib/brand";
import { useAdminSession } from "../../../lib/session";

interface DashboardSnapshot {
  primaryCount: string;
  primaryLabel: string;
  primaryDetail: string;
  secondaryCount: string;
  secondaryLabel: string;
  secondaryDetail: string;
}

function formatAdminAiValue(quota: AdminAiQuotaStatus | null, role: string) {
  if (role !== "admin") {
    return "Admin only";
  }

  if (!quota) {
    return "...";
  }

  return `${quota.remainingActions} left`;
}

function formatAdminAiDetail(quota: AdminAiQuotaStatus | null, role: string) {
  if (role !== "admin") {
    return "Coach workspaces stay outside AI authoring in Phase 4.";
  }

  if (!quota) {
    return "Loading AI quota and availability.";
  }

  const workoutStatus = quota.features.admin_workout_draft;
  const relaxationStatus = quota.features.admin_relaxation_draft;

  return `Brand cap ${quota.remainingBrandActions} left today. Workout drafts are ${workoutStatus.status}; relaxation drafts are ${relaxationStatus.status}.`;
}

export default function DashboardPage() {
  const { session } = useAdminSession();
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken: () => session?.tokens.accessToken
      }),
    [session]
  );
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [aiQuota, setAiQuota] = useState<AdminAiQuotaStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    void (async () => {
      try {
        setError(null);

        if (session.user.role === "admin") {
          const [users, workouts, nextAiQuota] = await Promise.all([
            api.adminUsers.list(),
            api.adminWorkouts.list(),
            api.ai.adminQuota()
          ]);
          const pendingApprovals = users.filter((user) => user.status === "pending_approval").length;
          const activeCoaches = users.filter(
            (user) => user.role === "coach" && user.status === "active"
          ).length;
          const publishedWorkouts = workouts.filter((workout) => workout.status === "published").length;
          const draftWorkouts = workouts.filter((workout) => workout.status === "draft").length;
          setAiQuota(nextAiQuota);

          setSnapshot({
            primaryCount: `${pendingApprovals}`,
            primaryLabel: "Pending approvals",
            primaryDetail: "Coach and admin access requests waiting for approval.",
            secondaryCount: `${publishedWorkouts}`,
            secondaryLabel: "Published workouts",
            secondaryDetail: `${draftWorkouts} drafts and ${activeCoaches} active coaches in the workspace.`
          });
          return;
        }

        const coachUsers = await api.coachUsers.list();
        setAiQuota(null);
        const assignedWorkouts = coachUsers.reduce(
          (total, user) => total + user.assignedWorkouts.length,
          0
        );
        const notedUsers = coachUsers.filter((user) => user.latestCoachNote).length;

        setSnapshot({
          primaryCount: `${coachUsers.length}`,
          primaryLabel: "Assigned users",
          primaryDetail: "People currently linked to this coach workspace.",
          secondaryCount: `${assignedWorkouts}`,
          secondaryLabel: "Assigned workouts",
          secondaryDetail: `${notedUsers} users already have a saved coach note.`
        });
      } catch (unknownError) {
        setError((unknownError as { message?: string }).message ?? "Unable to load dashboard.");
      }
    })();
  }, [api, session]);

  if (!session) {
    return null;
  }

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-panel">
          <p className="eyebrow">Dashboard</p>
          <h1 className="display-title">{adminMetadata.headline}</h1>
          <p className="display-copy">{adminMetadata.description}</p>
          <div className="pill-row">
            <span className="pill">
              <strong>Signed in</strong> {session.user.displayName}
            </span>
            <span className="pill">
              <strong>Role</strong> {session.user.role}
            </span>
            <span className="pill">
              <strong>Base path</strong> {adminBasePath}
            </span>
          </div>
          {error ? <p className="error-banner">{error}</p> : null}
        </div>

        <div className="stack">
          <StatCard
            label="Admin AI"
            value={formatAdminAiValue(aiQuota, session.user.role)}
            detail={formatAdminAiDetail(aiQuota, session.user.role)}
          />
          <StatCard
            label={snapshot?.primaryLabel ?? "Loading"}
            value={snapshot?.primaryCount ?? "..."}
            detail={snapshot?.primaryDetail ?? "Loading current workspace metrics."}
          />
          <StatCard
            label={snapshot?.secondaryLabel ?? "Loading"}
            value={snapshot?.secondaryCount ?? "..."}
            detail={snapshot?.secondaryDetail ?? "Resolving workout and coaching totals."}
          />
        </div>
      </section>

      <section className="section-grid cols-3">
        <SectionCard
          title="Programs"
          description="The current baseline now covers workouts, coaching workflows, and admin-managed wellness content."
        >
          <div className="stack-tight">
            <div className="pill">Persisted auth and protected routes</div>
            <div className="pill">Workout publish flow</div>
            <div className="pill">Wellness content studio</div>
            <div className="pill">Coach assignment workspace</div>
          </div>
        </SectionCard>
        <SectionCard
          title={session.user.role === "admin" ? "Admin focus" : "Coach focus"}
          description={
            session.user.role === "admin"
              ? "Approve privileged access, assign coaches, and manage the workout catalog."
              : "Review assigned users, assign workouts, and maintain coaching notes."
          }
        >
          <div className="stack-tight">
            <div className="pill">
              {session.user.role === "admin" ? "Pending access queue" : "Assigned user review"}
            </div>
            <div className="pill">
              {session.user.role === "admin" ? "Coach mapping" : "Workout assignment"}
            </div>
            <div className="pill">
              {session.user.role === "admin" ? "Workout publishing" : "Session history"}
            </div>
          </div>
        </SectionCard>
        <SectionCard
          title="Still next"
          description="Commerce is live, while web AI, coach-facing AI, and non-critical polish remain outside the current Phase 4 slice."
        >
          <div className="stack-tight">
            <div className="pill">No web AI surface yet</div>
            <div className="pill">No coach AI authoring</div>
            <div className="pill">No auto-publish from AI drafts</div>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
