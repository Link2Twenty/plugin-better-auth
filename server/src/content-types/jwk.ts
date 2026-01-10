export default {
  kind: "collectionType",
  collectionName: "better_auth_jwks",
  info: {
    singularName: "jwk",
    pluralName: "jwks",
    displayName: "JWKs",
    description: "Better Auth JSON Web Keys",
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
    publicKey: {
      type: "text",
      required: true,
    },
    privateKey: {
      type: "text",
      required: true,
    },
  },
};
