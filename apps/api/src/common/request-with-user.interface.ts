import type { CurrentUser } from "@platform/types";

export interface RequestWithUser {
  headers: Record<string, string | string[] | undefined>;
  method?: string;
  originalUrl?: string;
  path?: string;
  url?: string;
  requestId?: string;
  user?: CurrentUser;
}
