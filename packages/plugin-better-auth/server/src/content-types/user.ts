export default {
  kind: "collectionType",
  collectionName: "better_auth_users",
  info: {
    singularName: "user",
    pluralName: "users",
    displayName: "Users",
    description: "Better Auth user",
  },
  options: {
    draftAndPublish: false,
  },
  pluginOptions: {
    "content-manager": {
      visible: true,
    },
    "content-type-builder": {
      visible: true,
    },
  },
  attributes: {
    name: {
      type: "string",
      configurable: false,
      pluginOptions: {
        "better-auth": {
          managed: true,
        },
      },
      required: true,
    },
    email: {
      type: "email",
      configurable: false,
      pluginOptions: {
        "better-auth": {
          managed: true,
        },
      },
      required: true,
      unique: true,
    },
    emailVerified: {
      type: "boolean",
      configurable: false,
      pluginOptions: {
        "better-auth": {
          managed: true,
        },
      },
      required: true,
      default: false,
    },
    image: {
      type: "string",
      configurable: false,
      pluginOptions: {
        "better-auth": {
          managed: true,
        },
      },
    },
    role: {
      type: "relation",
      relation: "manyToOne",
      target: "plugin::better-auth.role",
      inversedBy: "users",
      pluginOptions: {
        "better-auth": {
          managed: true,
        },
      },
    },
  },
};
