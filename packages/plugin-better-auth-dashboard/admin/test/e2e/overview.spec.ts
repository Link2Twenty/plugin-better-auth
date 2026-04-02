import { expect, test } from "@playwright/test";

const OVERVIEW_URL = "/admin/settings/better-auth-dashboard";

test.describe("Overview page", () => {
  test("shows the overview heading", async ({ page }) => {
    await page.goto(OVERVIEW_URL);

    await expect(page.getByRole("heading", { name: /overview/i })).toBeVisible();
  });

  test("shows the Total Users stat card", async ({ page }) => {
    await page.goto(OVERVIEW_URL);

    await expect(page.getByText(/total users/i)).toBeVisible();
  });

  test("shows the New Today stat card", async ({ page }) => {
    await page.goto(OVERVIEW_URL);

    await expect(page.getByText(/new today/i)).toBeVisible();
  });

  test("shows the New This Week stat card", async ({ page }) => {
    await page.goto(OVERVIEW_URL);

    await expect(page.getByText(/new this week/i)).toBeVisible();
  });

  test("shows the New This Month stat card", async ({ page }) => {
    await page.goto(OVERVIEW_URL);

    await expect(page.getByText(/new this month/i)).toBeVisible();
  });

  test("shows the Daily Active stat card", async ({ page }) => {
    await page.goto(OVERVIEW_URL);

    await expect(page.getByText(/daily active/i)).toBeVisible();
  });

  test("shows the Monthly Active stat card", async ({ page }) => {
    await page.goto(OVERVIEW_URL);

    await expect(page.getByText(/monthly active/i)).toBeVisible();
  });
});
