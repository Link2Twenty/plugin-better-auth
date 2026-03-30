import type {} from "@strapi/types/dist/core/strapi";
import type { Auth } from "better-auth";

declare module "@strapi/types/dist/core/strapi" {
  interface Strapi {
    internal_config: {
      "better-auth"?: undefined | Auth;
    };
  }
}
