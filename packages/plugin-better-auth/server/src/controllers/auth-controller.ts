import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import type { KoaContext } from "../types/koa";

/**
 * Controller for Better Auth API endpoints
 * This controller acts as a proxy between Strapi and Better Auth
 */
const authController = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Handle all Better Auth API requests
   * This method processes the request and forwards it to Better Auth
   */
  async handleAuthRequest(ctx: KoaContext) {
    // Get the stored Better Auth instance
    const auth = strapi.internal_config["better-auth"];

    if (!auth) {
      throw new errors.ApplicationError("Better Auth not initialized");
    }

    // Create a Request object compatible with Better Auth
    const url = new URL(
      ctx.request.url,
      `${ctx.request.protocol}://${ctx.request.host}`,
    );

    // Update the URL path to the Better Auth format
    const betterAuthPath = ctx.params.path || "";
    url.pathname = `${auth.options.basePath || "/api/auth"}/${betterAuthPath}`;

    // Prepare headers
    const headers = new Headers();
    Object.entries(ctx.request.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value[0] : String(value));
      }
    });

    // Create the Request object
    const request = new Request(url.toString(), {
      method: ctx.request.method,
      headers,
      body:
        ctx.request.method !== "GET" && ctx.request.method !== "HEAD"
          ? JSON.stringify(ctx.request.body)
          : undefined,
    });

    // Call Better Auth handler
    const response = await auth.handler(request);

    // Set response status
    ctx.status = response.status;

    // Copy response headers, skipping Set-Cookie which needs special handling
    response.headers.forEach((value: string, key: string) => {
      if (key.toLowerCase() !== "set-cookie") {
        ctx.set(key, value);
      }
    });

    // Set-Cookie headers must be set as an array to prevent them from being
    // joined with ', ' (which breaks cookie parsing due to date fields).
    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length > 0) {
      ctx.res.setHeader("set-cookie", setCookies);
    }

    // Get response body
    const contentType = response.headers.get("content-type");

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        ctx.redirect(location);
        return;
      }
    }

    if (contentType?.includes("application/json")) {
      ctx.body = await response.json();
    } else if (contentType?.includes("text/")) {
      ctx.body = await response.text();
    } else {
      ctx.body = await response.text();
    }
  },
});

export default authController;
