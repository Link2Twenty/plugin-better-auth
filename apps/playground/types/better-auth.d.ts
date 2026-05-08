import type {} from "@strapi/types/dist/core/strapi";

declare module "@strapi/types/dist/core/strapi" {
  interface StrapiInternalConfig {
    "better-auth": ReturnType<typeof import("../config/better-auth").default>;
  }

  interface Strapi {
    internal_config: StrapiInternalConfig;
  }
}
