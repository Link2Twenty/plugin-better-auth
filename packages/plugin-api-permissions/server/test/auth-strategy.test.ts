import { setupStrapi, stopStrapi } from "@strapi-community/test-utils";
import request from "supertest";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { getPluginService, PERMISSION_UID, ROLE_UID } from "../src/utils";

beforeAll(async () => {
  await setupStrapi();
});

afterAll(async () => {
  await stopStrapi();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getPublicRole() {
  const role = await strapi
    .documents(ROLE_UID)
    .findFirst({ filters: { type: "public" } });
  if (!role) throw new Error("Public role not found");
  return role;
}

async function grantPermission(roleDocumentId: string, action: string) {
  return strapi.documents(PERMISSION_UID).create({
    data: { action, role: { set: [roleDocumentId] } },
  });
}

async function revokeAllPermissions(roleDocumentId: string) {
  const permissions = await strapi.documents(PERMISSION_UID).findMany({
    filters: { role: { documentId: roleDocumentId } },
  });
  await Promise.all(
    permissions.map((p) =>
      strapi.documents(PERMISSION_UID).delete({ documentId: p.documentId }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("content-api auth strategy — public role", () => {
  let publicRoleDocumentId: string;

  beforeAll(async () => {
    const role = await getPublicRole();
    publicRoleDocumentId = role.documentId;
  });

  afterEach(async () => {
    await revokeAllPermissions(publicRoleDocumentId);
    // Reset session resolver to default (unauthenticated)
    getPluginService("session").registerSessionResolver(async () => null);
  });

  it("returns 401 when public role has no permissions", async () => {
    const res = await request(strapi.server.httpServer).get("/api/tests");
    expect(res.status).toBe(401);
  });

  it("returns 200 when public role has find permission", async () => {
    await grantPermission(publicRoleDocumentId, "api::test.test.find");

    const res = await request(strapi.server.httpServer).get("/api/tests");
    expect(res.status).toBe(200);
  });

  it("returns 403 when public role has create but not find", async () => {
    await grantPermission(publicRoleDocumentId, "api::test.test.create");

    const res = await request(strapi.server.httpServer).get("/api/tests");
    expect(res.status).toBe(403);
  });
});

describe("content-api auth strategy — authenticated user", () => {
  let publicRoleDocumentId: string;

  beforeAll(async () => {
    const role = await getPublicRole();
    publicRoleDocumentId = role.documentId;
  });

  beforeEach(async () => {
    await revokeAllPermissions(publicRoleDocumentId);
  });

  afterEach(async () => {
    getPluginService("session").registerSessionResolver(async () => null);
  });

  it("returns 200 when session resolver provides a role with find permission", async () => {
    const customRole = await strapi.documents(ROLE_UID).create({
      data: { name: "Auth Find Role", type: "auth-find-role" },
    });
    await grantPermission(customRole.documentId, "api::test.test.find");

    getPluginService("session").registerSessionResolver(async () => ({
      user: { documentId: "test-user", id: 0 } as never,
      roles: [customRole as never],
    }));

    const res = await request(strapi.server.httpServer).get("/api/tests");
    expect(res.status).toBe(200);

    await revokeAllPermissions(customRole.documentId);
    await strapi
      .documents(ROLE_UID)
      .delete({ documentId: customRole.documentId });
  });

  it("returns 403 when session resolver provides a role without find permission", async () => {
    const customRole = await strapi.documents(ROLE_UID).create({
      data: { name: "Auth No Find Role", type: "auth-no-find-role" },
    });
    // Grant create only — not find
    await grantPermission(customRole.documentId, "api::test.test.create");

    getPluginService("session").registerSessionResolver(async () => ({
      user: { documentId: "test-user", id: 0 } as never,
      roles: [customRole as never],
    }));

    const res = await request(strapi.server.httpServer).get("/api/tests");
    expect(res.status).toBe(403);

    await revokeAllPermissions(customRole.documentId);
    await strapi
      .documents(ROLE_UID)
      .delete({ documentId: customRole.documentId });
  });

  it("returns 401 when session resolver provides a role with no permissions at all", async () => {
    const customRole = await strapi.documents(ROLE_UID).create({
      data: { name: "Auth Empty Role", type: "auth-empty-role" },
    });

    getPluginService("session").registerSessionResolver(async () => ({
      user: { documentId: "test-user", id: 0 } as never,
      roles: [customRole as never],
    }));

    const res = await request(strapi.server.httpServer).get("/api/tests");
    expect(res.status).toBe(401);

    await strapi
      .documents(ROLE_UID)
      .delete({ documentId: customRole.documentId });
  });

  it("merges permissions from multiple roles", async () => {
    const roleA = await strapi.documents(ROLE_UID).create({
      data: { name: "Multi Role A", type: "multi-role-a" },
    });
    const roleB = await strapi.documents(ROLE_UID).create({
      data: { name: "Multi Role B", type: "multi-role-b" },
    });

    // roleA has find, roleB has findOne — find alone is enough for GET /api/tests
    await grantPermission(roleA.documentId, "api::test.test.find");
    await grantPermission(roleB.documentId, "api::test.test.findOne");

    getPluginService("session").registerSessionResolver(async () => ({
      user: { documentId: "test-user", id: 0 } as never,
      roles: [roleA as never, roleB as never],
    }));

    const res = await request(strapi.server.httpServer).get("/api/tests");
    expect(res.status).toBe(200);

    await revokeAllPermissions(roleA.documentId);
    await revokeAllPermissions(roleB.documentId);
    await strapi.documents(ROLE_UID).delete({ documentId: roleA.documentId });
    await strapi.documents(ROLE_UID).delete({ documentId: roleB.documentId });
  });

  it("falls back to public role permissions when session resolver returns null", async () => {
    // No session (resolver returns null) → uses public role → no permissions → 401
    getPluginService("session").registerSessionResolver(async () => null);

    const res = await request(strapi.server.httpServer).get("/api/tests");
    expect(res.status).toBe(401);
  });
});
