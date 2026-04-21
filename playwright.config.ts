import { defineConfig } from "@playwright/test";

const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: "./smoke",
  fullyParallel: false,
  reporter: "list",
  timeout: 60_000,
  use: {
    trace: "retain-on-failure"
  },
  webServer: [
    {
      command: "corepack pnpm dev:api",
      url: "http://localhost:4000/api/v1/health",
      reuseExistingServer,
      timeout: 240_000
    },
    {
      command: "corepack pnpm dev:web",
      url: "http://localhost:3000/store",
      reuseExistingServer,
      timeout: 240_000
    },
    {
      command: "corepack pnpm dev:admin",
      url: "http://localhost:3001/login",
      reuseExistingServer,
      timeout: 240_000
    }
  ]
});
