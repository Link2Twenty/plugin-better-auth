import type { UID } from "@strapi/strapi";

/**
 * Strapi CTB attribute action type
 */
export type AttributeAction = "create" | "update" | "delete";

/**
 * Strapi CTB content type action type
 */
export type ContentTypeAction = "create" | "update" | "delete";

/**
 * Strapi attribute definition (from existing content type)
 */
export interface StrapiAttribute {
  type: string;
  required?: boolean;
  unique?: boolean;
  default?: unknown;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
  pluginOptions?: {
    "better-auth"?: {
      managed?: boolean;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Strapi CTB attribute properties
 */
export interface CTBAttributeProperties {
  type: string;
  required?: boolean;
  configurable?: boolean;
  unique?: boolean;
  default?: unknown;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
  pluginOptions?: Record<string, unknown>;
}

/**
 * Strapi CTB attribute entry
 */
export interface CTBAttribute {
  action: AttributeAction;
  name: string;
  properties?: CTBAttributeProperties;
}

/**
 * Strapi CTB content type entry
 */
export interface CTBContentType {
  action: ContentTypeAction;
  uid: UID.ContentType;
  modelName: string;
  kind: "collectionType" | "singleType";
  globalId: string;
  pluginOptions: Record<string, unknown>;
  collectionName: string;
  modelType: "contentType";
  attributes: CTBAttribute[];
  status?: "CHANGED" | "NEW";
  draftAndPublish: boolean;
  singularName: string;
  plugin: string;
  pluralName: string;
  displayName: string;
  apiName?: string;
}

/**
 * Strapi CTB schema format
 */
export interface CTBSchema {
  components: unknown[];
  contentTypes: CTBContentType[];
}

/**
 * Configuration options for schema transformation
 */
export interface SchemaTransformOptions {
  pluginName?: string;
  contentManagerVisible?: boolean;
  contentTypeBuilderVisible?: boolean;
}

/**
 * Result of transforming a table
 */
export interface TransformResult {
  contentType: CTBContentType;
  hasChanges: boolean;
  changeDetails: string[];
}

/**
 * Result of transforming the entire schema
 */
export interface SchemaTransformResult {
  schema: CTBSchema;
  hasChanges: boolean;
  allChangeDetails: string[];
}

/**
 * Result of updating the Strapi schema
 */
export interface UpdateSchemaResult {
  updated: boolean;
  changeDetails: string[];
}

/**
 * Internal Strapi fields to skip
 */
export const INTERNAL_FIELDS = [
  "id",
  "createdAt",
  "updatedAt",
  "publishedAt",
  "createdBy",
  "updatedBy",
  "locale",
  "localizations",
];
