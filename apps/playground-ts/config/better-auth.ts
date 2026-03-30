import type { Auth } from "better-auth";
// @ts-expect-error - An issue with the plugin SDK prevents types from being included in the build.
import { strapiAdapter } from "@strapi-community/plugin-better-auth";
import { betterAuth } from "better-auth";

const auth = () =>
  betterAuth({
    trustedOrigins: ["http://localhost:3000"],
    emailAndPassword: {
      enabled: true,
    },
    database: strapiAdapter(),
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["credential", "google", "github"],
      },
    },
    advanced: {
      database: {
        generateId: "serial",
      },
    },
  });

export default auth;

declare module '@strapi/types/dist/core/strapi' {
  interface Strapi {
    internal_config: {
      "better-auth": Auth;
    }
  }
}
