import type { Core } from "@strapi/strapi";

export function getService(strapi: Core.Strapi, name: string) {
  return strapi.plugin("better-auth").service(name);
}
