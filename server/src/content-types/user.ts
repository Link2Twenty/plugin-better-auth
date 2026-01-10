export default {
  kind: "collectionType",
  collectionName: "better_auth_users",
  info: {
    singularName: "user",
    pluralName: "users",
    displayName: "User",
    description: "Better Auth user",
  },
  options: {
    draftAndPublish: false,
  },
  pluginOptions: {
    "content-manager": {
      visible: true,
    },
    "content-type-builder": {
      visible: true,
    },
  },
  attributes: {
    name: {
      type: "string",
    },
    email: {
      type: "email",
      required: true,
      unique: true,
    },
    emailVerified: {
      type: "boolean",
      default: false,
    },
    image: {
      type: "string",
    },
    // Two Factor plugin fields
    twoFactorEnabled: {
      type: "boolean",
    },
    // Anonymous plugin fields
    isAnonymous: {
      type: "boolean",
    },
    // Username plugin fields
    username: {
      type: "string",
      unique: true,
    },
    displayUsername: {
      type: "string",
    },
    // Phone Number plugin fields
    phoneNumber: {
      type: "string",
      unique: true,
    },
    phoneNumberVerified: {
      type: "boolean",
    },
  },
};
