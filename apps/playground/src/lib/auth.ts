import { dash } from "@better-auth/infra";
import { strapiAdapter } from "@strapi-community/plugin-better-auth";
import { betterAuth } from "better-auth";
import { jwt, organization } from "better-auth/plugins";

export const auth = betterAuth({
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
    jwt(),
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
