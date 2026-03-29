import { getAdminAiQuotaPolicy } from "@platform/ai";
import { adminBrand, adminMetadata, adminBasePath } from "../../../lib/brand";
import { getDemoUser } from "../../../lib/session";
import { SectionCard } from "../../../components/section-card";
import { StatCard } from "../../../components/stat-card";

export default function DashboardPage() {
  const user = getDemoUser();
  const quota = getAdminAiQuotaPolicy(adminBrand);

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-panel">
          <p className="eyebrow">Dashboard</p>
          <h1 className="display-title">{adminMetadata.headline}</h1>
          <p className="display-copy">{adminMetadata.description}</p>
          <div className="pill-row">
            <span className="pill">
              <strong>Signed in</strong> {user.displayName}
            </span>
            <span className="pill">
              <strong>Base path</strong> {adminBasePath}
            </span>
            <span className="pill">
              <strong>AI policy</strong> free tier only
            </span>
          </div>
        </div>

        <div className="stack">
          <StatCard
            label="Admin AI"
            value={`${quota.maxActionsPerDay} actions/day`}
            detail={`Brand cap ${quota.maxBrandActionsPerDay}/day, with graceful disable on quota exhaustion.`}
          />
          <StatCard
            label="Access"
            value={user.role.toUpperCase()}
            detail={`Role-aware shell currently rendering the ${user.role} experience.`}
          />
        </div>
      </section>

      <section className="section-grid cols-3">
        <SectionCard
          title="Programs"
          description="Shortcuts for workouts, progress, and scheduled assignments."
        >
          <div className="stack-tight">
            <div className="pill">Workout authoring queue</div>
            <div className="pill">Relaxation publishing backlog</div>
            <div className="pill">Coach assignments review</div>
          </div>
        </SectionCard>
        <SectionCard title="Commerce" description="Placeholder entry points for catalog and order operations.">
          <div className="stack-tight">
            <div className="pill">Product catalog sync</div>
            <div className="pill">Orders awaiting review</div>
            <div className="pill">Inventory health</div>
          </div>
        </SectionCard>
        <SectionCard title="Operations" description="Admin actions that stay visible during scaffold mode.">
          <div className="stack-tight">
            <div className="pill">Invite coaches</div>
            <div className="pill">Check audit trail</div>
            <div className="pill">Review AI draft usage</div>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
