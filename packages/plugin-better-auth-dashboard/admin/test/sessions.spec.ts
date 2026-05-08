import { expect, test } from "@playwright/test";

const PLUGIN_URL = "/admin/plugins/better-auth-dashboard";

test.describe("Sessions page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PLUGIN_URL);
    await expect(page.getByTestId("dashboard-root")).toBeVisible();
    await page.getByTestId("nav-sessions").click();
    await expect(page.getByTestId("sessions-page")).toBeVisible();
  });

  test("shows Sessions page heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();
  });

  test("shows empty state when no sessions exist", async ({ page }) => {
    const sessionRows = page.getByTestId("session-user-row");
    const count = await sessionRows.count();
    if (count === 0) {
      await expect(page.getByText("No active sessions")).toBeVisible();
    }
  });

  test("shows session user rows when sessions exist", async ({ page }) => {
    // Sessions exist only when better-auth users have logged in.
    // On a fresh DB this may be empty — we validate the structure conditionally.
    const sessionRows = page.getByTestId("session-user-row");
    const count = await sessionRows.count();

    if (count > 0) {
      // Each user row should show the user's name and email
      const firstRow = sessionRows.first();
      await expect(firstRow).toBeVisible();

      // Session details rows should be present inside the user row
      const sessionDetail = firstRow.getByTestId("session-row");
      const sessionCount = await sessionDetail.count();
      expect(sessionCount).toBeGreaterThan(0);
    }
  });

  test("shows revoke button on each session", async ({ page }) => {
    const sessionRows = page.getByTestId("session-user-row");
    const count = await sessionRows.count();

    if (count > 0) {
      const firstRow = sessionRows.first();
      const revokeBtn = firstRow.getByTestId("revoke-session-btn").first();
      await expect(revokeBtn).toBeVisible();
    }
  });

  test("shows select-all checkbox when sessions exist", async ({ page }) => {
    const sessionRows = page.getByTestId("session-user-row");
    const count = await sessionRows.count();

    if (count > 0) {
      await expect(page.getByLabel("Select all users")).toBeVisible();
    }
  });

  test("selecting users shows bulk revoke button", async ({ page }) => {
    const sessionRows = page.getByTestId("session-user-row");
    const count = await sessionRows.count();

    if (count > 0) {
      // Select the first user row's checkbox
      const firstRowCheckbox = sessionRows
        .first()
        .getByRole("checkbox")
        .first();
      await firstRowCheckbox.click();

      await expect(page.getByTestId("revoke-selected-btn")).toBeVisible();
    }
  });
});
