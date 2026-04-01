import packageJson from "../../../package.json";
import type config from "..";

export const PLUGIN_ID = packageJson.strapi.name;
export const ROLE_UID = `plugin::api-permissions.role`;
export const PERMISSION_UID = `plugin::api-permissions.permission`;

/**
 * A helper function to obtain the UID of the user content type.
 *
 * @return {string} The UID of the user content type.
 */
export const getUserUID = (): "plugin::better-auth.user" => {
  const userUID = strapi.config.get(`plugin::${PLUGIN_ID}.user_uid`, undefined);

  if (userUID) {
    return userUID;
  }

  if (strapi.plugin("better-auth")) {
    return "plugin::better-auth.user";
  }

  throw new Error(
    `User UID not configured for plugin ${PLUGIN_ID}. Please set the "user_uid" configuration option to the UID of your user content type.`,
  );
};

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
) => {
  const service = strapi.service(`plugin::${PLUGIN_ID}.${name}`);
  return service as ReturnType<Services[ServiceName]>;
};
