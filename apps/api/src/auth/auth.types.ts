import type { BrandKey, CurrentUser, Role } from "@platform/types";

export interface AccessTokenPayload {
  typ: "access";
  sid: string;
  sub: string;
  email: string;
  displayName: string;
  role: Role;
  activeBrand: BrandKey;
  coachId: string | null;
}

export interface RefreshTokenPayload {
  typ: "refresh";
  sid: string;
  jti: string;
  sub: string;
}

export interface StoredSession {
  sessionId: string;
  user: CurrentUser;
  refreshTokenId: string;
  expiresAt: string;
  revokedAt?: string;
}
