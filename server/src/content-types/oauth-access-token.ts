export default {
  kind: "collectionType",
  collectionName: "better_auth_oauth_access_tokens",
  info: {
    singularName: "oauth-access-token",
    pluralName: "oauth-access-tokens",
    displayName: "OAuth Access Token",
    description: "Better Auth OAuth access tokens",
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
    accessToken: {
      type: "string",
      unique: true,
    },
    refreshToken: {
      type: "string",
      unique: true,
    },
    accessTokenExpiresAt: {
      type: "datetime",
    },
    refreshTokenExpiresAt: {
      type: "datetime",
    },
    clientId: {
      type: "string",
    },
    userId: {
      type: "integer",
    },
    scopes: {
      type: "text",
    },
  },
};
