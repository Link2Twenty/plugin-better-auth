export default {
  kind: "collectionType",
  collectionName: "api_permissions_permissions",
  info: {
    singularName: "permission",
    pluralName: "permissions",
    displayName: "Permission",
    description: "Content API permission",
  },
  pluginOptions: {
    "content-manager": { visible: false },
    "content-type-builder": { visible: false },
  },
  attributes: {
    action: {
      type: "string",
      required: true,
    },
    role: {
      type: "relation",
      relation: "manyToOne",
      target: "plugin::api-permissions.role",
      inversedBy: "permissions",
    },
  },
};
