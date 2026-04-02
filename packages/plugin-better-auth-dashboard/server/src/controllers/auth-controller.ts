import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import type { Context } from "koa";
import { getPluginService } from "../utils";

export const DASHBOARD_API_KEY =
  process.env.BETTER_AUTH_DASHBOARD_SECRET || "strapi-internal-dashboard-key";

/**
 * Header name used to pass dash() JWT context fields separately from the HTTP payload.
 *
 * The admin client encodes the context as base64(JSON) in this header.
 * The auth-controller reads it here and injects the fields into the signed JWT
 * so the dash() jwtMiddleware can validate them — without ever mixing them
 * with the actual request body.
 */
export const DASH_CONTEXT_HEADER = "x-dash-context";

const proxyController = ({ strapi }: { strapi: Core.Strapi }) => ({
  async handleAuthRequest(ctx: Context) {
    const auth = strapi.internal_config["better-auth"];

    if (!auth) throw new errors.ApplicationError("Better Auth not initialized");

    const keyPair = await getPluginService("crypto").getKeyPair();

    // Read JWT context from the dedicated X-Dash-Context header.
    // The admin client base64-encodes the context JSON and sets this header,
    // keeping context fields cleanly separated from the HTTP payload.
    const contextHeader = ctx.request.headers[DASH_CONTEXT_HEADER];
    let extra: Record<string, unknown> = {};
    if (typeof contextHeader === "string" && contextHeader.length > 0) {
      try {
        const decoded = Buffer.from(contextHeader, "base64").toString("utf8");
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          extra = parsed as Record<string, unknown>;
        }
      } catch {
        // Malformed context header — proceed without extra context
      }
    }

    // Mint a JWT for the dashboard API key with the context fields.
    const jwt = await getPluginService("crypto").mintInternalJwt(
      keyPair,
      DASHBOARD_API_KEY,
      extra,
    );

    // Create a Request object compatible with Better Auth
    const url = new URL(
      ctx.request.url,
      `${ctx.request.protocol}://${ctx.request.host}`,
    );

    // Update the URL path to the Better Auth format
    const betterAuthPath = ctx.params.path || "";
    url.pathname = `/api/auth/${betterAuthPath}`;

    // Prepare headers
    const headers = new Headers();
    Object.entries(ctx.request.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value[0] : String(value));
      }
    });

    // Set the Authorization header with the minted JWT
    headers.set("Authorization", `Bearer ${jwt}`);

    const hasBody =
      ctx.request.method !== "GET" && ctx.request.method !== "HEAD";

    // Create the Request object
    const request = new Request(url.toString(), {
      method: ctx.request.method,
      headers: headers,
      body: hasBody ? JSON.stringify(ctx.request.body) : undefined,
    });

    // Call Better Auth handler
    const response = await auth.handler(request);

    // Set response status
    ctx.status = response.status;

    // Copy response headers
    response.headers.forEach((value: string, key: string) => {
      ctx.set(key, value);
    });

    // Get response body
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      ctx.body = await response.json();
    } else if (contentType?.includes("text/")) {
      ctx.body = await response.text();
    } else {
      ctx.body = await response.text();
    }
  },

  async getJwks(ctx: Context) {
    const keyPair = await getPluginService("crypto").getKeyPair();
    ctx.send({ keys: [keyPair.publicJwk] });
  },
});

export default proxyController;
