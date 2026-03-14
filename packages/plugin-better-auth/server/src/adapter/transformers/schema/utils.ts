import type { DBFieldAttribute } from "better-auth";
import type { Core, UID } from "@strapi/strapi";
import kebabCase from "lodash/kebabCase";
import snakeCase from "lodash/snakeCase";
import camelCase from "lodash/camelCase";
import upperFirst from "lodash/upperFirst";
import type { StrapiAttribute, CTBAttributeProperties } from "./types";

/**
 * Maps Better Auth field types to Strapi attribute types
 */
export function mapFieldType(field: DBFieldAttribute): string {
  const type = field.type;

  if (Array.isArray(type)) return "enumeration";

  switch (type) {
    case "string":
      return "string";
    case "number":
      return field.bigint ? "biginteger" : "integer";
    case "boolean":
      return "boolean";
    case "date":
      return "datetime";
    case "json":
    case "string[]":
    case "number[]":
      return "json";
    default:
      return "string";
  }
}

/**
 * Creates attribute properties from a Better Auth field
 */
export function createAttributeProperties(
  fieldName: string,
  field: DBFieldAttribute
): CTBAttributeProperties {
  const properties: CTBAttributeProperties = {
    type: mapFieldType(field),
    pluginOptions: { "better-auth": { managed: true } },
  };

  if (field.required) properties.required = true;
  if (field.unique) properties.unique = true;

  if (field.defaultValue !== undefined && typeof field.defaultValue !== "function") {
    properties.default = field.defaultValue;
  }

  if (Array.isArray(field.type)) {
    properties.enum = field.type;
  }

  // Foreign keys should be integers as we're using numeric IDs
  if (field.references) {
    properties.type = "integer"
  }

  // Special field type overrides
  if (fieldName === "email") properties.type = "email";

  return properties;
}

/**
 * Checks if a field is managed by Better Auth
 */
export function isManagedField(attr: StrapiAttribute): boolean {
  return attr.pluginOptions?.["better-auth"]?.managed === true;
}

/**
 * Gets existing attributes for a content type
 */
export function getExistingAttributes(
  strapi: Core.Strapi,
  uid: UID.ContentType
): Record<string, StrapiAttribute> {
  const contentType = strapi.contentTypes[uid];
  return contentType ? (contentType.attributes as Record<string, StrapiAttribute>) : {};
}

/**
 * Checks if a content type exists
 */
export function contentTypeExists(strapi: Core.Strapi, uid: UID.ContentType): boolean {
  return uid in strapi.contentTypes;
}

/**
 * Gets all existing Better Auth content types
 */
export function getExistingBAContentTypes(
  strapi: Core.Strapi,
  pluginName: string
): UID.ContentType[] {
  const prefix = `plugin::${pluginName}.`;
  return Object.keys(strapi.contentTypes).filter((uid) =>
    uid.startsWith(prefix)
  ) as UID.ContentType[];
}

/**
 * Generates naming conventions for a model
 */
export function generateNames(modelName: string, pluginName: string) {
  const singularName = kebabCase(modelName);
  const pluralName = singularName.endsWith("s") ? singularName : `${singularName}s`;

  return {
    singularName,
    pluralName,
    collectionName: `${snakeCase(pluginName)}_${snakeCase(pluralName)}`,
    uid: `plugin::${pluginName}.${singularName}`,
    globalId: modelName.split("-").map((w) => upperFirst(camelCase(w))).join(""),
    displayName: pluralName
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
  };
}

/**
 * Determines visibility in content manager (only user is visible)
 */
export function isVisible(modelName: string): boolean {
  return modelName === "user";
}
