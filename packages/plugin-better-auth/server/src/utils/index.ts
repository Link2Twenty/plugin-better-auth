import type { Core } from "@strapi/strapi";
import packageJson from "../../../package.json";

export const PLUGIN_ID = packageJson.strapi.name;

export function getService(strapi: Core.Strapi, name: string) {
  return strapi.plugin(PLUGIN_ID).service(name);
}
