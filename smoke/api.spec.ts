import { expect, test } from "@playwright/test";
import { apiBaseUrl, loginByApi, smokeUsers } from "./support";

test.describe("API smoke", () => {
  test("health and readiness endpoints respond with dependency snapshots", async ({ request }) => {
    const healthResponse = await request.get(`${apiBaseUrl}/health`);
    expect(healthResponse.ok()).toBeTruthy();

    const readinessResponse = await request.get(`${apiBaseUrl}/health/readiness`);
    expect(readinessResponse.ok()).toBeTruthy();

    const readiness = await readinessResponse.json();
    expect(readiness.service).toBe("api");
    expect(Array.isArray(readiness.dependencies)).toBeTruthy();
    expect(readiness.dependencies.map((entry: { key: string }) => entry.key)).toEqual(
      expect.arrayContaining(["database", "billing", "ai"])
    );

    const database = readiness.dependencies.find(
      (entry: { key: string }) => entry.key === "database"
    );
    expect(database.status).toBe("ok");
  });

  test("trace ids are echoed on authorization failures", async ({ request }) => {
    const response = await request.get(`${apiBaseUrl}/store/cart`, {
      headers: {
        "x-request-id": "phase-5-smoke-trace"
      }
    });

    expect(response.status()).toBe(401);
    expect(response.headers()["x-request-id"]).toBe("phase-5-smoke-trace");

    const payload = await response.json();
    expect(payload.traceId).toBe("phase-5-smoke-trace");
  });

  test("auth lifecycle works and logout invalidates refresh", async ({ request }) => {
    const session = await loginByApi(request, smokeUsers.user);
    expect(session.user.email).toBe(smokeUsers.user.email);

    const refreshResponse = await request.post(`${apiBaseUrl}/auth/refresh`, {
      data: {
        refreshToken: session.tokens.refreshToken
      }
    });
    expect(refreshResponse.ok()).toBeTruthy();

    const logoutResponse = await request.post(`${apiBaseUrl}/auth/logout`, {
      data: {
        refreshToken: session.tokens.refreshToken
      }
    });
    expect(logoutResponse.ok()).toBeTruthy();

    const secondRefresh = await request.post(`${apiBaseUrl}/auth/refresh`, {
      data: {
        refreshToken: session.tokens.refreshToken
      }
    });
    expect(secondRefresh.status()).toBe(401);
  });

  test("role access matrix blocks user and coach from admin routes", async ({ request }) => {
    const adminSession = await loginByApi(request, smokeUsers.admin);
    const coachSession = await loginByApi(request, smokeUsers.coach);
    const userSession = await loginByApi(request, smokeUsers.user);

    const adminResponse = await request.get(`${apiBaseUrl}/admin/workouts`, {
      headers: {
        authorization: `Bearer ${adminSession.tokens.accessToken}`
      }
    });
    expect(adminResponse.ok()).toBeTruthy();

    const coachUsersResponse = await request.get(`${apiBaseUrl}/coach/users`, {
      headers: {
        authorization: `Bearer ${coachSession.tokens.accessToken}`
      }
    });
    expect(coachUsersResponse.ok()).toBeTruthy();

    const coachAdminResponse = await request.get(`${apiBaseUrl}/admin/workouts`, {
      headers: {
        authorization: `Bearer ${coachSession.tokens.accessToken}`
      }
    });
    expect(coachAdminResponse.status()).toBe(403);

    const userAdminResponse = await request.get(`${apiBaseUrl}/admin/workouts`, {
      headers: {
        authorization: `Bearer ${userSession.tokens.accessToken}`
      }
    });
    expect(userAdminResponse.status()).toBe(403);
  });

  test("AI stays bootable and returns a graceful unavailable or disabled response without live Gemini config", async ({
    request
  }) => {
    const session = await loginByApi(request, smokeUsers.user);
    const response = await request.post(`${apiBaseUrl}/ai/recommendations/workout`, {
      headers: {
        authorization: `Bearer ${session.tokens.accessToken}`
      },
      data: {
        goal: "Mobility and recovery",
        availableMinutes: 20,
        preferredDifficulty: "beginner",
        focusTags: ["mobility"]
      }
    });

    expect([200, 503]).toContain(response.status());

    if (response.status() === 503) {
      const payload = await response.json();
      expect(["AI_TEMPORARILY_UNAVAILABLE", "AI_DISABLED"]).toContain(payload.code);
      expect(payload.traceId).toBeTruthy();
    }
  });
});
