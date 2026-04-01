import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { test as teardown } from "@playwright/test";

teardown("delete database", async () => {
  const tmpDir = join(__dirname, "../../../../../apps/playground/.tmp");
  for (const file of readdirSync(tmpDir)) {
    if (file.startsWith("playwright-") && file.endsWith(".db")) {
      rmSync(join(tmpDir, file));
    }
  }
});
