import { expect, test } from "@playwright/test";
import { adminBaseUrl, smokeUsers } from "./support";

test.describe("Admin smoke", () => {
  test("login and request-access pages render", async ({ page }) => {
    await page.goto(`${adminBaseUrl}/login`);
    await expect(
      page.getByRole("heading", { name: "Operate programs, coaches, and commerce from one control room." })
    ).toBeVisible();

    await page.goto(`${adminBaseUrl}/request-access`);
    await expect(page.getByRole("heading", { name: "Request coach or admin access." })).toBeVisible();
  });

  test("bootstrap admin can sign in and reach dashboard, content, and commerce", async ({ page }) => {
    await page.goto(`${adminBaseUrl}/login`);
    await page.getByLabel("Email").fill(smokeUsers.admin.email);
    await page.getByLabel("Password").fill(smokeUsers.admin.password);
    await page.getByRole("button", { name: "Enter workspace" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.locator("h1", { hasText: "Operate programs, coaches, and commerce from one control room." })
    ).toBeVisible();

    await page.goto(`${adminBaseUrl}/content`);
    await expect(
      page.getByRole("heading", { name: "Manage workouts and wellness content in one place." })
    ).toBeVisible();

    await page.goto(`${adminBaseUrl}/commerce`);
    await expect(
      page.getByRole("heading", { name: "Manage products, plans, and billing operations." })
    ).toBeVisible();
  });

  test("coach stays out of admin-only authoring areas", async ({ page }) => {
    await page.goto(`${adminBaseUrl}/login`);
    await page.getByLabel("Email").fill(smokeUsers.coach.email);
    await page.getByLabel("Password").fill(smokeUsers.coach.password);
    await page.getByRole("button", { name: "Enter workspace" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("link", { name: "Content" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Commerce" })).toHaveCount(0);

    await page.goto(`${adminBaseUrl}/content`);
    await expect(page.getByRole("heading", { name: "Admin-only workspace" })).toBeVisible();
  });
});
