import type { Core } from "@strapi/strapi";

const ROLE_UID = "plugin::api-permissions.role";

const RBAC_ACTIONS = [
  {
    section: "plugins" as const,
    displayName: "Create",
    uid: "roles.create",
    subCategory: "roles",
    pluginName: "api-permissions",
  },
  {
    section: "plugins" as const,
    displayName: "Read",
    uid: "roles.read",
    subCategory: "roles",
    pluginName: "api-permissions",
  },
  {
    section: "plugins" as const,
    displayName: "Update",
    uid: "roles.update",
    subCategory: "roles",
    pluginName: "api-permissions",
  },
  {
    section: "plugins" as const,
    displayName: "Delete",
    uid: "roles.delete",
    subCategory: "roles",
    pluginName: "api-permissions",
  },
];

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  await strapi.service("admin::permission").actionProvider.registerMany(RBAC_ACTIONS);

  const roleCount = await strapi.db.query(ROLE_UID).count();

  if (roleCount === 0) {
    await strapi.db.query(ROLE_UID).create({
      data: {
        name: "Authenticated",
        description: "Default role given to authenticated users.",
        type: "authenticated",
      },
    });

    await strapi.db.query(ROLE_UID).create({
      data: {
        name: "Public",
        description: "Default role given to unauthenticated users.",
        type: "public",
      },
    });
  }
};
