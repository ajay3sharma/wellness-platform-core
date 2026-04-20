import type { Role } from "@platform/types";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  roles: Role[];
}

export const navigationGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Workspace",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        description: "Overview and platform health.",
        roles: ["admin", "coach"]
      },
      {
        href: "/users",
        label: "Users",
        description: "Search, inspect, and assign users.",
        roles: ["admin", "coach"]
      },
      {
        href: "/content",
        label: "Content",
        description: "Workouts, relaxation, and publishing tools.",
        roles: ["admin"]
      },
      {
        href: "/commerce",
        label: "Commerce",
        description: "Products, plans, orders, and subscriptions.",
        roles: ["admin"]
      }
    ]
  },
  {
    label: "Access",
    items: [
      {
        href: "/login",
        label: "Login",
        description: "Demo sign-in and access gate.",
        roles: ["admin", "coach", "user"]
      }
    ]
  }
];

export function getVisibleNavigation(role: Role) {
  return navigationGroups.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => item.roles.includes(role))
  }));
}
