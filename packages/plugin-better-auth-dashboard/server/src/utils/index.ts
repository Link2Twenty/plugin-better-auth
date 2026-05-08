import packageJson from "../../../package.json";
import type { Auth } from "../../types/better-auth";

export const PLUGIN_ID = packageJson.strapi.name;

export const auth = strapi
  .service("plugin::better-auth.auth-service")
  ?.getAuth() as Auth | null;
