import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import { getService } from "../utils";

const { ApplicationError, ValidationError } = errors;

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const roleService = () =>
    getService(strapi, "role") as ReturnType<(typeof import("../services/role"))["default"]>;
  const betterAuthService = () =>
    getService(strapi, "better-auth") as ReturnType<(typeof import("../services/better-auth"))["default"]>;

  return {
    async getActions(ctx: { send: (body: unknown) => void }) {
      const actions = betterAuthService().getActions();
      ctx.send({ actions });
    },

    async getPermissionsLayout(ctx: { send: (body: unknown) => void }) {
      const layout = betterAuthService().getPermissionsLayout();
      ctx.send({ data: { conditions: [], sections: layout } });
    },

    async createRole(ctx: { request: { body: unknown }; send: (body: unknown) => void }) {
      const body = ctx.request.body as Record<string, unknown>;
      if (!body || Object.keys(body).length === 0) {
        throw new ValidationError("Request body cannot be empty");
      }
      await roleService().createRole(body as never);
      ctx.send({ ok: true });
    },

    async findOne(ctx: { params: { id: string }; send: (body: unknown) => void; notFound: () => void }) {
      const { id } = ctx.params;
      try {
        const role = await roleService().findOne(id);
        ctx.send({ role });
      } catch (err) {
        if (err instanceof errors.NotFoundError) {
          return ctx.notFound();
        }
        throw err;
      }
    },

    async find(ctx: { send: (body: unknown) => void }) {
      const roles = await roleService().find();
      ctx.send({ roles });
    },

    async updateRole(ctx: {
      params: { role: string };
      request: { body: unknown };
      send: (body: unknown) => void;
    }) {
      const roleId = ctx.params.role;
      const body = ctx.request.body as Record<string, unknown>;
      if (!body || Object.keys(body).length === 0) {
        throw new ValidationError("Request body cannot be empty");
      }
      await roleService().updateRole(roleId, body as never);
      ctx.send({ ok: true });
    },

    async deleteRole(ctx: { params: { role: string }; send: (body: unknown) => void }) {
      const roleId = ctx.params.role;

      const publicRole = await strapi.db
        .query("plugin::better-auth.role")
        .findOne({ where: { type: "public" } });

      if (!publicRole) {
        throw new ApplicationError("Public role not found");
      }

      if (roleId === String((publicRole as { id: number }).id)) {
        throw new ApplicationError("Cannot delete public role");
      }

      await roleService().deleteRole(roleId, (publicRole as { id: number }).id);
      ctx.send({ ok: true });
    },
  };
};
