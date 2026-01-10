export default {
  kind: "collectionType",
  collectionName: "better_auth_sessions",
  info: {
    singularName: "session",
    pluralName: "sessions",
    displayName: "Session",
    description: "Better Auth session",
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
    token: {
      type: "string",
      required: true,
      unique: true,
    },
    expiresAt: {
      type: "datetime",
      required: true,
    },
    ipAddress: {
      type: "string",
    },
    userAgent: {
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
