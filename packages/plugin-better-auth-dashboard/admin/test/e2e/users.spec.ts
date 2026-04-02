import { expect, type Page, test } from "@playwright/test";

const USERS_URL = "/admin/settings/better-auth-dashboard/users";

// Shared across describe blocks via process.env (Playwright re-evaluates modules
// in separate VM contexts per describe block; process.env persists across them).
if (!process.env.__E2E_TEST_USER_EMAIL) {
  process.env.__E2E_TEST_USER_EMAIL = `e2e-user-${Date.now()}@example.com`;
  process.env.__E2E_TEST_USER_NAME = `E2E User ${Date.now()}`;
  // Populated after creation so organizations spec can reference the user ID.
  process.env.__E2E_TEST_USER_ID = "";
}

const TEST_USER_EMAIL = process.env.__E2E_TEST_USER_EMAIL!;
const TEST_USER_NAME = process.env.__E2E_TEST_USER_NAME!;

/** Returns the <tr> row in <tbody> that contains the given user name. */
function getUserRow(page: Page, name: string) {
  return page.locator("tbody tr").filter({ has: page.locator("td", { hasText: name }) });
}

test.describe("Users list page", () => {
  test("shows the users heading", async ({ page }) => {
    await page.goto(USERS_URL);

    await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();
  });

  test("shows the Create user button", async ({ page }) => {
    await page.goto(USERS_URL);

    // The header button and the empty-state action both share this label;
    // assert on the first (header) one.
    await expect(page.getByRole("button", { name: /create user/i }).first()).toBeVisible();
  });
});

test.describe("Create user", () => {
  test("opens the create user dialog", async ({ page }) => {
    await page.goto(USERS_URL);

    await page.getByRole("button", { name: /create user/i }).first().click();

    await expect(page.getByRole("heading", { name: /create user/i })).toBeVisible();
  });

  test("shows required form fields", async ({ page }) => {
    await page.goto(USERS_URL);
    await page.getByRole("button", { name: /create user/i }).first().click();

    await expect(page.getByLabel(/^name/i)).toBeVisible();
    await expect(page.getByPlaceholder("jane@example.com")).toBeVisible();
  });

  test("creates a user and shows them in the list", async ({ page }) => {
    // Intercept the createUser response to capture the user ID for later tests.
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.request().method() === "POST" &&
        resp.url().includes("/better-auth") &&
        resp.status() === 200,
    );

    await page.goto(USERS_URL);
    await page.getByRole("button", { name: /create user/i }).first().click();

    await page.getByLabel(/^name/i).fill(TEST_USER_NAME);
    await page.getByPlaceholder("jane@example.com").fill(TEST_USER_EMAIL);
    // Password field is shown by default (generate password toggle is off).
    await page.getByLabel(/^password/i).fill("Abc12345678");

    await page.getByRole("button", { name: /^create$/i }).click();

    // Capture user ID from the API response.
    const response = await responsePromise;
    try {
      const body = await response.json();
      if (body?.id) process.env.__E2E_TEST_USER_ID = body.id;
    } catch {
      // Non-JSON response; ID capture fails gracefully.
    }

    await expect(getUserRow(page, TEST_USER_NAME)).toBeVisible();
  });
});

// test.describe("Ban and unban user", () => {
//   test("bans the test user", async ({ page }) => {
//     await page.goto(USERS_URL);

//     const row = getUserRow(page, TEST_USER_NAME);
//     await expect(row).toBeVisible();

//     await row.getByRole("button", { name: /^ban$/i }).click();

//     // The Banned badge should appear in the row.
//     await expect(row.getByText(/banned/i)).toBeVisible();
//   });

//   test("unbans the test user", async ({ page }) => {
//     await page.goto(USERS_URL);

//     const row = getUserRow(page, TEST_USER_NAME);
//     await row.getByRole("button", { name: /unban/i }).click();

//     await expect(row.getByText(/banned/i)).not.toBeVisible();
//   });
// });

// test.describe("Delete user", () => {
//   test("deletes the test user", async ({ page }) => {
//     await page.goto(USERS_URL);

//     const row = getUserRow(page, TEST_USER_NAME);
//     await expect(row).toBeVisible();

//     await row.getByRole("button", { name: /delete/i }).click();

//     // Confirm deletion — assert on the dialog heading since Strapi's Dialog
//     // doesn't expose role="dialog".
//     await expect(page.getByRole("heading", { name: /delete user/i })).toBeVisible();
//     await page.getByRole("button", { name: /^delete$/i }).last().click();

//     await expect(getUserRow(page, TEST_USER_NAME)).not.toBeVisible();
//   });
});
