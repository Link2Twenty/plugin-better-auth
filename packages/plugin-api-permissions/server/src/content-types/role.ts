import { PERMISSION_UID } from "../utils";

export default {
  kind: "collectionType",
  collectionName: "api_permissions_roles",
  info: {
    singularName: "role",
    pluralName: "roles",
    displayName: "Role",
    description: "Content API role",
  },
  pluginOptions: {
    "content-manager": { visible: false },
    "content-type-builder": { visible: false },
  },
  attributes: {
    name: {
      type: "string",
      required: true,
      minLength: 3,
    },
    description: {
      type: "string",
    },
    type: {
      type: "string",
      unique: true,
    },
    permissions: {
      type: "relation",
      relation: "oneToMany",
      target: PERMISSION_UID,
      mappedBy: "role",
    },
  },
};
