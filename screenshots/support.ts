import path from "node:path";
import { mkdir } from "node:fs/promises";
import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { THEME_MODE_STORAGE_KEY } from "@platform/ui";
import { loginByApi, smokeUsers } from "../smoke/support";

export const apiBaseUrl = process.env.SCREENSHOT_API_URL ?? process.env.SMOKE_API_URL ?? "http://localhost:4000/api/v1";
export const webBaseUrl = process.env.SCREENSHOT_WEB_URL ?? process.env.SMOKE_WEB_URL ?? "http://localhost:3000";
export const adminBaseUrl =
  process.env.SCREENSHOT_ADMIN_URL ?? process.env.SMOKE_ADMIN_URL ?? "http://localhost:3001";
export const mobileBaseUrl = process.env.SCREENSHOT_MOBILE_URL ?? "http://localhost:8082";
export const screenshotRoot =
  process.env.PLAYWRIGHT_SCREENSHOT_DIR ??
  path.join(process.cwd(), "test-results", "screenshots");
const WEB_SESSION_STORAGE_KEY = "platform.mobile.session";

export const desktopViewport = {
  width: 1440,
  height: 1200
};

export const mobileViewport = {
  width: 430,
  height: 932
};

interface FixtureIds {
  workoutId: string;
  workoutTitle: string;
  workoutSessionId: string;
  relaxationId: string;
  relaxationTitle: string;
  musicTrackId: string;
  musicTrackTitle: string;
}

async function authorizedJson<T>(
  request: APIRequestContext,
  route: string,
  accessToken: string
): Promise<T> {
  const response = await request.get(`${apiBaseUrl}${route}`, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });

  expect(response.ok()).toBeTruthy();
  return (await response.json()) as T;
}

export async function resolveFixtureIds(request: APIRequestContext): Promise<FixtureIds> {
  const session = await loginByApi(request, smokeUsers.user);

  const [workouts, workoutSessions, relaxation, music] = await Promise.all([
    authorizedJson<Array<{ id: string; title: string }>>(request, "/workouts", session.tokens.accessToken),
    authorizedJson<Array<{ id: string }>>(request, "/workout-sessions/me", session.tokens.accessToken),
    authorizedJson<Array<{ id: string; title: string }>>(
      request,
      "/wellness/relaxation",
      session.tokens.accessToken
    ),
    authorizedJson<Array<{ id: string; title: string }>>(
      request,
      "/wellness/music",
      session.tokens.accessToken
    )
  ]);

  const workout = workouts[0];
  const workoutSession = workoutSessions[0];
  const relaxationTechnique = relaxation[0];
  const musicTrack = music[0];

  expect(workout).toBeTruthy();
  expect(workoutSession).toBeTruthy();
  expect(relaxationTechnique).toBeTruthy();
  expect(musicTrack).toBeTruthy();

  return {
    workoutId: workout.id,
    workoutTitle: workout.title,
    workoutSessionId: workoutSession.id,
    relaxationId: relaxationTechnique.id,
    relaxationTitle: relaxationTechnique.title,
    musicTrackId: musicTrack.id,
    musicTrackTitle: musicTrack.title
  };
}

export async function capturePage(page: Page, surface: string, name: string) {
  const targetPath = path.join(screenshotRoot, surface, `${name}.png`);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await page.screenshot({
    fullPage: true,
    path: targetPath
  });
}

export async function expectThemeMode(page: Page, mode: "light" | "dark") {
  await expect
    .poll(async () => page.evaluate(() => document.documentElement.dataset.theme ?? "light"))
    .toBe(mode);
}

export async function setBrowserThemeMode(page: Page, mode: "light" | "dark") {
  await page.addInitScript(
    ([storageKey, themeMode]) => {
      globalThis.localStorage?.setItem(storageKey, themeMode);
    },
    [THEME_MODE_STORAGE_KEY, mode] as const
  );
}

export async function signInWebUser(page: Page) {
  await page.goto(`${webBaseUrl}/login`);
  await expect(page.getByRole("heading", { name: "Sign in or create your account" })).toBeVisible();
  await page.getByPlaceholder("Email").first().fill(smokeUsers.user.email);
  await page.getByPlaceholder("Password").first().fill(smokeUsers.user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

export async function signInAdminUser(page: Page, role: "admin" | "coach") {
  const credentials = smokeUsers[role];

  await page.goto(`${adminBaseUrl}/login`);
  await expect(
    page.getByRole("heading", {
      name: "Programs, people, and payments."
    })
  ).toBeVisible();
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Enter workspace" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function signInMobileUser(page: Page) {
  await page.goto(`${mobileBaseUrl}/sign-in`);
  await expect(page.getByText("Sign in to continue your workout plan.")).toBeVisible();
  await page.getByPlaceholder("Email address").fill(smokeUsers.user.email);
  await page.getByPlaceholder("Password").fill(smokeUsers.user.password);
  await page.getByText(/^Enter /).click();
  await page.waitForFunction(
    (storageKey) => globalThis.sessionStorage?.getItem(storageKey),
    WEB_SESSION_STORAGE_KEY,
    {
      timeout: 15_000
    }
  );
  await page.goto(`${mobileBaseUrl}/`);
  await expect(page.getByText("Start workout")).toBeVisible({
    timeout: 15_000
  });
}

export async function bootstrapMobileUserSession(page: Page, request: APIRequestContext) {
  const session = await loginByApi(request, smokeUsers.user);
  const serializedSession = JSON.stringify(session);

  await page.addInitScript(
    ([storageKey, nextSession]) => {
      globalThis.sessionStorage?.setItem(storageKey, nextSession);
    },
    [WEB_SESSION_STORAGE_KEY, serializedSession] as const
  );
}

export async function delayClientRedirects(page: Page, minimumDelayMs: number) {
  await page.addInitScript((delay) => {
    const nativeSetTimeout = globalThis.setTimeout.bind(globalThis);

    globalThis.setTimeout = ((callback: TimerHandler, timeout?: number, ...args: unknown[]) =>
      nativeSetTimeout(callback, Math.max(timeout ?? 0, delay), ...args)) as typeof setTimeout;
  }, minimumDelayMs);
}
