import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.STRAPI_BASE_URL ?? "http://localhost:1337";
const databaseFilename = `.tmp/playwright-${process.pid}.db`;

export default defineConfig({
  testDir: "./admin/test",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "cd ../../apps/playground/ && pnpm run dev",
    url: "http://localhost:1337",
    reuseExistingServer: !process.env.CI,
    env: {
      APP_KEYS: "test-app-key-1,test-app-key-2,test-app-key-3,test-app-key-4",
      API_TOKEN_SALT: "test-api-token-salt",
      ADMIN_JWT_SECRET: "test-admin-jwt-secret",
      TRANSFER_TOKEN_SALT: "test-transfer-token-salt",
      ENCRYPTION_KEY: "test-encryption-key-1234567890",
      JWT_SECRET: "test-jwt-secret",
      BETTER_AUTH_URL: "http://localhost:1337",
      DATABASE_FILENAME: databaseFilename,
    },
    wait: {
      stdout: /Strapi started successfully/,
    },
  },
  projects: [
    {
      name: "setup",
      testMatch: "**/setup/auth.setup.ts",
      teardown: "teardown",
    },
    {
      name: "teardown",
      testMatch: "**/teardown/db.teardown.ts",
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./admin/test/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
