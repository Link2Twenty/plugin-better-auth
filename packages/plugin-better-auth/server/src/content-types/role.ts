export default {
  kind: "collectionType",
  collectionName: "better_auth_roles",
  info: {
    singularName: "role",
    pluralName: "roles",
    displayName: "Role",
    description: "Better Auth role",
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
    name: {
      type: "string",
      required: true,
      minLength: 3,
    },
    description: {
      type: "string",
    },
    type: {
      type: "string",
      unique: true,
    },
    permissions: {
      type: "relation",
      relation: "oneToMany",
      target: "plugin::better-auth.permission",
      mappedBy: "role",
    },
    users: {
      type: "relation",
      relation: "oneToMany",
      target: "plugin::better-auth.user",
      mappedBy: "role",
    },
  },
};
