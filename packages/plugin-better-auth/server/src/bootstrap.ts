import path from "path";
import type { Core } from "@strapi/strapi";

const ROLE_UID = "plugin::better-auth.role";

/**
 * If config["better-auth"] is a function (strapi) => authInstance, call it with strapi
 * and store the result. This allows the project config to use strapi for sendResetPassword etc.
 */
function ensureBetterAuthInitialized(strapi: Core.Strapi) {
  const internalConfig = (strapi as { internal_config?: Record<string, unknown> }).internal_config;
  if (!internalConfig) return;

  let raw = internalConfig["better-auth"] as unknown;
  if (raw == null && typeof (strapi as { config?: { get?: (path: string) => unknown } }).config?.get === "function") {
    raw = (strapi as { config: { get: (path: string) => unknown } }).config.get("better-auth") as unknown;
  }
  if (raw == null) {
    // Fallback: load config/better-auth.js directly (e.g. when not merged into internal_config)
    const dirs = (strapi as { dirs?: { app?: { config?: string }; dist?: { config?: string } } }).dirs;
    const configDirs = [
      dirs?.dist?.config,
      dirs?.app?.config,
      path.join(process.cwd(), "config"),
    ].filter(Boolean) as string[];
    for (const configDir of configDirs) {
      try {
        const configPath = path.join(configDir, "better-auth.js");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require(configPath);
        raw = typeof mod === "function" ? mod({ env: process.env.NODE_ENV }) : undefined;
        if (raw != null) break;
      } catch {
        /* try next dir */
      }
    }
  }
  if (typeof raw === "function") {
    const instance = raw(strapi);
    internalConfig["better-auth"] = instance;
  }
}

const RBAC_ACTIONS = [
  {
    section: "plugins" as const,
    displayName: "Create",
    uid: "roles.create",
    subCategory: "roles",
    pluginName: "better-auth",
  },
  {
    section: "plugins" as const,
    displayName: "Read",
    uid: "roles.read",
    subCategory: "roles",
    pluginName: "better-auth",
  },
  {
    section: "plugins" as const,
    displayName: "Update",
    uid: "roles.update",
    subCategory: "roles",
    pluginName: "better-auth",
  },
  {
    section: "plugins" as const,
    displayName: "Delete",
    uid: "roles.delete",
    subCategory: "roles",
    pluginName: "better-auth",
  },
  {
    section: "plugins" as const,
    displayName: "Send invite",
    uid: "users.invite",
    subCategory: "users",
    pluginName: "better-auth",
  },
];

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  ensureBetterAuthInitialized(strapi);
  await strapi.service("admin::permission").actionProvider.registerMany(RBAC_ACTIONS);

  const roleCount = await strapi.db.query(ROLE_UID).count();

  if (roleCount === 0) {
    await strapi.db.query(ROLE_UID).create({
      data: {
        name: "Authenticated",
        description: "Default role given to authenticated users.",
        type: "authenticated",
      },
    });

    await strapi.db.query(ROLE_UID).create({
      data: {
        name: "Public",
        description: "Default role given to unauthenticated users.",
        type: "public",
      },
    });
  }
};
