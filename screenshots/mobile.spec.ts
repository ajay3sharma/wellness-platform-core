import { expect, test } from "@playwright/test";
import {
  capturePage,
  bootstrapMobileUserSession,
  delayClientRedirects,
  expectThemeMode,
  mobileBaseUrl,
  mobileViewport,
  resolveFixtureIds
} from "./support";

test.describe("Mobile screenshots", () => {
  test("capture mobile auth routes", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: mobileViewport,
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true
    });
    const page = await context.newPage();

    await page.goto(`${mobileBaseUrl}/sign-in`, { waitUntil: "domcontentloaded" });
    await expectThemeMode(page, "light");
    await expect(page.getByText("Sign in to continue your workout plan.")).toBeVisible();
    await capturePage(page, "mobile", "sign-in");

    await page.goto(`${mobileBaseUrl}/sign-up`, { waitUntil: "domcontentloaded" });
    await expectThemeMode(page, "light");
    await expect(page.getByText("Create your training account.")).toBeVisible();
    await capturePage(page, "mobile", "sign-up");
  });

  test("capture signed-in mobile routes and dynamic detail screens", async ({ browser, request }) => {
    const context = await browser.newContext({
      viewport: mobileViewport,
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true
    });
    const page = await context.newPage();
    const fixtureIds = await resolveFixtureIds(request);

    await bootstrapMobileUserSession(page, request);
    await page.goto(`${mobileBaseUrl}/`, { waitUntil: "domcontentloaded" });
    await expectThemeMode(page, "light");
    await expect(page.getByText("Start workout")).toBeVisible({ timeout: 15_000 });
    await capturePage(page, "mobile", "home");

    await page.getByLabel("dark mode").click();
    await expectThemeMode(page, "dark");
    await page.reload();
    await page.goto(`${mobileBaseUrl}/`, { waitUntil: "domcontentloaded" });
    await expectThemeMode(page, "dark");
    await expect(page.getByText("Start workout")).toBeVisible({ timeout: 15_000 });
    await capturePage(page, "mobile", "home-dark");

    await page.goto(`${mobileBaseUrl}/workouts`, { waitUntil: "domcontentloaded" });
    await expectThemeMode(page, "dark");
    await expect(page.getByText("Published sessions")).toBeVisible();
    await expect(page.getByText("Loading workouts...")).not.toBeVisible({ timeout: 15_000 });
    await capturePage(page, "mobile", "workouts-dark");

    await page.goto(`${mobileBaseUrl}/workouts/${fixtureIds.workoutId}`, {
      waitUntil: "domcontentloaded"
    });
    await expect(page.getByText("Workout detail")).toBeVisible({ timeout: 15_000 });
    await capturePage(page, "mobile", "workout-detail");

    await page.goto(`${mobileBaseUrl}/workout-sessions/${fixtureIds.workoutSessionId}`, {
      waitUntil: "domcontentloaded"
    });
    await expect(page.getByText("Active workout")).toBeVisible({ timeout: 15_000 });
    await capturePage(page, "mobile", "workout-session");

    await page.goto(`${mobileBaseUrl}/progress`, { waitUntil: "domcontentloaded" });
    await expectThemeMode(page, "dark");
    await expect(page.getByText("Workout history")).toBeVisible();
    await expect(page.getByText("Loading history...")).not.toBeVisible({ timeout: 15_000 });
    await capturePage(page, "mobile", "progress");

    await page.goto(`${mobileBaseUrl}/reset`, { waitUntil: "domcontentloaded" });
    await expectThemeMode(page, "dark");
    await expect(page.getByText("Wellness rituals")).toBeVisible();
    await expect(page.getByText("Quote and panchang")).toBeVisible();
    await expect(page.getByText("Loading wellness content...")).not.toBeVisible({ timeout: 15_000 });
    await capturePage(page, "mobile", "reset-dark");

    await page.goto(`${mobileBaseUrl}/relaxation/${fixtureIds.relaxationId}`, {
      waitUntil: "domcontentloaded"
    });
    await expect(page.getByText("Start relaxation", { exact: true })).toBeVisible({
      timeout: 15_000
    });
    await capturePage(page, "mobile", "relaxation-detail");

    await page.goto(`${mobileBaseUrl}/music/${fixtureIds.musicTrackId}`, {
      waitUntil: "domcontentloaded"
    });
    await expect(page.getByText("Ready to play", { exact: true })).toBeVisible({
      timeout: 15_000
    });
    await capturePage(page, "mobile", "music-detail");

    await page.goto(`${mobileBaseUrl}/store`, { waitUntil: "domcontentloaded" });
    await expectThemeMode(page, "dark");
    await expect(page.getByText("Products and memberships")).toBeVisible();
    await expect(page.getByText("Memberships", { exact: true })).toBeVisible();
    await expect(page.getByText("Loading store...")).not.toBeVisible({ timeout: 15_000 });
    await capturePage(page, "mobile", "store");

    await delayClientRedirects(page, 4_000);
    await page.goto(
      `${mobileBaseUrl}/checkout-return?status=success&checkoutSessionId=screenshot-session`,
      { waitUntil: "domcontentloaded" }
    );
    await expect(page.getByText("Returning to store")).toBeVisible();
    await capturePage(page, "mobile", "checkout-return");
  });
});
