import type { Core } from "@strapi/strapi";
import type { BetterAuthDBSchema } from "better-auth/db";
import { transformSchema } from "./transformer";
import type { UpdateSchemaResult } from "./types";

export { transformSchema, transformTable } from "./transformer";
export * from "./types";
export * from "./utils";

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
): Promise<UpdateSchemaResult> {
  const { schema, hasChanges, allChangeDetails } = transformSchema(
    strapi,
    tables,
  );

  if (!hasChanges) {
    return { updated: false, changeDetails: [] };
  }

  // The CTB service's editContentType preserves non-configurable attributes and
  // will not delete them even when they are absent from the new attribute list.
  // Orphaned managed fields (e.g. renamed fields) must be removed from the
  // in-memory schema before the CTB service clones it, so they are not written
  // back to disk.
  for (const contentType of schema.contentTypes) {
    if (contentType.action === "delete") continue;
    const uid = contentType.uid;
    const orphanedFields = contentType.attributes
      .filter((attr) => attr.action === "delete")
      .map((attr) => attr.name);

    if (orphanedFields.length > 0) {
      const rawSchema = (
        strapi.contentTypes[uid] as {
          __schema__?: { attributes?: Record<string, unknown> };
        }
      )?.__schema__;
      if (rawSchema?.attributes) {
        for (const field of orphanedFields) {
          delete rawSchema.attributes[field];
        }
      }
    }
  }

  const schemaService = strapi.plugin("content-type-builder").service("schema");
  await schemaService.updateSchema(schema);

  return { updated: true, changeDetails: allChangeDetails };
}
