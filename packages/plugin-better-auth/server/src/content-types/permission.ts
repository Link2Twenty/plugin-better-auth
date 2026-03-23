export default {
  kind: "collectionType",
  collectionName: "better_auth_permissions",
  info: {
    singularName: "permission",
    pluralName: "permissions",
    displayName: "Permission",
    description: "Better Auth permission",
  },
  pluginOptions: {
    "content-manager": {
      visible: false,
    },
    "content-type-builder": {
      visible: false,
    },
  },
  attributes: {
    action: {
      type: "string",
      required: true,
    },
    role: {
      type: "relation",
      relation: "manyToOne",
      target: "plugin::better-auth.role",
      inversedBy: "permissions",
    },
  },
};
