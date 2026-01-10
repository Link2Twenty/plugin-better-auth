export default {
  kind: "collectionType",
  collectionName: "better_auth_rate_limits",
  info: {
    singularName: "rate-limit",
    pluralName: "rate-limits",
    displayName: "Rate Limit",
    description: "Better Auth rate limiting",
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
    key: {
      type: "string",
      unique: true,
    },
    count: {
      type: "integer",
    },
    lastRequest: {
      type: "biginteger",
    },
  },
};
