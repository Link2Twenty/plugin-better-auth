// server/src/register.ts
import type { Core } from "@strapi/strapi";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { strapiAdapter } from "./adapter";

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // Get plugin configuration
  const pluginConfig: BetterAuthOptions =
    strapi.config.get("plugin::better-auth.betterAuthOptions") || {};
  const debug: boolean =
    strapi.config.get("plugin::better-auth.debug") || false;

  // Initialize Better Auth with the Strapi adapter
  const auth = betterAuth({
    ...pluginConfig,
    database: strapiAdapter({
      strapi,
      debugLogs: debug,
    }),
    advanced: {
      ...pluginConfig.advanced,
      database: {
        ...pluginConfig.advanced?.database,
        generateId: "serial",
      },
    },
  });

  // Store globally for use in routes/controllers
  // @ts-expect-error - Adding custom property to Strapi instance
  strapi.betterAuth = auth;
};

export default register;
