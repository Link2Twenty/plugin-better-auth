import path from "node:path";
import type { Auth } from "better-auth";
import { POSSIBLE_CONFIG_LOCATIONS } from "../utils";

export default () => ({
  getAuth() {
    function loadAuth(): Auth | null {
      for (const directory of [strapi.dirs.app.root, strapi.dirs.dist.root]) {
        for (const candidate of POSSIBLE_CONFIG_LOCATIONS) {
          try {
            const m = require(path.join(directory, candidate));
            const resolved = m.auth ?? m.default;
            if (resolved) return resolved;
          } catch {}
        }
      }
      return null;
    }

    return loadAuth();
  },
});
