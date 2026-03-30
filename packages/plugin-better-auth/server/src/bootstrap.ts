import type { Core } from "@strapi/strapi";

function ensureBetterAuthInitialized(strapi: Core.Strapi) {
  const internalConfig = (strapi as { internal_config?: Record<string, unknown> }).internal_config;
  const raw = internalConfig?.["better-auth"];

  if (raw == null) {
    throw new Error(
      "[@strapi-community/plugin-better-auth] No 'better-auth' config found. " +
      "Please add a 'better-auth' key to your Strapi config."
    );
  }

  if (typeof raw === "function") {
    internalConfig!["better-auth"] = (raw as (strapi: Core.Strapi) => unknown)(strapi);
  }
}

const RBAC_ACTIONS = [
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
};
