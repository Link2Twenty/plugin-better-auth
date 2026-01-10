export default {
  kind: "collectionType",
  collectionName: "better_auth_passkeys",
  info: {
    singularName: "passkey",
    pluralName: "passkeys",
    displayName: "Passkey",
    description: "Better Auth passkey authentication",
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
    publicKey: {
      type: "string",
      required: true,
    },
    userId: {
      type: "integer",
      required: true,
    },
    credentialID: {
      type: "string",
      required: true,
      unique: true,
    },
    counter: {
      type: "integer",
      required: true,
    },
    deviceType: {
      type: "string",
      required: true,
    },
    backedUp: {
      type: "boolean",
      required: true,
    },
    transports: {
      type: "string",
    },
    aaguid: {
      type: "string",
    },
  },
};
