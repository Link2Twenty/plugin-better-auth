import path from "node:path";
import { registerDbTeardown } from "@strapi-community/dev-utils";

registerDbTeardown(path.resolve(__dirname, "../../../../../apps/playground"));
