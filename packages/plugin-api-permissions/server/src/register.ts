import createContentApiStrategy from "./strategies/content-api";
import { getUserUID } from "./utils";
import { set } from "lodash";

const extendUserContentType = () => {
  const userUID = getUserUID();
  const userContentType = strapi.contentTypes[userUID];

  if (!userContentType) {
    throw new Error(
      `The user content type with UID "${userUID}" does not exist. Please check your plugin configuration.`
    );
  }

  if (!userContentType.attributes) {
    throw new Error(
      `The user content type with UID "${userUID}" does not have any attributes. Please check your content type definition.`
    );
  }

  // Add the 'role' relation to the user content type
  set(userContentType.attributes, 'roles', {
    writable: true,
    private: false,
    configurable: false,
    editable: false,
    visible: true,
    default: null,
    type: "relation",
    relation: "manyToMany",
    target: "plugin::api-permissions.role",
  });
}

export default () => {
  extendUserContentType();
  strapi.get("auth").register("content-api", createContentApiStrategy(strapi));
}