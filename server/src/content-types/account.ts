export default {
  kind: "collectionType",
  collectionName: "better_auth_accounts",
  info: {
    singularName: "account",
    pluralName: "accounts",
    displayName: "Account",
    description: "Better Auth account",
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
    userId: {
      type: "integer",
      required: true,
    },
    accountId: {
      type: "integer",
      required: true,
    },
    providerId: {
      type: "string",
      required: true,
    },
    accessToken: {
      type: "text",
    },
    refreshToken: {
      type: "text",
    },
    accessTokenExpiresAt: {
      type: "datetime",
    },
    refreshTokenExpiresAt: {
      type: "datetime",
    },
    scope: {
      type: "string",
    },
    idToken: {
      type: "text",
    },
    password: {
      type: "string",
    },
    createdAt: {
      type: "datetime",
    },
    updatedAt: {
      type: "datetime",
    },
  },
};
