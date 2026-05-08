import packageJson from "../../../package.json";
import type config from "../";

export const PLUGIN_ID = packageJson.strapi.name;

export const POSSIBLE_CONFIG_LOCATIONS = [
  "auth.ts",
  "auth.js",
  "lib/auth.ts",
  "lib/auth.js",
  "src/lib/auth.ts",
  "src/lib/auth.js",
];

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

type Config = typeof config;
type Services = Config["services"];
/**
 * A helper function to obtain a plugin service.
 * @param {string} name The name of the service.
 *
 * @return {any} service.
 */
export const getPluginService = <ServiceName extends keyof Services>(
  name: ServiceName,
): ReturnType<Services[ServiceName]> => {
  const service = strapi.service(`plugin::${PLUGIN_ID}.${name}`);
  return service as ReturnType<Services[ServiceName]>;
};
