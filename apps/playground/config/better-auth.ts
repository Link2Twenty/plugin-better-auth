import { strapiAdapter } from "@strapi-community/plugin-better-auth";
import type { Auth } from "better-auth";
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

import type {} from "@strapi/types/dist/core/strapi";

declare module "@strapi/types/dist/core/strapi" {
  interface Strapi {
    internal_config: {
      "better-auth": Auth;
    };
  }
}
