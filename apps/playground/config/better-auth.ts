import { dash } from "@better-auth/infra";
// @ts-expect-error - An issue with the plugin SDK prevents types from being included in the build.
import { strapiAdapter } from "@strapi-community/plugin-better-auth";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

const auth = () =>
  betterAuth({
    trustedOrigins: ["http://localhost:3000"],
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      dash({
        apiUrl: process.env.STRAPI_URL || "http://localhost:1337",
        apiKey:
          process.env.BETTER_AUTH_DASHBOARD_SECRET ||
          "strapi-internal-dashboard-key",
      }),
      organization(),

    ],
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
      "better-auth": ReturnType<typeof auth>;
    };
  }
}
