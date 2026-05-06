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

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  await strapi
    .service("admin::permission")
    .actionProvider.registerMany(RBAC_ACTIONS);

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
