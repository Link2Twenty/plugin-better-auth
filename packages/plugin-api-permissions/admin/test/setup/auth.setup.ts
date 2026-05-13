import path from "node:path";
import { registerAuthSetup } from "@strapi-community/test-utils";

registerAuthSetup(path.join(__dirname, "../.auth/user.json"));
