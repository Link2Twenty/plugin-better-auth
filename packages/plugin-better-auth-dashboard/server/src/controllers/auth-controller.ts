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
    const jwt = await getPluginService("crypto").mintInternalJwt(
      keyPair,
      DASHBOARD_API_KEY,
    );

    const url = new URL(
      ctx.request.url,
      `${ctx.request.protocol}://${ctx.request.host}`,
    );
    url.pathname = `/api/auth/${ctx.params.path ?? ""}`;

    const forwardHeaders = new Headers();
    for (const [key, value] of Object.entries(ctx.request.headers)) {
      if (value)
        forwardHeaders.set(
          key,
          Array.isArray(value) ? value[0] : String(value),
        );
    }
    forwardHeaders.set("Authorization", `Bearer ${jwt}`);

    const hasBody =
      ctx.request.method !== "GET" && ctx.request.method !== "HEAD";
    const request = new Request(url.toString(), {
      method: ctx.request.method,
      headers: forwardHeaders,
      body: hasBody ? JSON.stringify(ctx.request.body) : undefined,
    });

    const response = await auth.handler(request);

    ctx.status = response.status;
    response.headers.forEach((value: string, key: string) => {
      ctx.set(key, value);
    });

    const contentType = response.headers.get("content-type") ?? "";
    ctx.body = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  },

  async getJwks(ctx: Context) {
    const keyPair = await getPluginService("crypto").getKeyPair();
    ctx.send({ keys: [keyPair.publicJwk] });
  },
});

export default proxyController;
