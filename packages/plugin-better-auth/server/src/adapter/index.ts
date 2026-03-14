import type { UID } from "@strapi/strapi";
import {
  createAdapterFactory,
  type DBAdapterDebugLogOption,
} from "better-auth/adapters";
import kebabCase from "lodash/kebabCase";
import { cleanupStrapiApp, getStrapiApp } from "./cli";
import {
  type SchemaTransformOptions,
  transformFilters,
  transformSort,
  updateStrapiSchema,
} from "./transformers";

/**
 * Configuration options for the Strapi Better Auth adapter
 */
interface StrapiAdapterConfig {
  /**
   * Helps you debug issues with the adapter
   */
  debugLogs?: DBAdapterDebugLogOption;
  /**
   * If the table names in the schema are plural
   */
  usePlural?: boolean;
}

/**
 * Strapi Better Auth Database Adapter
 *
 * This adapter allows Better Auth to use Strapi as its database backend.
 * It implements all the required methods to interact with Strapi's entity service.
 */
export const strapiAdapter = (config?: StrapiAdapterConfig) => {
  const { debugLogs = false, usePlural = false } = config || {};

  return createAdapterFactory({
    config: {
      adapterId: "strapi-adapter",
      adapterName: "Strapi Adapter",
      usePlural,
      debugLogs,
      supportsJSON: true,
      supportsDates: true,
      supportsBooleans: true,
      supportsNumericIds: true,
    },
    // @ts-expect-error
    // Caused by returning true to opt-out of Better Auth's file writing logic in createSchema method
    // https://github.com/better-auth/better-auth/issues/8590
    adapter: ({
      getModelName,
      getFieldName,
      transformInput,
      transformOutput,
      debugLog,
    }) => {
      /**
       * Get the Strapi UID for a model
       */
      const getModelUid = (model: string): UID.ContentType => {
        const modelName = getModelName(model);
        return `plugin::better-auth.${kebabCase(modelName)}`;
      };

      return {
        /**
         * Create a new record
         */
        create: async ({ data, model, select }) => {
          debugLog("create", { model, data, select });

          const uid = getModelUid(model);
          const transformedData = await transformInput(data, model, "create");

          const result = await strapi.documents(uid).create({
            data: transformedData,
          });

          const output = await transformOutput(result, model);

          return output;
        },

        /**
         * Update a single record
         */
        update: async ({ where, update, model }) => {
          debugLog("update", { model, where, update });

          const uid = getModelUid(model);
          const filters = transformFilters(where, model, getFieldName);
          const transformedUpdate = await transformInput(
            update as Record<string, unknown>,
            model,
            "update",
          );

          // Find the record first
          const record = await strapi.documents(uid).findFirst({
            filters,
            limit: 1,
          });

          if (!record) {
            throw new Error(`Record not found for model ${model}`);
          }

          const result = await strapi.documents(uid).update({
            documentId: record.documentId,
            data: transformedUpdate,
          });

          const output = await transformOutput(result, model);
          return output;
        },

        /**
         * Update multiple records
         */
        updateMany: async ({ where, update, model }) => {
          debugLog("updateMany", { model, where, update });

          const uid = getModelUid(model);
          const filters = transformFilters(where, model, getFieldName);
          const transformedUpdate = await transformInput(
            update,
            model,
            "update",
          );

          // Find all matching records
          const records = await strapi.documents(uid).findMany({
            filters,
          });

          if (!records || records.length === 0) {
            return 0;
          }

          // Update each record
          for (const record of records) {
            await strapi.documents(uid).update({
              documentId: record.documentId,
              data: transformedUpdate,
            });
          }

          return records.length;
        },

        /**
         * Delete a single record
         */
        delete: async ({ where, model }) => {
          debugLog("delete", { model, where });

          const uid = getModelUid(model);
          const filters = transformFilters(where, model, getFieldName);

          // Find the record first
          const record = await strapi.documents(uid).findFirst({
            filters,
            limit: 1,
          });

          if (!record) {
            return;
          }

          await strapi.documents(uid).delete({
            documentId: record.documentId,
          });
        },

        /**
         * Delete multiple records
         */
        deleteMany: async ({ where, model }) => {
          debugLog("deleteMany", { model, where });

          const uid = getModelUid(model);
          const filters = transformFilters(where, model, getFieldName);

          // Find all matching records
          const records = await strapi.documents(uid).findMany({
            filters,
          });

          if (!records || records.length === 0) {
            return 0;
          }

          // Delete each record
          for (const record of records) {
            await strapi.documents(uid).delete({
              documentId: record.documentId,
            });
          }

          return records.length;
        },

        /**
         * Find a single record
         */
        findOne: async ({ where, model, select }) => {
          debugLog("findOne", { model, where, select });

          const uid = getModelUid(model);
          const filters = transformFilters(where, model, getFieldName);

          const record = await strapi.documents(uid).findFirst({
            filters,
            limit: 1,
          });

          if (!record) {
            return null;
          }

          const output = await transformOutput(record, model);
          return output;
        },

        /**
         * Find multiple records
         */
        findMany: async ({ where, model, limit, offset, sortBy }) => {
          debugLog("findMany", { model, where, limit, offset, sortBy });

          const uid = getModelUid(model);
          const filters = transformFilters(where, model, getFieldName);

          const queryOptions: { [key: string]: unknown } = {
            filters,
          };

          if (limit !== undefined) {
            queryOptions.limit = limit;
          }

          if (offset !== undefined) {
            queryOptions.start = offset;
          }

          if (sortBy) {
            // Convert Better Auth sortBy to Strapi sort format
            queryOptions.sort = transformSort(sortBy, model, getFieldName);
          }

          const records = await strapi.documents(uid).findMany(queryOptions);

          if (!records || records.length === 0) {
            return [];
          }

          return Promise.all(
            records.map(async (record) => {
              const output = await transformOutput(record, model);
              return output;
            }),
          );
        },

        /**
         * Count records
         */
        count: async ({ where, model }) => {
          debugLog("count", { model, where });

          const uid = getModelUid(model);
          const filters = transformFilters(where, model, getFieldName);

          const records = await strapi.documents(uid).findMany({
            filters,
          });

          return records ? records.length : 0;
        },

        /**
         * Create schema files for Strapi content-types
         *
         * This method uses Strapi's content-type-builder updateSchema service
         * to create/update content types based on Better Auth schema.
         * This is the same API that Strapi's admin panel uses.
         */
        createSchema: async ({ tables }) => {
          debugLog("createSchema", { tables });

          const schemaOptions: SchemaTransformOptions = {
            pluginName: "better-auth",
          };

          // Bootstrap Strapi to access the content-type-builder service
          const { app: strapi, distDir } = await getStrapiApp();

          // Use Strapi's content-type-builder service to create/update schemas
          await updateStrapiSchema(strapi, tables, schemaOptions);

          // Clean up Strapi's dist directory and destroy the app instance
          cleanupStrapiApp(strapi, distDir);

          /**
           * We return true to opt-out of the file writing logic from Better Auth.
           * This is more like a workaround than a proper solution.
           *
           * @see https://github.com/better-auth/better-auth/issues/8590
           */
          return true;
        },

        /**
         * Return adapter options
         */
        options: config,
      };
    },
  });
};
