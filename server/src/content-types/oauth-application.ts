export default {
  kind: "collectionType",
  collectionName: "better_auth_oauth_applications",
  info: {
    singularName: "oauth-application",
    pluralName: "oauth-applications",
    displayName: "OAuth Applications",
    description: "Better Auth OAuth applications",
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
    name: {
      type: "string",
    },
    icon: {
      type: "string",
    },
    metadata: {
      type: "text",
    },
    clientId: {
      type: "string",
      unique: true,
    },
    clientSecret: {
      type: "string",
    },
    redirectURLs: {
      type: "text",
    },
    type: {
      type: "string",
    },
    disabled: {
      type: "boolean",
    },
    userId: {
      type: "integer",
    },
  },
};
