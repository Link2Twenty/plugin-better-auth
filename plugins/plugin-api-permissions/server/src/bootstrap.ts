import type { Core } from "@strapi/strapi";
import { PLUGIN_ID, ROLE_UID } from "./utils";

const RBAC_ACTIONS = [
  {
    section: "plugins",
    displayName: "Create",
    uid: "roles.create",
    subCategory: "roles",
    pluginName: PLUGIN_ID,
  },
  {
    section: "plugins",
    displayName: "Read",
    uid: "roles.read",
    subCategory: "roles",
    pluginName: PLUGIN_ID,
  },
  {
    section: "plugins",
    displayName: "Update",
    uid: "roles.update",
    subCategory: "roles",
    pluginName: PLUGIN_ID,
  },
  {
    section: "plugins",
    displayName: "Delete",
    uid: "roles.delete",
    subCategory: "roles",
    pluginName: PLUGIN_ID,
  },
];

// This list should be kept in sync with the permissions defined in content manager for the API Role content type
const FULL_ACTIONS = [
  {
    pluginAction: "plugin::api-permissions.roles.read",
    cmAction: "plugin::content-manager.explorer.read",
  },
  {
    pluginAction: "plugin::api-permissions.roles.create",
    cmAction: "plugin::content-manager.explorer.create",
  },
  {
    pluginAction: "plugin::api-permissions.roles.update",
    cmAction: "plugin::content-manager.explorer.update",
  },
  {
    pluginAction: "plugin::api-permissions.roles.delete",
    cmAction: "plugin::content-manager.explorer.delete",
  },
];

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  const provider = strapi.service("admin::permission").actionProvider;

  await provider.registerMany(RBAC_ACTIONS);
  await manualPermissionOverride(strapi);

  const roleCount = await strapi.documents(ROLE_UID).count({});

  if (roleCount === 0) {
    await strapi.documents(ROLE_UID).create({
      data: {
        name: "Authenticated",
        description: "Default role given to authenticated users.",
        type: "authenticated",
      },
    });

    await strapi.documents(ROLE_UID).create({
      data: {
        name: "Public",
        description: "Default role given to unauthenticated users.",
        type: "public",
      },
    });
  }
};

/**
 * Manually override permissions for API Roles to ensure they are always in sync with Content Manager permissions.
 * @param strapi The Strapi instance
 */
const manualPermissionOverride = async (strapi: Core.Strapi) => {
  const provider = strapi.service("admin::permission").actionProvider;

  for (const { pluginAction, cmAction } of FULL_ACTIONS) {
    const admin = provider.get(cmAction);
    const alias = provider.get(pluginAction);

    if (admin) {
      if (!admin.subjects) admin.subjects = [];

      if (!admin.subjects.includes(ROLE_UID)) admin.subjects.push(ROLE_UID);
    }

    if (alias) {
      if (!alias.aliases) alias.aliases = [];

      const exists = alias.aliases.some(
        ({ actionId, subjects }: { actionId: string; subjects?: string[] }) => {
          return actionId === cmAction && subjects?.includes(ROLE_UID);
        },
      );

      if (!exists) {
        alias.aliases.push({ actionId: cmAction, subjects: [ROLE_UID] });
      }
    }
  }

  try {
    await strapi.service("admin::role")?.resetSuperAdminPermissions?.();
  } catch (err) {
    strapi.log.error(
      "Failed to sync Super Admin permissions for API Roles:",
      err,
    );
  }
};
