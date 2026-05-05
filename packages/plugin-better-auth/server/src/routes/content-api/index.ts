import type { Core } from "@strapi/strapi";

const HTTP_METHODS: Core.Route["method"][] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];

const createContentApiRoutes = (routePath: string): Core.Router => ({
  type: "content-api",
  routes: HTTP_METHODS.map((method) => ({
    method,
    path: `${routePath}/:path*`,
    handler: "auth-controller.handleAuthRequest",
    info: { pluginName: "better-auth" },
    config: {
      policies: [],
      prefix: "",
      auth: false,
    },
  })),
});

export default createContentApiRoutes;
