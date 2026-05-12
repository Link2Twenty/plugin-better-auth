import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.STRAPI_PORT ?? String(10000 + (process.pid % 50000));
const baseURL =
  process.env.PLAYWRIGHT_TEST_BASE_URL ??
  process.env.STRAPI_BASE_URL ??
  `http://localhost:${PORT}`;
process.env.PLAYWRIGHT_TEST_BASE_URL ??= baseURL;

const dbClient = process.env.DATABASE_CLIENT ?? "sqlite";

const dbEnv: Record<string, string> =
  dbClient === "sqlite"
    ? (() => {
        const filename = `.tmp/playwright-${process.pid}.db`;
        process.env.PLAYWRIGHT_DATABASE_FILENAME ??= filename;
        return { DATABASE_CLIENT: "sqlite", DATABASE_FILENAME: filename };
      })()
    : {
        DATABASE_CLIENT: dbClient,
        DATABASE_HOST: process.env.DATABASE_HOST ?? "127.0.0.1",
        DATABASE_PORT:
          process.env.DATABASE_PORT ??
          (dbClient === "postgres" ? "5432" : "3306"),
        DATABASE_NAME: process.env.DATABASE_NAME ?? "strapi_test",
        DATABASE_USERNAME: process.env.DATABASE_USERNAME ?? "strapi",
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ?? "strapi",
      };

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
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      PORT,
      APP_KEYS: "test-app-key-1,test-app-key-2,test-app-key-3,test-app-key-4",
      API_TOKEN_SALT: "test-api-token-salt",
      ADMIN_JWT_SECRET: "test-admin-jwt-secret",
      TRANSFER_TOKEN_SALT: "test-transfer-token-salt",
      ENCRYPTION_KEY: "test-encryption-key-1234567890",
      JWT_SECRET: "test-jwt-secret",
      BETTER_AUTH_URL: baseURL,
      STRAPI_URL: `http://localhost:${PORT}`,
      ...dbEnv,
    },
    // Strapi logs "Strapi started successfully" to stdout after the HTTP server
    // is fully ready (including after any hot-reload recompile).
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
