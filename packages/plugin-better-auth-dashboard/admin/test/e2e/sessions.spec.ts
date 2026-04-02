import { expect, test } from "@playwright/test";

const SESSIONS_URL = "/admin/settings/better-auth-dashboard/sessions";

test.describe("Sessions page", () => {
  test("shows the sessions heading", async ({ page }) => {
    // Mock the sessions API so the page exits loading state immediately.
    // Without a mock the listAllSessions request hangs in the test environment,
    // keeping the page in <Page.Loading /> indefinitely.
    await page.route("**/*", async (route) => {
      const req = route.request();
      const url = req.url();
      const resourceType = req.resourceType();

      if (
        (resourceType === "xhr" || resourceType === "fetch") &&
        url.includes("/better-auth") &&
        req.method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
        return;
      }

      await route.continue();
    });

    await page.goto(SESSIONS_URL);

    await expect(page.getByRole("heading", { name: /sessions/i })).toBeVisible();
  });

  test("shows empty state when there are no active sessions", async ({ page }) => {
    // Mock the sessions API to return an empty list so the empty state always renders
    // regardless of whether any better-auth sessions exist in the test database.
    await page.route("**/*", async (route) => {
      const req = route.request();
      const url = req.url();
      const resourceType = req.resourceType();

      if (
        (resourceType === "xhr" || resourceType === "fetch") &&
        url.includes("/better-auth") &&
        req.method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
        return;
      }

      await route.continue();
    });

    await page.goto(SESSIONS_URL);

    await expect(page.getByText(/no active sessions found/i)).toBeVisible();
  });

  test("shows active sessions count in subtitle when sessions exist", async ({ page }) => {
    // Mock the sessions API to return a single session so the subtitle is exercised.
    await page.route("**/*", async (route) => {
      const req = route.request();
      const url = req.url();
      const resourceType = req.resourceType();

      if (
        (resourceType === "xhr" || resourceType === "fetch") &&
        url.includes("/better-auth") &&
        req.method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "mock-user-1",
              name: "Test User",
              email: "test@example.com",
              sessions: [
                {
                  id: "mock-session-1",
                  ipAddress: "127.0.0.1",
                  userAgent: "Mozilla/5.0 (Playwright)",
                  expiresAt: new Date(Date.now() + 86400000).toISOString(),
                },
              ],
            },
          ]),
        });
        return;
      }

      await route.continue();
    });

    await page.goto(SESSIONS_URL);

    await expect(page.getByText(/1 active session/i)).toBeVisible();
  });

  test("shows the Revoke all button per user when sessions exist", async ({ page }) => {
    await page.route("**/*", async (route) => {
      const req = route.request();
      const url = req.url();
      const resourceType = req.resourceType();

      if (
        (resourceType === "xhr" || resourceType === "fetch") &&
        url.includes("/better-auth") &&
        req.method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "mock-user-1",
              name: "Test User",
              email: "test@example.com",
              sessions: [
                {
                  id: "mock-session-1",
                  ipAddress: "127.0.0.1",
                  userAgent: "Mozilla/5.0 (Playwright)",
                  expiresAt: new Date(Date.now() + 86400000).toISOString(),
                },
              ],
            },
          ]),
        });
        return;
      }

      await route.continue();
    });

    await page.goto(SESSIONS_URL);

    await expect(page.getByRole("button", { name: /revoke all/i })).toBeVisible();
  });

  test("shows revoke confirmation dialog when Revoke all is clicked", async ({ page }) => {
    await page.route("**/*", async (route) => {
      const req = route.request();
      const url = req.url();
      const resourceType = req.resourceType();

      if (
        (resourceType === "xhr" || resourceType === "fetch") &&
        url.includes("/better-auth") &&
        req.method() === "GET"
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "mock-user-1",
              name: "Test User",
              email: "test@example.com",
              sessions: [
                {
                  id: "mock-session-1",
                  ipAddress: "127.0.0.1",
                  userAgent: "Mozilla/5.0 (Playwright)",
                  expiresAt: new Date(Date.now() + 86400000).toISOString(),
                },
              ],
            },
          ]),
        });
        return;
      }

      await route.continue();
    });

    await page.goto(SESSIONS_URL);
    await page.getByRole("button", { name: /revoke all/i }).click();

    // Strapi's Dialog component doesn't expose role="dialog"; assert on the
    // confirmation text that appears inside the dialog instead.
    await expect(
      page.getByText(/are you sure you want to revoke all sessions/i),
    ).toBeVisible();
  });
});
