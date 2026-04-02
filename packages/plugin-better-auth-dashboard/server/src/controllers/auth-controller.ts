import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import type { Context } from "koa";
import { getPluginService } from "../utils";

export const DASHBOARD_API_KEY =
  process.env.BETTER_AUTH_DASHBOARD_SECRET || "strapi-internal-dashboard-key";

const proxyController = ({ strapi }: { strapi: Core.Strapi }) => ({
  async handleAuthRequest(ctx: Context) {
    const auth = strapi.internal_config["better-auth"];

    if (!auth) throw new errors.ApplicationError("Better Auth not initialized");

    const keyPair = await getPluginService("crypto").getKeyPair();

    // Extract operation-specific payload fields from the request body and query
    // so they can be included in the JWT for dash() middleware validation.
    // The dash() plugin endpoints use jwtMiddleware to read userId, sessionId,
    // organizationId etc. from the JWT payload rather than from the request body.
    const hasBody =
      ctx.request.method !== "GET" && ctx.request.method !== "HEAD";
    const bodyData = hasBody
      ? ((ctx.request.body as Record<string, unknown>) ?? {})
      : {};
    const queryData = (ctx.request.query as Record<string, unknown>) ?? {};

    const PAYLOAD_KEYS = [
      "userId",
      "sessionId",
      "organizationId",
      "invitationId",
      "invitedBy",
      "memberId",
      "skipDefaultTeam",
    ] as const;

    const extra: Record<string, unknown> = {};
    for (const key of PAYLOAD_KEYS) {
      const value = bodyData[key] ?? queryData[key];
      if (value !== undefined) extra[key] = value;
    }

    // Mint a JWT for the dashboard API key with the extracted payload fields.
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

    // Create the Request object
    const request = new Request(url.toString(), {
      method: ctx.request.method,
      headers: headers,
      body: hasBody ? JSON.stringify(ctx.request.body) : undefined,
    });

    // Call Better Auth handler
    const response = await auth.handler(request);

    console.log(response);

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
