import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import kebabCase from "lodash/kebabCase";
import omit from "lodash/omit";
import pick from "lodash/pick";
import set from "lodash/set";

const ROLE_UID = "plugin::api-permissions.role" as const;
const PERMISSION_UID = "plugin::api-permissions.permission" as const;

// The user UID is provided by the auth provider (e.g. plugin-better-auth).
// User counting will silently return 0 if the content-type is not registered.
const USER_UID = "plugin::better-auth.user" as const;

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async createRole(params: {
    name: string;
    description?: string;
    type?: string;
    permissions?: Record<
      string,
      { controllers: Record<string, Record<string, { enabled: boolean }>> }
    >;
  }) {
    const permissions = params.permissions ?? {};
    const type =
      params.type ?? kebabCase(String(params.name).toLowerCase().replace(/[^\w\s-]/g, ""));

    const role = await strapi.db.query(ROLE_UID).create({
      data: {
        ...omit(params, ["users", "permissions"]),
        type,
      },
    });

    const createPromises: Promise<unknown>[] = [];
    for (const [typeName, typeData] of Object.entries(permissions)) {
      if (!typeData?.controllers) continue;
      for (const [controllerName, controllerData] of Object.entries(typeData.controllers)) {
        for (const [actionName, actionData] of Object.entries(controllerData)) {
          if (actionData?.enabled) {
            const actionId = `${typeName}.${controllerName}.${actionName}`;
            createPromises.push(
              strapi.db.query(PERMISSION_UID).create({
                data: { action: actionId, role: role.id },
              })
            );
          }
        }
      }
    }
    await Promise.all(createPromises);
  },

  async findOne(roleId: string | number) {
    const role = await strapi.db
      .query(ROLE_UID)
      .findOne({ where: { id: roleId }, populate: ["permissions"] });

    if (!role) {
      throw new errors.NotFoundError("Role not found");
    }

    const apiPermissionsService = strapi.plugin("api-permissions").service("api-permissions") as {
      getActions: () => Record<string, unknown>;
    };
    const allActions = apiPermissionsService.getActions();

    for (const permission of role.permissions ?? []) {
      const parts = (permission as { action: string }).action.split(".");
      if (parts.length >= 3) {
        const [typeName, controllerName, actionName] = parts;
        set(allActions, `${typeName}.controllers.${controllerName}.${actionName}`, {
          enabled: true,
          policy: "",
        });
      }
    }

    let nb_users = 0;
    try {
      nb_users = await strapi.db.query(USER_UID).count({
        where: { role: { id: role.id } },
      });
    } catch {
      // User content-type may not be from better-auth
    }

    return {
      ...role,
      permissions: allActions,
      nb_users,
    };
  },

  async find() {
    const roles = await strapi.db.query(ROLE_UID).findMany();

    roles.sort((a, b) =>
      String((a as { name?: string }).name ?? "").localeCompare(
        String((b as { name?: string }).name ?? "")
      )
    );

    for (const role of roles) {
      let count = 0;
      try {
        count = await strapi.db.query(USER_UID).count({
          where: { role: { id: role.id } },
        });
      } catch {
        // User content-type may not be from better-auth
      }
      (role as Record<string, unknown>).nb_users = count;
    }

    return roles;
  },

  async updateRole(
    roleId: string | number,
    data: {
      name?: string;
      description?: string;
      permissions?: Record<
        string,
        { controllers: Record<string, Record<string, { enabled: boolean }>> }
      >;
    }
  ) {
    const role = await strapi.db
      .query(ROLE_UID)
      .findOne({ where: { id: roleId }, populate: ["permissions"] });

    if (!role) {
      throw new errors.NotFoundError("Role not found");
    }

    await strapi.db.query(ROLE_UID).update({
      where: { id: roleId },
      data: pick(data, ["name", "description"]),
    });

    const permissions = data.permissions ?? {};
    const newActions: string[] = [];

    for (const [typeName, typeData] of Object.entries(permissions)) {
      if (!typeData?.controllers) continue;
      for (const [controllerName, controllerData] of Object.entries(typeData.controllers)) {
        for (const [actionName, actionData] of Object.entries(controllerData)) {
          if (actionData?.enabled) {
            newActions.push(`${typeName}.${controllerName}.${actionName}`);
          }
        }
      }
    }

    const oldPermissions = (role.permissions ?? []) as Array<{ id: number; action: string }>;
    const oldActions = oldPermissions.map((p) => p.action);

    const toDelete = oldPermissions.filter((p) => !newActions.includes(p.action));
    const toCreate = newActions.filter((a) => !oldActions.includes(a));

    await Promise.all(
      toDelete.map((p) => strapi.db.query(PERMISSION_UID).delete({ where: { id: p.id } }))
    );
    await Promise.all(
      toCreate.map((action) =>
        strapi.db.query(PERMISSION_UID).create({
          data: { action, role: role.id },
        })
      )
    );
  },

  async deleteRole(roleId: string | number, defaultRoleId: string | number) {
    const role = await strapi.db
      .query(ROLE_UID)
      .findOne({ where: { id: roleId }, populate: ["permissions"] });

    if (!role) {
      throw new errors.NotFoundError("Role not found");
    }

    // Reassign users from the deleted role to the default (public) role
    try {
      const users = await strapi.db.query(USER_UID).findMany({
        where: { role: { id: roleId } },
      });
      for (const user of users) {
        await strapi.db.query(USER_UID).update({
          where: { id: (user as { id: number }).id },
          data: { role: defaultRoleId },
        });
      }
    } catch {
      // User content-type may not be from better-auth
    }

    const permissions = (role.permissions ?? []) as Array<{ id: number }>;
    for (const permission of permissions) {
      await strapi.db.query(PERMISSION_UID).delete({ where: { id: permission.id } });
    }

    await strapi.db.query(ROLE_UID).delete({ where: { id: roleId } });
  },
});
