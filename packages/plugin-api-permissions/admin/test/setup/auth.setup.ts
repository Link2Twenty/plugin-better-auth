import path from "node:path";
import { expect, test as setup } from "@playwright/test";

const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate", async ({ page }) => {
  await page.goto("/admin/auth/login");

  await page.getByLabel("First name").fill("John");
  await page.getByLabel("Email").fill("johndoe@example.com");
  await page.getByLabel("Password*", { exact: true }).fill("Abc12345678");
  await page
    .getByLabel("Confirm Password*", { exact: true })
    .fill("Abc12345678");

  await page.getByRole("button", { name: /let's start/i }).click();

  await expect(page).toHaveURL(/\/admin(?!\/auth)/);

  await page.context().storageState({ path: authFile });
});
