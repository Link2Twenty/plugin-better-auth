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
  const { schema, allChangeDetails } = transformSchema(strapi, tables);

  // The CTB service clones the in-memory __schema__ when writing content types
  // back to disk, so any pre-flight mutations here are reflected in the output.
  for (const contentType of schema.contentTypes) {
    if (contentType.action === "delete") continue;
    const uid = contentType.uid;

    const rawSchema = (
      strapi.contentTypes[uid] as {
        __schema__?: {
          collectionName?: string;
          attributes?: Record<string, unknown>;
        };
      }
    )?.__schema__;

    if (rawSchema) {
      // Patch collectionName so a table_prefix change is written to disk.
      // CTB does not update collectionName itself — it only handles attributes.
      rawSchema.collectionName = contentType.collectionName;

      // Remove orphaned managed fields so CTB does not write them back.
      const orphanedFields = contentType.attributes
        .filter((attr) => attr.action === "delete")
        .map((attr) => attr.name);
      for (const field of orphanedFields) {
        delete rawSchema.attributes?.[field];
      }
    }
  }

  const schemaService = strapi.plugin("content-type-builder").service("schema");
  await schemaService.updateSchema(schema);

  return { changeDetails: allChangeDetails };
}
