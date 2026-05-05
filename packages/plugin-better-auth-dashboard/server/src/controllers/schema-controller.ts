import type { Core } from "@strapi/strapi";
import type { Context } from "koa";

const SYSTEM_FIELDS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "publishedAt",
  "createdBy",
  "updatedBy",
  "locale",
  "localizations",
]);

const ALLOWED_MODELS = new Set(["user", "organization"]);

const schemaController = ({ strapi }: { strapi: Core.Strapi }) => ({
  async getModelSchema(ctx: Context) {
    const { model } = ctx.params as { model: string };

    if (!ALLOWED_MODELS.has(model)) {
      ctx.status = 400;
      ctx.body = { error: "Invalid model" };
      return;
    }

    const uid = `plugin::better-auth.${model}`;
    const contentType =
      strapi.contentTypes[uid as keyof typeof strapi.contentTypes];

    if (!contentType) {
      ctx.status = 404;
      ctx.body = { error: "Model not found" };
      return;
    }

    const attributes: Record<string, unknown> = {};
    for (const [name, attr] of Object.entries(contentType.attributes)) {
      if (SYSTEM_FIELDS.has(name)) continue;
      // Skip relations that point to Strapi internal models
      const a = attr as Record<string, unknown>;
      if (
        a.type === "relation" &&
        typeof a.target === "string" &&
        (a.target.startsWith("plugin::users-permissions") ||
          a.target.startsWith("admin::"))
      ) {
        continue;
      }
      attributes[name] = attr;
    }

    ctx.body = { attributes };
  },
});

export default schemaController;
