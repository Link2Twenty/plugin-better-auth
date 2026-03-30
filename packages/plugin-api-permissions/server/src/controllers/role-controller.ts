import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import type { Context } from "koa";
import { getService } from "../utils";

const { ApplicationError, ValidationError } = errors;

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const roleService = () =>
    getService(strapi, "role") as ReturnType<(typeof import("../services/role"))["default"]>;
  const apiPermissionsService = () =>
    getService(strapi, "api-permissions") as ReturnType<(typeof import("../services/api-permissions"))["default"]>;

  return {
    async getActions(ctx: Context) {
      const actions = apiPermissionsService().getActions();
      ctx.send({ actions });
    },

    async getPermissionsLayout(ctx: Context) {
      const layout = apiPermissionsService().getPermissionsLayout();
      ctx.send({ data: { conditions: [], sections: layout } });
    },

    async createRole(ctx: Context) {
      const body = ctx.request.body as Record<string, unknown>;
      if (!body || Object.keys(body).length === 0) {
        throw new ValidationError("Request body cannot be empty");
      }
      await roleService().createRole(body as never);
      ctx.send({ ok: true });
    },

    async findOne(ctx: Context) {
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

    async find(ctx: Context) {
      const roles = await roleService().find();
      ctx.send({ roles });
    },

    async updateRole(ctx: Context) {
      const roleId = ctx.params.role;
      const body = ctx.request.body as Record<string, unknown>;
      if (!body || Object.keys(body).length === 0) {
        throw new ValidationError("Request body cannot be empty");
      }
      await roleService().updateRole(roleId, body as never);
      ctx.send({ ok: true });
    },

    async deleteRole(ctx: Context) {
      const roleId = ctx.params.role;

      const ROLE_UID = "plugin::api-permissions.role";
      const publicRole = await strapi.db
        .query(ROLE_UID)
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
