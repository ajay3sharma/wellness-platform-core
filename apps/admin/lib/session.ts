import type { CurrentUser, Role } from "@platform/types";
import { adminBrand } from "./brand";

const demoRole = (process.env.ADMIN_ROLE as Role | undefined) ?? "admin";

export function getDemoUser(): CurrentUser {
  return {
    id: "admin-demo-user",
    email: adminBrand.supportEmail,
    displayName: demoRole === "coach" ? "Coach Aarya" : "Asha Verma",
    role: demoRole,
    activeBrand: adminBrand.key,
    coachId: demoRole === "coach" ? "coach-demo-user" : null
  };
}
