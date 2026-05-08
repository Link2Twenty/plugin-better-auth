import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type {} from "../src/types/strapi";
import { setupStrapi, stopStrapi } from "./utils";

const BASE = "/api/auth";

let savedAuth: unknown;

beforeAll(async () => {
  await setupStrapi();
  savedAuth = strapi.internal_config["better-auth"];
}, 120_000);

afterAll(async () => {
  await stopStrapi();
});

afterEach(() => {
  strapi.internal_config["better-auth"] = savedAuth as never;
});

function mockHandler(handler: (req: Request) => Response | Promise<Response>) {
  strapi.internal_config["better-auth"] = {
    handler,
    options: { basePath: "/api/auth" },
  } as never;
}

// ---------------------------------------------------------------------------
// Redirects
// ---------------------------------------------------------------------------

describe("auth-controller — redirects", () => {
  it("forwards the Location header and a redirect status", async () => {
    mockHandler(
      () =>
        new Response(null, {
          status: 302,
          headers: { Location: "https://example.com/callback" },
        }),
    );

    const res = await request(strapi.server.httpServer)
      .get(`${BASE}/callback`)
      .redirects(0);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Set-Cookie
// ---------------------------------------------------------------------------

describe("auth-controller — Set-Cookie", () => {
  it("delivers multiple cookies as an array, not joined with commas", async () => {
    mockHandler(() => {
      const headers = new Headers({ "Content-Type": "application/json" });
      headers.append("Set-Cookie", "session=abc; Path=/; HttpOnly");
      // The date in Expires contains a comma — this would break cookies if they
      // were naively joined with ", " before being set on the response.
      headers.append(
        "Set-Cookie",
        "token=xyz; Path=/; Expires=Thu, 01 Jan 2026 00:00:00 GMT; HttpOnly",
      );
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers,
      });
    });

    const res = await request(strapi.server.httpServer).get(`${BASE}/session`);

    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(Array.isArray(cookies)).toBe(true);
    expect(cookies).toHaveLength(2);
    expect(cookies[0]).toMatch(/^session=/);
    expect(cookies[1]).toMatch(/^token=/);
    // Verify the Expires date was not split into a separate (broken) cookie entry.
    expect(cookies[1]).toContain("Expires=Thu, 01 Jan 2026");
  });
});

// ---------------------------------------------------------------------------
// Response body
// ---------------------------------------------------------------------------

describe("auth-controller — response body", () => {
  it("parses and returns a JSON body for application/json responses", async () => {
    const payload = { token: "abc123", user: { id: 1 } };
    mockHandler(
      () =>
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );

    const res = await request(strapi.server.httpServer).get(`${BASE}/session`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(payload);
  });

  it("returns a text body for text/plain responses", async () => {
    mockHandler(
      () =>
        new Response("OK", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        }),
    );

    const res = await request(strapi.server.httpServer).get(`${BASE}/session`);

    expect(res.status).toBe(200);
    expect(res.text).toBe("OK");
  });
});

// ---------------------------------------------------------------------------
// Status and header forwarding
// ---------------------------------------------------------------------------

describe("auth-controller — status and header forwarding", () => {
  it("forwards the HTTP status code from Better Auth", async () => {
    mockHandler(
      () =>
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
    );

    const res = await request(strapi.server.httpServer).get(`${BASE}/session`);
    expect(res.status).toBe(401);
  });

  it("forwards custom response headers", async () => {
    mockHandler(
      () =>
        new Response(JSON.stringify({}), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Auth-Version": "1.0",
          },
        }),
    );

    const res = await request(strapi.server.httpServer).get(`${BASE}/session`);
    expect(res.headers["x-auth-version"]).toBe("1.0");
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe("auth-controller — error handling", () => {
  it("returns an error response when Better Auth is not initialized", async () => {
    // @ts-expect-error — intentionally removing the auth instance
    strapi.internal_config["better-auth"] = null;

    const res = await request(strapi.server.httpServer).get(`${BASE}/session`);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
