import { expect, test } from "@playwright/test";

const PLUGIN_URL = "/admin/plugins/better-auth-dashboard";

const uniqueSuffix = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/**
 * These tests require the better-auth `organization` plugin to be enabled.
 * The playground has it enabled by default, so the Organizations tab should be visible.
 */
test.describe("Organizations page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PLUGIN_URL);
    await expect(page.getByTestId("dashboard-root")).toBeVisible();

    // Skip entire suite if the tab is not visible (org plugin not enabled)
    const orgTab = page.getByTestId("nav-organizations");
    const visible = await orgTab.isVisible();
    if (!visible) {
      test.skip();
      return;
    }

    await orgTab.click();
    await expect(page.getByTestId("organizations-page")).toBeVisible();
  });

  test("shows Organizations page with create button", async ({ page }) => {
    await expect(page.getByTestId("create-org-btn")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Organizations" }),
    ).toBeVisible();
  });

  test("shows empty state when no organizations exist", async ({ page }) => {
    const orgRows = page.getByTestId("org-row");
    const count = await orgRows.count();
    if (count === 0) {
      await expect(page.getByTestId("orgs-empty")).toBeVisible();
    }
  });

  test("opens create organization dialog", async ({ page }) => {
    await page.getByTestId("create-org-btn").click();
    await expect(
      page.getByRole("heading", { name: "Create Organization" }),
    ).toBeVisible();
  });

  test("closes create organization dialog on cancel", async ({ page }) => {
    await page.getByTestId("create-org-btn").click();
    await expect(
      page.getByRole("heading", { name: "Create Organization" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Organization" }),
    ).not.toBeVisible();
  });

  test("creates a new organization and shows it in the list", async ({
    page,
  }) => {
    const suffix = uniqueSuffix();
    const orgName = `Test Org ${suffix}`;
    const ownerEmail = `orgowner-${suffix}@example.com`;

    // First create a user to be the owner (required by the org creation form)
    await page.getByTestId("nav-users").click();
    await expect(page.getByTestId("users-page")).toBeVisible();
    await page.getByTestId("create-user-btn").click();
    await page.getByTestId("new-user-name").fill(`Org Owner ${suffix}`);
    await page.getByTestId("new-user-email").fill(ownerEmail);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByTestId("create-user-dialog")).not.toBeVisible({
      timeout: 10_000,
    });

    // Now go to Organizations
    await page.getByTestId("nav-organizations").click();
    await expect(page.getByTestId("organizations-page")).toBeVisible();

    // Open create dialog
    await page.getByTestId("create-org-btn").click();
    await expect(
      page.getByRole("heading", { name: "Create Organization" }),
    ).toBeVisible();

    // Fill in org name (slug is auto-generated)
    await page.getByLabel("Name").fill(orgName);

    // Select owner via combobox — type email to trigger search
    const ownerCombobox = page.getByPlaceholder("Search users…");
    await ownerCombobox.fill(ownerEmail);
    await expect(
      page.getByRole("option", { name: new RegExp(ownerEmail, "i") }),
    ).toBeVisible({ timeout: 10_000 });
    await page
      .getByRole("option", { name: new RegExp(ownerEmail, "i") })
      .click();

    await page.getByRole("button", { name: "Create" }).click();

    // Dialog should close and org should appear in the list
    await expect(
      page.getByRole("heading", { name: "Create Organization" }),
    ).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(orgName)).toBeVisible({ timeout: 10_000 });
  });

  test("can edit an organization name", async ({ page }) => {
    const suffix = uniqueSuffix();
    const orgName = `Edit Org ${suffix}`;
    const ownerEmail = `editorgowner-${suffix}@example.com`;
    const updatedName = `Updated Org ${suffix}`;

    // Create owner user
    await page.getByTestId("nav-users").click();
    await page.getByTestId("create-user-btn").click();
    await page.getByTestId("new-user-name").fill(`Edit Owner ${suffix}`);
    await page.getByTestId("new-user-email").fill(ownerEmail);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByTestId("create-user-dialog")).not.toBeVisible({
      timeout: 10_000,
    });

    // Create organization
    await page.getByTestId("nav-organizations").click();
    await page.getByTestId("create-org-btn").click();
    await page.getByLabel("Name").fill(orgName);
    const ownerCombobox = page.getByPlaceholder("Search users…");
    await ownerCombobox.fill(ownerEmail);
    await expect(
      page.getByRole("option", { name: new RegExp(ownerEmail, "i") }),
    ).toBeVisible({ timeout: 10_000 });
    await page
      .getByRole("option", { name: new RegExp(ownerEmail, "i") })
      .click();
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Organization" }),
    ).not.toBeVisible({ timeout: 10_000 });

    // Click edit on the org row
    const orgRow = page.getByTestId("org-row").filter({ hasText: orgName });
    await orgRow.getByTestId("edit-org-btn").click();

    // Edit the name
    const nameInput = page.getByTestId("org-name-input");
    await nameInput.clear();
    await nameInput.fill(updatedName);
    await page.getByTestId("save-org-btn").click();
    await page.getByRole("button", { name: "Close" }).click();

    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 10_000 });
  });

  test("can delete an organization after confirmation", async ({ page }) => {
    const suffix = uniqueSuffix();
    const orgName = `Del Org ${suffix}`;
    const ownerEmail = `delorgowner-${suffix}@example.com`;

    // Create owner user
    await page.getByTestId("nav-users").click();
    await page.getByTestId("create-user-btn").click();
    await page.getByTestId("new-user-name").fill(`Del Owner ${suffix}`);
    await page.getByTestId("new-user-email").fill(ownerEmail);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByTestId("create-user-dialog")).not.toBeVisible({
      timeout: 10_000,
    });

    // Create org
    await page.getByTestId("nav-organizations").click();
    await page.getByTestId("create-org-btn").click();
    await page.getByLabel("Name").fill(orgName);
    const ownerCombobox = page.getByPlaceholder("Search users…");
    await ownerCombobox.fill(ownerEmail);
    await expect(
      page.getByRole("option", { name: new RegExp(ownerEmail, "i") }),
    ).toBeVisible({ timeout: 10_000 });
    await page
      .getByRole("option", { name: new RegExp(ownerEmail, "i") })
      .click();
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Organization" }),
    ).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(orgName)).toBeVisible({ timeout: 10_000 });

    // Delete the org
    const orgRow = page.getByTestId("org-row").filter({ hasText: orgName });
    await orgRow.getByTestId("delete-org-btn").click();

    await expect(
      page.getByRole("heading", { name: "Delete organization" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText(orgName)).not.toBeVisible({ timeout: 10_000 });
  });

  test("organization detail modal has expected tabs", async ({ page }) => {
    const suffix = uniqueSuffix();
    const orgName = `Tab Org ${suffix}`;
    const ownerEmail = `taborgowner-${suffix}@example.com`;

    // Create owner user
    await page.getByTestId("nav-users").click();
    await page.getByTestId("create-user-btn").click();
    await page.getByTestId("new-user-name").fill(`Tab Owner ${suffix}`);
    await page.getByTestId("new-user-email").fill(ownerEmail);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByTestId("create-user-dialog")).not.toBeVisible({
      timeout: 10_000,
    });

    // Create org
    await page.getByTestId("nav-organizations").click();
    await page.getByTestId("create-org-btn").click();
    await page.getByLabel("Name").fill(orgName);
    const ownerCombobox = page.getByPlaceholder("Search users…");
    await ownerCombobox.fill(ownerEmail);
    await expect(
      page.getByRole("option", { name: new RegExp(ownerEmail, "i") }),
    ).toBeVisible({ timeout: 10_000 });
    await page
      .getByRole("option", { name: new RegExp(ownerEmail, "i") })
      .click();
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Organization" }),
    ).not.toBeVisible({ timeout: 10_000 });

    // Open the org detail modal
    const orgRow = page.getByTestId("org-row").filter({ hasText: orgName });
    await orgRow.getByTestId("edit-org-btn").click();

    // Check expected tabs
    await expect(page.getByRole("tab", { name: "Details" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Members/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /SSO/ })).toBeVisible();

    await page.getByRole("button", { name: "Close" }).click();
  });

  test("can navigate to Members tab in org detail", async ({ page }) => {
    const suffix = uniqueSuffix();
    const orgName = `Members Org ${suffix}`;
    const ownerEmail = `membersorgowner-${suffix}@example.com`;

    // Create owner user
    await page.getByTestId("nav-users").click();
    await page.getByTestId("create-user-btn").click();
    await page.getByTestId("new-user-name").fill(`Members Owner ${suffix}`);
    await page.getByTestId("new-user-email").fill(ownerEmail);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByTestId("create-user-dialog")).not.toBeVisible({
      timeout: 10_000,
    });

    // Create org
    await page.getByTestId("nav-organizations").click();
    await page.getByTestId("create-org-btn").click();
    await page.getByLabel("Name").fill(orgName);
    const ownerCombobox = page.getByPlaceholder("Search users…");
    await ownerCombobox.fill(ownerEmail);
    await expect(
      page.getByRole("option", { name: new RegExp(ownerEmail, "i") }),
    ).toBeVisible({ timeout: 10_000 });
    await page
      .getByRole("option", { name: new RegExp(ownerEmail, "i") })
      .click();
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Organization" }),
    ).not.toBeVisible({ timeout: 10_000 });

    const orgRow = page.getByTestId("org-row").filter({ hasText: orgName });
    await orgRow.getByTestId("edit-org-btn").click();

    // Navigate to members tab
    await page.getByTestId("org-members-tab").click();
    await expect(page.getByTestId("add-member-btn")).toBeVisible();

    await page.getByRole("button", { name: "Close" }).click();
  });
});
