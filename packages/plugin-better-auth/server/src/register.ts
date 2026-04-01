import type { Core } from "@strapi/strapi";
import { fromNodeHeaders } from "better-auth/node";
import type { ParameterizedContext } from "koa";

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const auth = strapi.internal_config["better-auth"];
  const apiPermissionsPlugin = strapi.plugin("api-permissions")

  /**
   * Throw an error if the better-auth config is missing, as the plugin cannot function without it.
   */
  if (!auth) {
    throw new Error(
      "[@strapi-community/plugin-better-auth] No 'better-auth' config file found. " +
      "Please add a 'better-auth' file to the config folder of your Strapi project. "
    );
  }

  /**
   * Warn if the plugin-api-permissions is not installed, as the content API authentication will not work without it.
   */
  if (!apiPermissionsPlugin) {
    strapi.log.warn(
      "[@strapi-community/plugin-better-auth] plugin-api-permissions is not installed. " +
      "Content API authentication will not work."
    );

    return;
  }

  /**
   * Register a session resolver for the auth strategy of the API permissions plugin.
   */
  apiPermissionsPlugin.service("session").registerSessionResolver(
    async (ctx: ParameterizedContext) => {
      const auth = strapi.internal_config['better-auth'];

      if (!auth?.api?.getSession) return null;

      const headers = fromNodeHeaders(
        ctx.request.headers
      );
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) return null;

      const userId = Number(session.user.id);

      const user = await strapi.documents("plugin::better-auth.user").findFirst({
        filters: { id: userId },
        populate: ["roles"],
      });

      if (!user) return null;

      ctx.state.user = user;

      return { user, roles: user.roles };
    }
  );
}