import { expect, test } from "@playwright/test";
import {
  capturePage,
  desktopViewport,
  expectThemeMode,
  signInWebUser,
  webBaseUrl
} from "./support";

test.describe("Web screenshots", () => {
  test("capture public and authenticated web routes", async ({ browser }) => {
    const page = await browser.newPage({
      viewport: desktopViewport
    });

    await page.goto(`${webBaseUrl}/`);
    await expectThemeMode(page, "light");
    await expect(page.getByRole("heading", { name: "Good morning" })).toBeVisible();
    await capturePage(page, "web", "home");

    await page.goto(`${webBaseUrl}/store`);
    await expectThemeMode(page, "light");
    await expect(page.getByRole("heading", { name: "Digital products and memberships" })).toBeVisible();
    await capturePage(page, "web", "store");

    await page.goto(`${webBaseUrl}/login`);
    await expectThemeMode(page, "light");
    await expect(page.getByRole("heading", { name: "Sign in or create your account" })).toBeVisible();
    await capturePage(page, "web", "login");

    await page.goto(`${webBaseUrl}/account`);
    await expectThemeMode(page, "light");
    await expect(page.getByRole("heading", { name: "Sign in to view orders and plans" })).toBeVisible();
    await capturePage(page, "web", "account-signed-out");

    await signInWebUser(page);
    await expect(page.getByRole("heading", { name: "Orders, products, and subscription" })).toBeVisible();
    await capturePage(page, "web", "account-signed-in");

    await page.goto(`${webBaseUrl}/checkout/launch`);
    await expect(page.getByRole("heading", { name: "Preparing your checkout" })).toBeVisible();
    await expect(page.getByText("Missing checkout session parameters.")).toBeVisible();
    await capturePage(page, "web", "checkout-launch");

    await page.goto(`${webBaseUrl}/checkout/success`);
    await expect(page.getByRole("heading", { name: "Payment submitted" })).toBeVisible();
    await capturePage(page, "web", "checkout-success");

    await page.goto(`${webBaseUrl}/checkout/cancel`);
    await expect(page.getByRole("heading", { name: "Checkout cancelled" })).toBeVisible();
    await capturePage(page, "web", "checkout-cancel");

    await page.goto(`${webBaseUrl}/`);
    await page.getByRole("tab", { name: "Dark" }).click();
    await expectThemeMode(page, "dark");
    await page.reload();
    await expectThemeMode(page, "dark");
    await expect(page.getByRole("heading", { name: "Good morning" })).toBeVisible();
    await capturePage(page, "web", "home-dark");

    await page.goto(`${webBaseUrl}/store`);
    await expectThemeMode(page, "dark");
    await expect(page.getByRole("heading", { name: "Digital products and memberships" })).toBeVisible();
    await capturePage(page, "web", "store-dark");
  });
});
