import contentTypes from "./content-types";
import controllers from "./controllers";
import routes from "./routes";
import services from "./services";
import createContentApiStrategy from "./strategies/content-api";

export default {
  controllers,
  routes,
  contentTypes,
  services,
  register({ strapi }) {
    strapi.get("auth").register("content-api", createContentApiStrategy(strapi));
  },
  async bootstrap({ strapi }) {
    const bootstrapFn = (await import("./bootstrap")).default;
    await bootstrapFn({ strapi });
  },
};
