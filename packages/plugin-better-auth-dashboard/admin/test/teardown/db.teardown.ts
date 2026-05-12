import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { test as teardown } from "@playwright/test";

teardown("delete database", async () => {
  const dbFilename = process.env.PLAYWRIGHT_DATABASE_FILENAME;
  if (!dbFilename) return;
  const dbPath = join(__dirname, "../../../../../apps/playground", dbFilename);
  if (existsSync(dbPath)) {
    rmSync(dbPath);
  }
});
