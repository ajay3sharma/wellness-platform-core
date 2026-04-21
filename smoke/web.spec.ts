import { expect, test } from "@playwright/test";
import { smokeUsers, webBaseUrl } from "./support";

test.describe("Web smoke", () => {
  test("store and signed-out account pages render", async ({ page }) => {
    await page.goto(`${webBaseUrl}/store`);
    await expect(page.getByRole("heading", { name: "Digital products and memberships" })).toBeVisible();

    await page.goto(`${webBaseUrl}/account`);
    await expect(page.getByRole("heading", { name: "Sign in to view orders and plans" })).toBeVisible();
  });

  test("user can sign in and reach the live account page", async ({ page }) => {
    await page.goto(`${webBaseUrl}/login`);
    await expect(page.getByRole("heading", { name: "Sign in or create your account" })).toBeVisible();

    await page.getByPlaceholder("Email").first().fill(smokeUsers.user.email);
    await page.getByPlaceholder("Password").first().fill(smokeUsers.user.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole("heading", { name: "Orders, entitlements, and subscription state" })).toBeVisible();
  });

  test("checkout bridge handles missing params safely", async ({ page }) => {
    await page.goto(`${webBaseUrl}/checkout/launch`);
    await expect(page.getByRole("heading", { name: "Preparing your checkout" })).toBeVisible();
    await expect(page.getByText("Missing checkout session parameters.")).toBeVisible();
  });
});
