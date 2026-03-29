import { getAdminAiQuotaPolicy } from "@platform/ai";
import { adminBrand } from "../../../lib/brand";
import { SectionCard } from "../../../components/section-card";

const quota = getAdminAiQuotaPolicy(adminBrand);

export default function ContentPage() {
  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-panel">
          <p className="eyebrow">Content Studio</p>
          <h1 className="display-title">Manage workouts, wellness, and AI drafts.</h1>
          <p className="display-copy">
            This scaffold keeps content tools visible without hardcoding product-specific labels outside brand config.
          </p>
        </div>
        <SectionCard
          title="AI constraints"
          description="Free-tier-only admin generation with graceful fallback once quota is spent."
        >
          <div className="stack-tight">
            <div className="pill">
              <strong>Actions</strong> {quota.maxActionsPerDay}/day
            </div>
            <div className="pill">
              <strong>Brand pool</strong> {quota.maxBrandActionsPerDay}/day
            </div>
            <div className="pill">
              <strong>Mode</strong> disable on limit
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="section-grid cols-2">
        <SectionCard
          title="Workout pipeline"
          description="Placeholder workflows for creating and publishing workouts."
        >
          <div className="stack-tight">
            <div className="pill">Draft workout</div>
            <div className="pill">Assign coach</div>
            <div className="pill">Publish to users</div>
          </div>
        </SectionCard>
        <SectionCard
          title="Relaxation pipeline"
          description="Placeholder workflows for guided sessions and media management."
        >
          <div className="stack-tight">
            <div className="pill">Write session copy</div>
            <div className="pill">Attach audio or video</div>
            <div className="pill">Schedule release</div>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
