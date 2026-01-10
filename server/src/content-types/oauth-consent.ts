export default {
  kind: "collectionType",
  collectionName: "better_auth_oauth_consents",
  info: {
    singularName: "oauth-consent",
    pluralName: "oauth-consents",
    displayName: "OAuth Consents",
    description: "Better Auth OAuth user consents",
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
    clientId: {
      type: "string",
    },
    userId: {
      type: "integer",
    },
    scopes: {
      type: "text",
    },
    consentGiven: {
      type: "boolean",
    },
  },
};
