import type { Core } from "@strapi/strapi";
import type { BetterAuthDBSchema } from "better-auth/db";
import type { SchemaTransformOptions, UpdateSchemaResult } from "./types";
import { transformSchema } from "./transformer";

export * from "./types";
export * from "./utils";
export { transformTable, transformSchema } from "./transformer";

/**
 * Updates Strapi schema based on Better Auth configuration.
 *
 * - Creates new content types for new tables
 * - Updates existing content types when fields change
 * - Deletes orphaned content types when plugins are disabled
 * - Deletes orphaned fields when removed from schema
 * - Preserves user-added custom fields
 */
export async function updateStrapiSchema(
  strapi: Core.Strapi,
  tables: BetterAuthDBSchema,
  options: SchemaTransformOptions = {}
): Promise<UpdateSchemaResult> {
  const { schema, hasChanges, allChangeDetails } = transformSchema(strapi, tables, options);

  if (!hasChanges) {
    return { updated: false, changeDetails: [] };
  }

  const schemaService = strapi.plugin("content-type-builder").service("schema");
  await schemaService.updateSchema(schema);

  return { updated: true, changeDetails: allChangeDetails };
}