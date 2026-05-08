import { expect, test } from "@playwright/test";

const PLUGIN_URL = "/admin/plugins/better-auth-dashboard";

const uniqueSuffix = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test.describe("Users page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PLUGIN_URL);
    await expect(page.getByTestId("dashboard-root")).toBeVisible();
    await page.getByTestId("nav-users").click();
    await expect(page.getByTestId("users-page")).toBeVisible();
  });

  test("shows Users page with create button", async ({ page }) => {
    await expect(page.getByTestId("create-user-btn")).toBeVisible();
    await expect(page.getByText("Users")).toBeVisible();
  });

  test("shows empty state when no users", async ({ page }) => {
    // On a fresh DB there are no better-auth users
    const emptyCell = page.getByTestId("users-empty");
    const userRows = page.getByTestId("user-row");
    const count = await userRows.count();
    if (count === 0) {
      await expect(emptyCell).toBeVisible();
    }
  });

  test("opens create user dialog", async ({ page }) => {
    await page.getByTestId("create-user-btn").click();
    await expect(page.getByTestId("create-user-dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Create User" }),
    ).toBeVisible();
  });

  test("closes create user dialog on cancel", async ({ page }) => {
    await page.getByTestId("create-user-btn").click();
    await expect(page.getByTestId("create-user-dialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByTestId("create-user-dialog")).not.toBeVisible();
  });

  test("creates a new user and shows it in the list", async ({ page }) => {
    const suffix = uniqueSuffix();
    const name = `Test User ${suffix}`;
    const email = `testuser-${suffix}@example.com`;

    await page.getByTestId("create-user-btn").click();
    await page.getByTestId("new-user-name").fill(name);
    await page.getByTestId("new-user-email").fill(email);
    await page.getByRole("button", { name: "Create" }).click();

    // Dialog should close
    await expect(page.getByTestId("create-user-dialog")).not.toBeVisible({
      timeout: 10_000,
    });

    // User should appear in the list
    await expect(page.getByText(email)).toBeVisible({ timeout: 10_000 });
  });

  test("can search for users by email", async ({ page }) => {
    const suffix = uniqueSuffix();
    const name = `Search User ${suffix}`;
    const email = `searchuser-${suffix}@example.com`;

    // Create a user first
    await page.getByTestId("create-user-btn").click();
    await page.getByTestId("new-user-name").fill(name);
    await page.getByTestId("new-user-email").fill(email);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByTestId("create-user-dialog")).not.toBeVisible({
      timeout: 10_000,
    });

    // Search for the user
    await page.getByPlaceholder("Search by email…").fill(email);
    await page.keyboard.press("Enter");

    await expect(page.getByText(email)).toBeVisible({ timeout: 10_000 });
  });

  test("can open user detail modal and edit name", async ({ page }) => {
    const suffix = uniqueSuffix();
    const name = `Edit User ${suffix}`;
    const email = `edituser-${suffix}@example.com`;
    const updatedName = `Updated User ${suffix}`;

    // Create a user
    await page.getByTestId("create-user-btn").click();
    await page.getByTestId("new-user-name").fill(name);
    await page.getByTestId("new-user-email").fill(email);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByTestId("create-user-dialog")).not.toBeVisible({
      timeout: 10_000,
    });

    // Click the edit button on the row containing this email
    const row = page.getByTestId("user-row").filter({ hasText: email });
    await row.getByTestId("edit-user-btn").click();

    await expect(page.getByTestId("user-detail-modal")).toBeVisible();

    // Update the name
    const nameInput = page.getByTestId("user-name-input");
    await nameInput.clear();
    await nameInput.fill(updatedName);
    await page.getByTestId("save-user-btn").click();

    // Modal should stay open; verify no error state
    await expect(page.getByTestId("user-detail-modal")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();

    // Updated name should appear in the list
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 10_000 });
  });

  test("can delete a user after confirmation", async ({ page }) => {
    const suffix = uniqueSuffix();
    const name = `Delete User ${suffix}`;
    const email = `deleteuser-${suffix}@example.com`;

    // Create a user
    await page.getByTestId("create-user-btn").click();
    await page.getByTestId("new-user-name").fill(name);
    await page.getByTestId("new-user-email").fill(email);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByTestId("create-user-dialog")).not.toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(email)).toBeVisible({ timeout: 10_000 });

    // Click delete button
    const row = page.getByTestId("user-row").filter({ hasText: email });
    await row.getByTestId("delete-user-btn").click();

    // Confirm dialog should appear
    await expect(
      page.getByRole("heading", { name: "Delete user" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();

    // User should be removed
    await expect(page.getByText(email)).not.toBeVisible({ timeout: 10_000 });
  });

  test("can bulk delete users after confirmation", async ({ page }) => {
    const suffix = uniqueSuffix();
    const email1 = `bulk1-${suffix}@example.com`;
    const email2 = `bulk2-${suffix}@example.com`;

    // Create two users
    for (const [name, email] of [
      [`Bulk1 ${suffix}`, email1],
      [`Bulk2 ${suffix}`, email2],
    ]) {
      await page.getByTestId("create-user-btn").click();
      await page.getByTestId("new-user-name").fill(name);
      await page.getByTestId("new-user-email").fill(email);
      await page.getByRole("button", { name: "Create" }).click();
      await expect(page.getByTestId("create-user-dialog")).not.toBeVisible({
        timeout: 10_000,
      });
    }

    await expect(page.getByText(email1)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(email2)).toBeVisible({ timeout: 10_000 });

    // Select both rows
    const row1 = page.getByTestId("user-row").filter({ hasText: email1 });
    const row2 = page.getByTestId("user-row").filter({ hasText: email2 });
    await row1.getByRole("checkbox").click();
    await row2.getByRole("checkbox").click();

    // Bulk delete
    await page.getByTestId("delete-selected-btn").click();
    await expect(
      page.getByRole("heading", { name: /Delete \d+ users?/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Delete all" }).click();

    await expect(page.getByText(email1)).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(email2)).not.toBeVisible({ timeout: 10_000 });
  });

  test("user detail modal has expected tabs", async ({ page }) => {
    const suffix = uniqueSuffix();
    const email = `tabs-${suffix}@example.com`;

    await page.getByTestId("create-user-btn").click();
    await page.getByTestId("new-user-name").fill(`Tabs User ${suffix}`);
    await page.getByTestId("new-user-email").fill(email);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByTestId("create-user-dialog")).not.toBeVisible({
      timeout: 10_000,
    });

    const row = page.getByTestId("user-row").filter({ hasText: email });
    await row.getByTestId("edit-user-btn").click();
    await expect(page.getByTestId("user-detail-modal")).toBeVisible();

    // Check all expected tabs are present
    await expect(page.getByRole("tab", { name: "Profile" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Sessions" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Security" })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Organizations" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Close" }).click();
  });
});
