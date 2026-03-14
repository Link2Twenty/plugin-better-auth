import fs from 'node:fs';
import fspromises from "node:fs/promises";
import assert from 'node:assert';
import type { Core } from '@strapi/strapi';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { compileStrapi, createStrapi } = require("@strapi/strapi") as typeof import("@strapi/strapi");

let instance: Core.Strapi | undefined;

/**
 * Setups strapi for futher testing
 */
export async function setupStrapi() {
  const playgroundDir = path.resolve(process.cwd(), "../../apps/playground-ts");
  const databaseFilename = `.tmp/vitest-${process.pid}.db`;
  const databasePath = path.join(playgroundDir, databaseFilename);

  process.env.APP_KEYS ??= "test-app-key-1,test-app-key-2,test-app-key-3,test-app-key-4";
  process.env.API_TOKEN_SALT ??= "test-api-token-salt";
  process.env.ADMIN_JWT_SECRET ??= "test-admin-jwt-secret";
  process.env.TRANSFER_TOKEN_SALT ??= "test-transfer-token-salt";
  process.env.ENCRYPTION_KEY ??= "test-encryption-key-1234567890";
  process.env.JWT_SECRET ??= "test-jwt-secret";
  process.env.BETTER_AUTH_URL ??= "http://localhost:1337";
  process.env.DATABASE_FILENAME = databaseFilename;
  
  await fspromises.rm(databasePath, { force: true });

  if (!instance) {
    const appContext = await compileStrapi({ appDir: playgroundDir, ignoreDiagnostics: true });
    const strapi = await createStrapi(appContext).load();
    await strapi.start();

    instance = strapi; // strapi is global now
  }
}

/**
 * Closes strapi after testing
 */
export async function stopStrapi() {
  if (instance) {
    const tmpDbFile = instance.config.get(
      'database.connection.connection.filename',
    );

    assert(typeof tmpDbFile === 'string');

    await instance.destroy();

    if (fs.existsSync(tmpDbFile)) {
      fs.unlinkSync(tmpDbFile);
    }

    instance = undefined;
  }
}
