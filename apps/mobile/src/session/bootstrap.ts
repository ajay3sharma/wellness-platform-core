import type { AuthSession } from "@platform/types";
import { createApiClient } from "@platform/sdk";

export async function bootstrapSession(
  accessToken?: string
): Promise<AuthSession | null> {
  const api = createApiClient({
    getAccessToken: () => accessToken
  });

  try {
    const user = await api.auth.me();
    if (!accessToken) {
      return null;
    }

    return {
      user,
      tokens: {
        accessToken,
        refreshToken: "",
        accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        refreshTokenExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  } catch {
    return null;
  }
}

