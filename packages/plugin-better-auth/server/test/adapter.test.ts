import { expect } from "vitest";
import { testAdapter, createTestSuite } from "@better-auth/test-utils/adapter";
import { setupStrapi, stopStrapi } from "./utils";
import { strapiAdapter } from "../src/adapter";

await setupStrapi();

const normalTestSuite = createTestSuite("Normal", {}, ({ adapter }) => ({
  "should create and find a user": async () => {
    const createdUser = await adapter.create({
      model: "user",
      data: {
        email: "user@example.com",
        name: "Test User",
        emailVerified: true,
      },
    });

    const foundUser = await adapter.findOne({
      model: "user",
      where: [
        {
          field: "email",
          operator: "eq",
          value: "user@example.com",
        },
      ],
    });

    expect(createdUser).toMatchObject({
      email: "user@example.com",
    });
    expect(createdUser.id).toBeDefined();
    expect(foundUser).not.toBeNull();
    expect(foundUser).toMatchObject({
      id: createdUser.id,
      email: "user@example.com",
      name: "Test User",
    });
  },
}));

const { execute } = await testAdapter({
  adapter: (_options) => {
    return strapiAdapter() as never;
  },
  overrideBetterAuthOptions: (options) => ({
    ...options,
    advanced: {
      ...options.advanced,
      database: {
        ...options.advanced?.database,
        generateId: "serial",
      },
    },
  }),
  runMigrations: async () => {
  },
  tests: [
    normalTestSuite(),
  ],
  async onFinish() {
    await stopStrapi();
  },
});

execute();