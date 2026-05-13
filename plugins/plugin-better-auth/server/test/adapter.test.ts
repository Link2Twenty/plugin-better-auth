import path from "node:path";
import {
  authFlowTestSuite,
  numberIdTestSuite,
  testAdapter,
} from "@better-auth/test-utils/adapter";
import {
  cleanupDir,
  playgroundDir,
  setupStrapi,
  stopStrapi,
} from "@strapi-community/dev-utils";
import { getAuthTables } from "better-auth/db";
import { strapiAdapter } from "../src/adapter";
import { updateStrapiSchema } from "../src/adapter/transformers";

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
  runMigrations: async (opts) => {
    const authTables = getAuthTables(opts);
    // Remove stale compiled extension artifacts so Strapi loads fresh schema JSON.
    await cleanupDir(path.join(playgroundDir, "dist"));

    // Start up Strapi and run the schema updates.
    await setupStrapi();

    // Update Strapi schemas based on Better Auth configuration.
    await updateStrapiSchema(strapi, authTables);

    // Restart Strapi in order to load the new schemas before running tests.
    await stopStrapi();
    await setupStrapi();
  },
  /**
   * @todo Implement normalTestSuite(), uuidTestSuite(), transactionsTestSuite() and joinsTestSuite()
   */
  tests: [authFlowTestSuite(), numberIdTestSuite()],
  async onFinish() {
    // Stop Strapi.
    await stopStrapi();
  },
});

execute();
