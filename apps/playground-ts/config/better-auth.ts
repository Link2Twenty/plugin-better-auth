// @ts-expect-error
import { strapiAdapter } from "@strapi-community/plugin-better-auth/adapter";
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";

const auth = () =>
  betterAuth({
    trustedOrigins: ["http://localhost:3000"],
    emailAndPassword: {
      enabled: true,
    },
    plugins: [twoFactor()],
    database: strapiAdapter(),
    advanced: {
      database: {
        generateId: "serial",
      },
    },
  });

export default auth;
