export default {
  kind: "collectionType",
  collectionName: "better_auth_verifications",
  info: {
    singularName: "verification",
    pluralName: "verifications",
    displayName: "Verification",
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
      required: true,
    },
    value: {
      type: "string",
      required: true,
    },
    expiresAt: {
      type: "datetime",
      required: true,
    },
    createdAt: {
      type: "datetime",
    },
    updatedAt: {
      type: "datetime",
    },
  },
};
