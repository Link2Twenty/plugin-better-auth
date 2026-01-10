export default {
  kind: "collectionType",
  collectionName: "better_auth_two_factor",
  info: {
    singularName: "two-factor",
    pluralName: "two-factors",
    displayName: "Two Factor",
    description: "Better Auth two factor authentication",
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
    secret: {
      type: "string",
      required: true,
    },
    backupCodes: {
      type: "string",
      required: true,
    },
    userId: {
      type: "integer",
      required: true,
    },
  },
};
