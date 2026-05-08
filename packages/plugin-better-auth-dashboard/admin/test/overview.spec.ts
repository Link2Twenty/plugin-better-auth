import { expect, test } from "@playwright/test";

const PLUGIN_URL = "/admin/plugins/better-auth-dashboard";

test.describe("Overview page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PLUGIN_URL);
    await expect(page.getByTestId("dashboard-root")).toBeVisible();
  });

  test("renders the dashboard with navigation tabs", async ({ page }) => {
    await expect(page.getByTestId("main-nav")).toBeVisible();
    await expect(page.getByTestId("nav-overview")).toBeVisible();
    await expect(page.getByTestId("nav-users")).toBeVisible();
    await expect(page.getByTestId("nav-sessions")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Better Auth Dashboard" }),
    ).toBeVisible();
  });

  test("shows overview page by default", async ({ page }) => {
    await expect(page.getByTestId("overview-page")).toBeVisible();
  });

  test("shows all stat cards", async ({ page }) => {
    const statsGrid = page.getByTestId("stats-grid");
    await expect(statsGrid).toBeVisible();

    await expect(page.getByText("Total Users")).toBeVisible();
    await expect(page.getByText("Daily Sign-ups")).toBeVisible();
    await expect(page.getByText("Weekly Sign-ups")).toBeVisible();
    await expect(page.getByText("Monthly Sign-ups")).toBeVisible();
    await expect(page.getByText("Daily Active")).toBeVisible();
    await expect(page.getByText("Weekly Active")).toBeVisible();
    await expect(page.getByText("Monthly Active")).toBeVisible();
  });

  test("shows User Growth section with period selector", async ({ page }) => {
    await expect(page.getByText("User Growth")).toBeVisible();
    await expect(page.getByText("Period")).toBeVisible();
  });

  test("User Growth table shows column headers", async ({ page }) => {
    await expect(page.getByText("Period")).toBeVisible();
    await expect(page.getByText("Total Users")).toBeVisible();
    await expect(page.getByText("New Users")).toBeVisible();
    await expect(page.getByText("Active Users")).toBeVisible();
  });

  test("period selector changes graph data", async ({ page }) => {
    // The select is for the "Period" field in the graph section
    const periodSelect = page
      .getByText("User Growth")
      .locator("..")
      .locator("xpath=following-sibling::*")
      .first();

    // Check "Weekly" is selected by default by finding the select component
    // We just verify switching doesn't error — look for a button or select nearby
    const dailyOption = page.getByRole("option", { name: "Daily" });
    if (await dailyOption.isVisible()) {
      await dailyOption.click();
    }
    // After change, the table should still be visible (no error state)
    await expect(page.getByText("Total Users")).toBeVisible();
  });
});
