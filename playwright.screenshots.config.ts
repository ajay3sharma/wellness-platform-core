import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./screenshots",
  outputDir: process.env.PLAYWRIGHT_ARTIFACT_DIR ?? "test-results/screenshots/playwright",
  fullyParallel: false,
  globalTeardown: "./screenshots/global-teardown.ts",
  reporter: "list",
  timeout: 90_000,
  workers: 1,
  use: {
    trace: "retain-on-failure"
  }
});
