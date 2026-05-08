import path from "node:path";
import type { Auth } from "../../types/better-auth";
import { POSSIBLE_CONFIG_LOCATIONS } from "../utils";

export default () => ({
  getAuth() {
    function loadAuth(): Auth | null {
      for (const candidate of POSSIBLE_CONFIG_LOCATIONS) {
        try {
          const m = require(path.join(strapi.dirs.app.root, candidate));
          const resolved = m.auth ?? m.default;
          if (resolved) return resolved;
        } catch {}
      }
      return null;
    }

    return loadAuth();
  },
});
