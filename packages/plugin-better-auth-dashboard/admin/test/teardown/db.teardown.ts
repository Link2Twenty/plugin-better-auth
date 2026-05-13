import path from "node:path";
import { registerDbTeardown } from "@strapi-community/test-utils";

registerDbTeardown(path.resolve(__dirname, "../../../../../apps/playground"));
