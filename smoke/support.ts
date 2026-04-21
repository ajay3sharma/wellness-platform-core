import type { APIRequestContext } from "@playwright/test";

export const apiBaseUrl = process.env.SMOKE_API_URL ?? "http://localhost:4000/api/v1";
export const webBaseUrl = process.env.SMOKE_WEB_URL ?? "http://localhost:3000";
export const adminBaseUrl = process.env.SMOKE_ADMIN_URL ?? "http://localhost:3001";

export const smokeUsers = {
  admin: {
    email: process.env.API_BOOTSTRAP_ADMIN_EMAIL ?? "support@moveyou.app",
    password: process.env.API_BOOTSTRAP_ADMIN_PASSWORD ?? "dev-password"
  },
  coach: {
    email: "coach.smoke@moveyou.app",
    password: "dev-password"
  },
  user: {
    email: "user.smoke@moveyou.app",
    password: "dev-password"
  }
};

export async function loginByApi(
  request: APIRequestContext,
  credentials: { email: string; password: string }
) {
  const response = await request.post(`${apiBaseUrl}/auth/login`, {
    data: credentials
  });

  if (!response.ok()) {
    throw new Error(`Unable to sign in ${credentials.email}: ${response.status()}`);
  }

  return response.json();
}
