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
      pluginOptions: {
        "better-auth": {
          managed: true,
        },
      },
      required: true,
    },
    email: {
      type: "email",
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
      pluginOptions: {
        "better-auth": {
          managed: true,
        },
      },
    },
  },
};
