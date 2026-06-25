import { expect, test } from "@playwright/test";
import {
  adminBaseUrl,
  capturePage,
  desktopViewport,
  expectThemeMode,
  signInAdminUser
} from "./support";

test.describe("Admin screenshots", () => {
  test("capture admin and coach workspace routes", async ({ browser }) => {
    const publicPage = await browser.newPage({
      viewport: desktopViewport
    });

    await publicPage.goto(`${adminBaseUrl}/login`);
    await expectThemeMode(publicPage, "light");
    await expect(
      publicPage.getByRole("heading", {
        name: "Programs, people, and payments."
      })
    ).toBeVisible();
    await capturePage(publicPage, "admin", "login");

    await publicPage.goto(`${adminBaseUrl}/request-access`);
    await expectThemeMode(publicPage, "light");
    await expect(
      publicPage.getByRole("heading", { name: "Request coach or admin access." })
    ).toBeVisible();
    await capturePage(publicPage, "admin", "request-access");

    const adminPage = await browser.newPage({
      viewport: desktopViewport
    });
    await signInAdminUser(adminPage, "admin");
    await expectThemeMode(adminPage, "light");
    await expect(
      adminPage.locator("h1", {
        hasText: "Programs, people, and payments."
      })
    ).toBeVisible();
    await capturePage(adminPage, "admin", "dashboard-admin");

    await adminPage.goto(`${adminBaseUrl}/users`);
    await expect(
      adminPage.getByRole("heading", { name: "Approve access and map users to coaches." })
    ).toBeVisible();
    await capturePage(adminPage, "admin", "users-admin");

    await adminPage.goto(`${adminBaseUrl}/content`);
    await expectThemeMode(adminPage, "light");
    await expect(
      adminPage.getByRole("heading", { name: "Manage workouts and wellness content." })
    ).toBeVisible();
    await capturePage(adminPage, "admin", "content-admin");

    await adminPage.goto(`${adminBaseUrl}/commerce`);
    await expectThemeMode(adminPage, "light");
    await expect(
      adminPage.getByRole("heading", { name: "Manage products, plans, and billing operations." })
    ).toBeVisible();
    await capturePage(adminPage, "admin", "commerce-admin");

    await adminPage.goto(`${adminBaseUrl}/dashboard`);
    await adminPage.getByRole("tab", { name: "Dark" }).click();
    await expectThemeMode(adminPage, "dark");
    await adminPage.reload();
    await expectThemeMode(adminPage, "dark");
    await expect(
      adminPage.locator("h1", {
        hasText: "Programs, people, and payments."
      })
    ).toBeVisible();
    await capturePage(adminPage, "admin", "dashboard-admin-dark");

    await adminPage.goto(`${adminBaseUrl}/content`);
    await expectThemeMode(adminPage, "dark");
    await expect(
      adminPage.getByRole("heading", { name: "Manage workouts and wellness content." })
    ).toBeVisible();
    await capturePage(adminPage, "admin", "content-admin-dark");

    const coachPage = await browser.newPage({
      viewport: desktopViewport
    });
    await signInAdminUser(coachPage, "coach");
    await expect(
      coachPage.locator("h1", {
        hasText: "Programs, people, and payments."
      })
    ).toBeVisible();
    await capturePage(coachPage, "admin", "dashboard-coach");

    await coachPage.goto(`${adminBaseUrl}/users`);
    await expect(
      coachPage.getByRole("heading", { name: "Assigned users, workouts, and notes." })
    ).toBeVisible();
    await capturePage(coachPage, "admin", "users-coach");

    await coachPage.goto(`${adminBaseUrl}/content`);
    await expect(coachPage.getByRole("heading", { name: "Admin-only workspace" })).toBeVisible();
    await capturePage(coachPage, "admin", "content-denied-coach");
  });
});
