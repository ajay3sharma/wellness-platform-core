import type { BrandKey, Role } from "@platform/types";

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
