#!/usr/bin/env node

import { Command } from "commander";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";
import fs from 'node:fs/promises';

import { createStrapi, compileStrapi } from '@strapi/strapi';

const program = new Command();

// This method removes all non-admin build files from the dist directory
const cleanupDistDirectory = async ({ distDir }) => {
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
      .filter((filename) => filename !== 'build');
    for (const filename of validFilenames) {
      await fs.rm(resolve(distDir, filename), { recursive: true });
    }
  } catch (err: unknown) {
    return;
  }
};

const cleanupStrapiApp = async (strapi, distDir) => {
  await strapi.destroy();
  await cleanupDistDirectory({ distDir });
}

/**
 * Get the Strapi application instance
 */
const getStrapiApp = async () => {
  process.env.CONFIG_SYNC_CLI = 'true';

  /**
   * Compiling Strapi will write to the /dist folder, meaning this will fail in read-only environments.
   * Seeing how this CLI sole purpose is to generate content-types and thus write files, we can ignore this problem.
   */
  const appContext = await compileStrapi({ ignoreDiagnostics: true });

  const app = await createStrapi(appContext).load();
  return {
    app,
    distDir: appContext.distDir
  };
};

/**
 * Load the Better Auth configuration from the user's project
 */
async function loadBetterAuthConfig() {
  const appDir = process.cwd();

  // Try to find the better-auth config file
  const configPaths = [
    join(appDir, "src/lib/auth.ts"),
    join(appDir, "src/lib/auth.js"),
    join(appDir, "src/config/auth.ts"),
    join(appDir, "src/config/auth.js"),
    join(appDir, "auth.ts"),
    join(appDir, "auth.js"),
  ];

  let configPath: string | null = null;
  for (const path of configPaths) {
    if (existsSync(path)) {
      configPath = path;
      break;
    }
  }

  if (!configPath) {
    // Check for strapi plugin config in Strapi's config folder
    const strapiConfigPaths = [
      join(appDir, "config/plugins.ts"),
      join(appDir, "config/plugins.js"),
    ];

    for (const path of strapiConfigPaths) {
      if (existsSync(path)) {
        console.log(
          "ℹ️  Using Better Auth configuration from Strapi plugin config."
        );
        return null; // Let the caller know to use Strapi's config
      }
    }

    throw new Error(
      `Could not find Better Auth configuration file. Please ensure you have one of the following:\n${configPaths.join("\n")}`
    );
  }

  // Import and return the config
  const configModule = await import(configPath);
  return configModule.default || configModule.auth || configModule;
}

program
  .name("strapi-better-auth")
  .description("Strapi Better Auth Plugin CLI")
  .version("1.0.0");

program
  .command("generate")
  .description(
    "Generate Strapi content-types from Better Auth schema. This will create/update content types based on your Better Auth configuration."
  )
  .option(
    "-c, --config <path>",
    "Path to the Better Auth configuration file (optional)"
  )
  .option("--dry-run", "Show what would be created without making changes")
  .action(async (options) => {
    console.log("🚀 Starting Better Auth schema generation for Strapi...\n");

    try {
      // Start Strapi
      console.log("📦 Loading Strapi...");
      const { app: strapi, distDir } = await getStrapiApp();
      console.log("✅ Strapi loaded successfully.\n");

      // Import dependencies
      const { getAuthTables } = await import("@better-auth/core/db");

      // Get the Better Auth configuration
      // The config could be in the Strapi plugin config or a separate file
      let authConfig: any;

      if (options.config) {
        const configModule = await import(options.config);
        authConfig = configModule.default || configModule.auth || configModule;
      } else {
        // Try to load from the user's project
        authConfig = await loadBetterAuthConfig();

        if (!authConfig) {
          // Get the config from the Strapi plugin
          const pluginConfig =
            strapi.config.get("plugin::better-auth.betterAuthOptions") || {};
          authConfig = pluginConfig;
        }
      }

      // Ensure we have a valid auth config
      if (!authConfig) {
        throw new Error(
          "Could not find Better Auth configuration. Please provide a config file path with --config option."
        );
      }

      console.log("📋 Getting Better Auth schema...");

      // Get the auth tables from Better Auth
      const tables = getAuthTables(authConfig);

      if (!tables || Object.keys(tables).length === 0) {
        throw new Error(
          "No tables found in Better Auth configuration. Ensure your config is correct."
        );
      }

      console.log(
        `✅ Found ${Object.keys(tables).length} tables to generate.\n`
      );

      // List tables
      console.log("📝 Tables to generate:");
      for (const [tableName, table] of Object.entries(tables)) {
        const fieldCount = Object.keys((table as any).fields || {}).length;
        console.log(`   - ${tableName} (${fieldCount} fields)`);
      }
      console.log("");

      if (options.dryRun) {
        console.log("🔍 Dry run mode - no changes will be made.");
        await strapi.destroy();
        return;
      }

      // Import the schema transformer
      const { updateStrapiSchema, transformSchema } = await import("../adapter/transformers/schema");

      console.log("🔧 Analyzing schema changes...\n");

      // First, let's see what the transform would produce (for debugging)
      const transformResult = transformSchema(strapi, tables, {
        pluginName: "better-auth",
      });

      console.log(`📊 Transform result:`);
      console.log(`   - hasChanges: ${transformResult.hasChanges}`);
      console.log(`   - contentTypes count: ${transformResult.schema.contentTypes.length}`);
      console.log(`   - changeDetails: ${JSON.stringify(transformResult.allChangeDetails)}`);
      console.log("");

      // Generate the schema
      const result = await updateStrapiSchema(strapi, tables, {
        pluginName: "better-auth",
      });

      if (result.updated) {
        console.log("📝 Changes made:");
        for (const change of result.changeDetails) {
          console.log(`   ✓ ${change}`);
        }
        console.log("\n✅ Schema generation complete!");
        console.log(
          "\n📌 Next steps:\n" +
            "   1. Restart your Strapi server to apply the changes.\n" +
            "   2. The new content-types will be available in the admin panel.\n"
        );
      } else {
        console.log("✅ Schema is already up to date. No changes needed.");
      }

      // Clean up
      await strapi.destroy();
      await cleanupDistDirectory({ distDir });
    } catch (error) {
      console.error(error);
      console.error("\n❌ Error:", (error as Error).message);
      if (process.env.DEBUG) {
        console.error(error);
      }
      process.exit(1);
    }
  });

program
  .command("info")
  .description("Display information about the Better Auth Strapi plugin")
  .action(async () => {
    console.log("📦 Strapi Better Auth Plugin\n");
    console.log("This plugin integrates Better Auth with Strapi.\n");
    console.log("Commands:");
    console.log("  generate  - Generate content-types from Better Auth schema");
    console.log("  info      - Display this information\n");
    console.log("For more information, see the documentation.");
  });

program.parse(process.argv);
