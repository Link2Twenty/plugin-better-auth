import assert from "node:assert";
import fs from "node:fs";
import fspromises from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path, { resolve } from "node:path";
import { threadId } from "node:worker_threads";
import type { Core } from "@strapi/strapi";
import { getExistingBAContentTypes } from "../src/adapter/transformers";

const require = createRequire(import.meta.url);
const { compileStrapi, createStrapi } =
  require("@strapi/strapi") as typeof import("@strapi/strapi");

/** Find a free TCP port on localhost. */
function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      srv.close(() => resolve((addr as net.AddressInfo).port));
    });
    srv.on("error", reject);
  });
}

// threadId is unique per worker thread within a process; safe for parallel test files
const instanceId = `${process.pid}-${threadId}`;

let instance: Core.Strapi | undefined;
export const playgroundDir = path.resolve(
  process.cwd(),
  "../../apps/playground",
);

/**
 * Setups strapi for futher testing
 */
export async function setupStrapi() {
  const playgroundDir = path.resolve(process.cwd(), "../../apps/playground");
  const databaseFilename = `.tmp/vitest-${instanceId}.db`;
  const databasePath = path.join(playgroundDir, databaseFilename);

  const port = await getFreePort();

  process.env.APP_KEYS ??=
    "test-app-key-1,test-app-key-2,test-app-key-3,test-app-key-4";
  process.env.API_TOKEN_SALT ??= "test-api-token-salt";
  process.env.ADMIN_JWT_SECRET ??= "test-admin-jwt-secret";
  process.env.TRANSFER_TOKEN_SALT ??= "test-transfer-token-salt";
  process.env.ENCRYPTION_KEY ??= "test-encryption-key-1234567890";
  process.env.JWT_SECRET ??= "test-jwt-secret";
  process.env.BETTER_AUTH_URL = `http://localhost:${port}`;
  process.env.PORT = String(port);
  process.env.DATABASE_FILENAME = databaseFilename;

  await fspromises.rm(databasePath, { force: true });

  if (!instance) {
    const appContext = await compileStrapi({
      appDir: playgroundDir,
      ignoreDiagnostics: true,
    });
    const strapi = await createStrapi(appContext).load();
    await strapi.start();

    instance = strapi; // strapi is global now
  }
}

// This method removes all non-admin build files from the dist directory
export const cleanupDir = async (dir: string) => {
  if (
    !dir || // we don't have a dist dir
    (await fspromises
      .access(dir)
      .then(() => false)
      .catch(() => true)) // it doesn't exist -- if it does but no access, that will be caught later
  ) {
    return;
  }

  try {
    const dirContent = await fspromises.readdir(dir);
    const validFilenames = dirContent
      // Ignore the admin build folder
      .filter((filename) => filename !== "build");
    for (const filename of validFilenames) {
      await fspromises.rm(resolve(dir, filename), { recursive: true });
    }
  } catch {
    return;
  }
};

/**
 * Closes strapi after testing
 */
export async function stopStrapi() {
  if (instance) {
    const tmpDbFile = instance.config.get(
      "database.connection.connection.filename",
    );

    assert(typeof tmpDbFile === "string");

    await instance.destroy();

    if (fs.existsSync(tmpDbFile)) {
      fs.unlinkSync(tmpDbFile);
    }

    instance = undefined;
  }
}
