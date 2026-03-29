import type { CurrentUser } from "@platform/types";

export interface RequestWithUser {
  headers: Record<string, string | string[] | undefined>;
  user?: CurrentUser;
}
