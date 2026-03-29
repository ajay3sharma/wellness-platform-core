import { getDemoUser } from "../../../lib/session";
import { SectionCard } from "../../../components/section-card";

const rows = [
  {
    name: "Meera Kapoor",
    role: "user",
    coach: "Asha Verma",
    status: "Active"
  },
  {
    name: "Rohit Malhotra",
    role: "user",
    coach: "Coach Aarya",
    status: "Needs review"
  },
  {
    name: "Coach Aarya",
    role: "coach",
    coach: "Self-managed",
    status: "On duty"
  }
];

export default function UsersPage() {
  const user = getDemoUser();

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-panel">
          <p className="eyebrow">Users</p>
          <h1 className="display-title">Role-aware user operations.</h1>
          <p className="display-copy">
            Start with demo data, then plug in the real auth and user management flows from the API.
          </p>
        </div>
        <SectionCard
          title="Current access"
          description="The visible actions on this page depend on the signed-in role."
        >
          <div className="stack-tight">
            <div className="pill">
              <strong>User</strong> {user.displayName}
            </div>
            <div className="pill">
              <strong>Role</strong> {user.role}
            </div>
            <div className="pill">
              <strong>Coach id</strong> {user.coachId ?? "none"}
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="admin-card">
        <p className="eyebrow">Directory</p>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Coach</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.role}</td>
                <td>{row.coach}</td>
                <td>
                  <span className="status">{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
