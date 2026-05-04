import fs from "node:fs/promises";
import path, { resolve } from "node:path";
import { type Core, compileStrapi, createStrapi } from "@strapi/strapi";
import { PLUGIN_ID } from "../../utils";

// This method removes all non-admin build files from the dist directory
export const cleanupDistDirectory = async ({
  distDir,
}: {
  distDir?: string;
}) => {
  if (
    !distDir || // we don't have a dist dir
    (await fs
      .access(distDir)
      .then(() => false)
      .catch(() => true)) // it doesn't exist -- if it does but no access, that will be caught later
  ) {
    return;
  }

  try {
    const dirContent = await fs.readdir(distDir);
    const validFilenames = dirContent
      // Ignore the admin build folder
      .filter((filename) => filename !== "build");
    for (const filename of validFilenames) {
      await fs.rm(resolve(distDir, filename), { recursive: true });
    }
  } catch {
    return;
  }
};

/**
 * Removes the plugin's content-type JSON files so Strapi regenerates them
 * from scratch on the next compile, picking up any collectionName changes
 * (e.g. a new table_prefix).
 */
export const cleanupContentTypesDir = async ({
  appDir,
}: {
  appDir: string;
}) => {
  const dir = path.join(
    appDir,
    "src",
    "extensions",
    PLUGIN_ID,
    "content-types",
  );
  await fs.rm(dir, { recursive: true, force: true });
};

export const cleanupStrapiApp = async (
  strapi: Core.Strapi,
  distDir?: string,
) => {
  await strapi.destroy();
  await cleanupDistDirectory({ distDir });
};

/**
 * Get the Strapi application instance
 */
export const getStrapiApp = async () => {
  /**
   * Compiling Strapi will write to the /dist folder, meaning this will fail in read-only environments.
   * Seeing how this CLI sole purpose is to generate content-types and thus write files, we can ignore this problem.
   */
  const appContext = await compileStrapi({ ignoreDiagnostics: true });

  const app = await createStrapi(appContext).load();
  return {
    app,
    distDir: appContext.distDir,
  };
};
