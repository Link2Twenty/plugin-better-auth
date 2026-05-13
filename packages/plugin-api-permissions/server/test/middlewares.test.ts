import { setupStrapi, stopStrapi } from "@strapi-community/test-utils";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getUserUID, ROLE_UID } from "../src/utils";

beforeAll(async () => {
  await setupStrapi();
});

afterAll(async () => {
  await stopStrapi();
});

async function createRole(name: string) {
  return strapi.documents(ROLE_UID).create({
    data: { name, type: name.toLowerCase().replace(/\s+/g, "-") },
  });
}

async function createUser(email: string, roleDocumentId: string) {
  const userUID = getUserUID();
  return strapi.documents(userUID).create({
    data: {
      name: "Test User",
      email,
      emailVerified: false,
      roles: { set: [roleDocumentId] },
    },
  });
}

// Reads the virtual nb_users field the middleware sets on role objects
function getNbUsers(role: object): number {
  return Reflect.get(role, "nb_users") as number;
}

describe("include-user-count middleware", () => {
  it("adds nb_users=0 to each role returned by findMany", async () => {
    const roles = await strapi.documents(ROLE_UID).findMany({});

    expect(roles.length).toBeGreaterThan(0);
    for (const role of roles) {
      expect(typeof getNbUsers(role)).toBe("number");
      expect(getNbUsers(role)).toBe(0);
    }
  });

  it("adds nb_users=0 to a role returned by findFirst", async () => {
    const role = await strapi
      .documents(ROLE_UID)
      .findFirst({ filters: { type: "public" } });

    expect(role).not.toBeNull();
    expect(typeof getNbUsers(role!)).toBe("number");
    expect(getNbUsers(role!)).toBe(0);
  });

  it("adds nb_users=0 to a role returned by findOne", async () => {
    const created = await createRole("FindOne Count Role");

    const role = await strapi
      .documents(ROLE_UID)
      .findOne({ documentId: created.documentId });

    expect(role).not.toBeNull();
    expect(typeof getNbUsers(role!)).toBe("number");
    expect(getNbUsers(role!)).toBe(0);

    await strapi.documents(ROLE_UID).delete({ documentId: created.documentId });
  });

  it("reflects assigned users in nb_users", async () => {
    const role = await createRole("Counted Users Role");

    await createUser("counted-1@example.com", role.documentId);
    await createUser("counted-2@example.com", role.documentId);

    const found = await strapi
      .documents(ROLE_UID)
      .findFirst({ filters: { documentId: role.documentId } });

    expect(getNbUsers(found!)).toBe(2);

    // Cleanup
    const userUID = getUserUID();
    const users = await strapi.documents(userUID).findMany({
      filters: { roles: { documentId: role.documentId } },
    });
    for (const user of users) {
      await strapi.documents(userUID).delete({ documentId: user.documentId });
    }
    await strapi.documents(ROLE_UID).delete({ documentId: role.documentId });
  });

  it("returns null from findFirst when no role matches", async () => {
    const role = await strapi
      .documents(ROLE_UID)
      .findFirst({ filters: { name: "__nonexistent_role__" } });

    expect(role).toBeNull();
  });

  it("does not add nb_users on create", async () => {
    const role = await createRole("No Count On Create");

    expect(Reflect.has(role, "nb_users")).toBe(false);

    await strapi.documents(ROLE_UID).delete({ documentId: role.documentId });
  });
});

describe("reassign-orphaned-users middleware", () => {
  it("throws when trying to delete the public role", async () => {
    const publicRole = await strapi
      .documents(ROLE_UID)
      .findFirst({ filters: { type: "public" } });

    expect(publicRole).not.toBeNull();

    await expect(
      strapi.documents(ROLE_UID).delete({ documentId: publicRole!.documentId }),
    ).rejects.toThrow("Cannot delete public role");
  });

  it("successfully deletes a non-public role", async () => {
    const role = await createRole("Deletable Role");

    await expect(
      strapi.documents(ROLE_UID).delete({ documentId: role.documentId }),
    ).resolves.toBeDefined();

    const afterDelete = await strapi
      .documents(ROLE_UID)
      .findFirst({ filters: { documentId: role.documentId } });
    expect(afterDelete).toBeNull();
  });

  it("reassigns users from the deleted role to the public role", async () => {
    const publicRole = await strapi
      .documents(ROLE_UID)
      .findFirst({ filters: { type: "public" } });
    const roleToDelete = await createRole("Reassign Source Role");

    const user = await createUser(
      "reassign-test@example.com",
      roleToDelete.documentId,
    );

    const userUID = getUserUID();

    // Verify user is on the role to be deleted
    const userBefore = await strapi.documents(userUID).findOne({
      documentId: user.documentId,
      populate: ["roles"],
    });
    const roleIdsBefore = (
      Reflect.get(userBefore!, "roles") as Array<{ documentId: string }>
    ).map((r) => r.documentId);
    expect(roleIdsBefore).toContain(roleToDelete.documentId);

    // Delete the role — middleware should reassign users to public
    await strapi
      .documents(ROLE_UID)
      .delete({ documentId: roleToDelete.documentId });

    // Verify user was moved to the public role
    const userAfter = await strapi.documents(userUID).findOne({
      documentId: user.documentId,
      populate: ["roles"],
    });
    const roleIdsAfter = (
      Reflect.get(userAfter!, "roles") as Array<{ documentId: string }>
    ).map((r) => r.documentId);
    expect(roleIdsAfter).toContain(publicRole!.documentId);
    expect(roleIdsAfter).not.toContain(roleToDelete.documentId);

    // Cleanup
    await strapi.documents(userUID).delete({ documentId: user.documentId });
  });

  it("deletes a role with no assigned users without error", async () => {
    const role = await createRole("Empty Role Delete");

    await expect(
      strapi.documents(ROLE_UID).delete({ documentId: role.documentId }),
    ).resolves.toBeDefined();
  });
});
