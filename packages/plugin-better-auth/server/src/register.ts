import type { Core } from "@strapi/strapi";
import { fromNodeHeaders } from "better-auth/node";
import type { ParameterizedContext } from "koa";
import { createContentApiRoutes } from "./routes";
import { isVersionAtLeast, MIN_STRAPI_VERSION } from "./utils";

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const strapiVersion = strapi.config.get<string>("info.strapi", "0.0.0");

  if (!isVersionAtLeast(strapiVersion, MIN_STRAPI_VERSION)) {
    throw new Error(
      `[@strapi-community/plugin-better-auth] Strapi v${strapiVersion} is not supported. ` +
        `Please upgrade to Strapi v${MIN_STRAPI_VERSION} or higher.`,
    );
  }

  const auth = strapi.internal_config["better-auth"];
  const apiPermissionsPlugin = strapi.plugin("api-permissions");
  const usersPermissionsPlugin = strapi.plugin("users-permissions");

  /**
   * Throw an error if the better-auth config is missing, as the plugin cannot function without it.
   */
  if (!auth) {
    throw new Error(
      "[@strapi-community/plugin-better-auth] No 'better-auth' config file found. " +
        "Please add a 'better-auth' file to the config folder of your Strapi project. ",
    );
  }

  /**
   * Throw an error if the users-permissions plugin is installed. Migration path will be provided later.
   */
  if (usersPermissionsPlugin) {
    throw new Error(
      "[@strapi-community/plugin-better-auth] The 'users-permissions' plugin is installed. " +
        "Better Auth and users-permissions cannot be used together.",
    );
  }

  /**
   * Register routes dynamically based on the basePath configured in the better-auth instance.
   * The content-api router already has the api prefix (e.g. /api) so we strip it from basePath
   * to avoid doubling it in the final URL.
   */
  const apiPrefix = strapi.config.get("api.rest.prefix", "/api") as string;
  const basePath = auth.options.basePath || "/api/auth";
  const routePath = basePath.startsWith(apiPrefix)
    ? basePath.slice(apiPrefix.length) || "/"
    : basePath;

  strapi.server.routes(createContentApiRoutes(routePath));

  /**
   * Warn if the plugin-api-permissions is not installed, as the content API authentication will not work without it.
   */
  if (!apiPermissionsPlugin) {
    strapi.log.warn(
      "[@strapi-community/plugin-better-auth] plugin-api-permissions is not installed. " +
        "Content API authentication will not work.",
    );

    return;
  }

  /**
   * Register a session resolver for the auth strategy of the API permissions plugin.
   */
  apiPermissionsPlugin
    .service("session")
    .registerSessionResolver(async (ctx: ParameterizedContext) => {
      const auth = strapi.internal_config["better-auth"];

      if (!auth?.api?.getSession) return null;

      const headers = fromNodeHeaders(ctx.request.headers);
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) return null;

      const userId = Number(session.user.id);

      const user = await strapi
        .documents("plugin::better-auth.user")
        .findFirst({
          filters: { id: userId },
          populate: ["roles"],
        });

      if (!user) return null;

      ctx.state.user = user;

      return { user, roles: user.roles };
    });
};
