import type { Core } from "@strapi/strapi";
import packageJson from "../../../package.json";

export const PLUGIN_ID = packageJson.strapi.name;

export function getService(strapi: Core.Strapi, name: string) {
  return strapi.plugin(PLUGIN_ID).service(name);
}

export const MIN_STRAPI_VERSION = "5.45.0";

export function isVersionAtLeast(version: string, minimum: string): boolean {
  // Experimental builds (e.g. 0.0.0-experimental.<hash>) are always treated as satisfying
  if (version.includes("-experimental.")) return true;

  const parse = (v: string) => v.split(".").map(Number);
  const [maj, min, pat] = parse(version);
  const [minMaj, minMin, minPat] = parse(minimum);
  if (maj !== minMaj) return maj > minMaj;
  if (min !== minMin) return min > minMin;
  return pat >= minPat;
}
