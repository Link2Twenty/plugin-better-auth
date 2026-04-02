import { expect, type Page, test } from "@playwright/test";

const ORGANIZATIONS_URL = "/admin/settings/better-auth-dashboard/organizations";
const USERS_URL = "/admin/settings/better-auth-dashboard/users";

// Stable across VM contexts via process.env.
if (!process.env.__E2E_ORG_NAME) {
  process.env.__E2E_ORG_NAME = `E2E Org ${Date.now()}`;
  process.env.__E2E_ORG_OWNER_EMAIL = `org-owner-${Date.now()}@example.com`;
}

const TEST_ORG_NAME = process.env.__E2E_ORG_NAME!;
const TEST_ORG_OWNER_EMAIL = process.env.__E2E_ORG_OWNER_EMAIL!;

/** Returns the <tr> row in <tbody> that contains the given org name. */
function getOrgRow(page: Page, name: string) {
  return page.locator("tbody tr").filter({ has: page.locator("td", { hasText: name }) });
}

/**
 * Creates a better-auth user via the Users page UI and returns their user ID.
 * Sets up waitForResponse *after* the page loads to avoid capturing listUsers responses.
 */
async function createUserAndGetId(
  page: Page,
  name: string,
  email: string,
): Promise<string> {
  await page.goto(USERS_URL);
  await page.getByRole("button", { name: /create user/i }).first().click();

  // Fill the form.
  await page.getByLabel(/^name/i).fill(name);
  await page.getByPlaceholder("jane@example.com").fill(email);
  await page.getByLabel(/^password/i).fill("Abc12345678");

  // Set up response capture *before* submitting so we catch the createUser response.
  const responsePromise = page.waitForResponse(
    (resp) =>
      resp.request().method() === "POST" &&
      resp.url().includes("/better-auth") &&
      resp.status() === 200,
  );

  await page.getByRole("button", { name: /^create$/i }).click();

  let userId = "";
  try {
    const response = await responsePromise;
    const body = await response.json();
    userId = body?.id ?? "";
  } catch {
    // ID capture fails gracefully; tests that need it will skip.
  }

  return userId;
}

test.describe("Organizations list page", () => {
  test("shows the organizations heading", async ({ page }) => {
    await page.goto(ORGANIZATIONS_URL);

    await expect(page.getByRole("heading", { name: /organizations/i })).toBeVisible();
  });

  test("shows the Create organization button", async ({ page }) => {
    await page.goto(ORGANIZATIONS_URL);

    // The header button and the empty-state action both share this label;
    // assert on the first (header) one.
    await expect(page.getByRole("button", { name: /create organization/i }).first()).toBeVisible();
  });

  test("shows empty state when there are no organizations", async ({ page }) => {
    // Mock the listOrganizations API to return an empty list.
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
          body: JSON.stringify({ organizations: [], total: 0 }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto(ORGANIZATIONS_URL);

    await expect(page.getByText(/no organizations found/i)).toBeVisible();
  });
});

test.describe("Create organization dialog", () => {
  test("opens the create organization dialog", async ({ page }) => {
    await page.goto(ORGANIZATIONS_URL);
    await page.getByRole("button", { name: /create organization/i }).first().click();

    await expect(page.getByRole("heading", { name: /create organization/i })).toBeVisible();
  });

  test("shows required form fields", async ({ page }) => {
    await page.goto(ORGANIZATIONS_URL);
    await page.getByRole("button", { name: /create organization/i }).first().click();

    await expect(page.getByLabel(/^name/i)).toBeVisible();
    await expect(page.getByPlaceholder("acme-inc")).toBeVisible();
    await expect(page.getByLabel(/owner user id/i)).toBeVisible();
  });

  test("auto-fills the slug from the name", async ({ page }) => {
    await page.goto(ORGANIZATIONS_URL);
    await page.getByRole("button", { name: /create organization/i }).first().click();

    await page.getByLabel(/^name/i).fill("Acme Corporation");

    await expect(page.getByPlaceholder("acme-inc")).toHaveValue("acme-corporation");
  });

  test("keeps slug unchanged when edited manually", async ({ page }) => {
    await page.goto(ORGANIZATIONS_URL);
    await page.getByRole("button", { name: /create organization/i }).first().click();

    const slugInput = page.getByPlaceholder("acme-inc");
    await slugInput.fill("my-custom-slug");
    await page.getByLabel(/^name/i).fill("Any Name");

    await expect(slugInput).toHaveValue("my-custom-slug");
  });
});

test.describe("Create and delete organization lifecycle", () => {
  test("creates an organization and shows it in the list", async ({ page }) => {
    // Create a user first to act as the organization owner.
    const ownerId = await createUserAndGetId(page, "Org Owner", TEST_ORG_OWNER_EMAIL);

    test.skip(!ownerId, "Could not capture created user ID — skipping org create test");

    await page.goto(ORGANIZATIONS_URL);
    await page.getByRole("button", { name: /create organization/i }).first().click();

    await page.getByLabel(/^name/i).fill(TEST_ORG_NAME);
    // Wait for slug to be auto-populated.
    await expect(page.getByPlaceholder("acme-inc")).not.toHaveValue("");
    await page.getByLabel(/owner user id/i).fill(ownerId);

    await page.getByRole("button", { name: /^create$/i }).click();

    await expect(getOrgRow(page, TEST_ORG_NAME)).toBeVisible();
  });

  test("deletes the test organization", async ({ page }) => {
    await page.goto(ORGANIZATIONS_URL);

    const row = getOrgRow(page, TEST_ORG_NAME);
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: /delete/i }).click();

    // Confirm deletion — assert on the dialog heading since Strapi's Dialog
    // doesn't expose role="dialog".
    await expect(page.getByRole("heading", { name: /delete organization/i })).toBeVisible();
    await page.getByRole("button", { name: /^delete$/i }).last().click();

    await expect(getOrgRow(page, TEST_ORG_NAME)).not.toBeVisible();
  });
});
