export default {
  kind: "collectionType",
  collectionName: "better_auth_verifications",
  info: {
    singularName: "verification",
    pluralName: "verifications",
    displayName: "Verifications",
    description: "Better Auth verification",
  },
  options: {
    draftAndPublish: false,
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
    identifier: {
      type: "string",
      pluginOptions: {
        "better-auth": {
          managed: true,
        },
      },
      required: true,
    },
    value: {
      type: "string",
      pluginOptions: {
        "better-auth": {
          managed: true,
        },
      },
      required: true,
    },
    expiresAt: {
      type: "datetime",
      pluginOptions: {
        "better-auth": {
          managed: true,
        },
      },
      required: true,
    },
  },
};
