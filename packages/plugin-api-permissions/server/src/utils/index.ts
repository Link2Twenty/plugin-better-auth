import type { Core } from "@strapi/strapi";

export function getService(strapi: Core.Strapi, name: string) {
  return strapi.plugin("api-permissions").service(name);
}
