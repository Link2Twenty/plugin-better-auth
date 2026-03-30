import type { Auth } from "better-auth";
import { fromNodeHeaders } from "better-auth/node";
import type { ParameterizedContext } from "koa";
import contentTypes from "./content-types";
import controllers from "./controllers";
import routes from "./routes";
import services from "./services";

export default {
  controllers,
  routes,
  contentTypes,
  services,
  register({ strapi }) {
    // Register the Better Auth session resolver with the api-permissions plugin.
    // The api-permissions plugin uses this resolver to authenticate content API requests
    // without having any dependency on Better Auth itself.
    const apiPermissionsPlugin = strapi.plugin("api-permissions") as
      | { service: (name: string) => { registerSessionResolver: (fn: unknown) => void } }
      | undefined;

    if (!apiPermissionsPlugin) {
      strapi.log.warn(
        "[@strapi-community/plugin-better-auth] plugin-api-permissions is not installed. " +
        "Content API authentication will not work."
      );
      return;
    }

    apiPermissionsPlugin.service("api-permissions").registerSessionResolver(
      async (ctx: ParameterizedContext) => {
        const authConfig = (strapi as unknown as { internal_config: Record<string, unknown> })
          .internal_config["better-auth"] as Auth | (() => Auth) | undefined;

        const auth = typeof authConfig === "function" ? authConfig() : authConfig;
        if (!auth?.api?.getSession) return null;

        const headers = fromNodeHeaders(
          ctx.request.headers as Record<string, string | string[] | undefined>
        );
        const session = await auth.api.getSession({ headers });

        if (!session?.user?.id) return null;

        const userId =
          typeof session.user.id === "string" ? Number(session.user.id) : session.user.id;

        const user = await strapi.db.query("plugin::better-auth.user").findOne({
          where: { id: userId },
          populate: ["role"],
        });

        if (!user) return null;

        ctx.state.user = user;

        const role = (user as { role?: { id: number } }).role;
        return { userId, roleId: role?.id };
      }
    );
  },
  async bootstrap({ strapi }) {
    const bootstrapFn = (await import("./bootstrap")).default;
    await bootstrapFn({ strapi });
  },
};