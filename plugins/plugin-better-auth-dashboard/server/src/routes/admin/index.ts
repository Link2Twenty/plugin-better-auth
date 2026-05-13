export default () => ({
  type: "admin",
  routes: [
    {
      method: "GET",
      path: "/auth/:path*",
      handler: "auth-controller.handleAuthRequest",
      config: {
        policies: [],
        prefix: "",
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/auth/:path*",
      handler: "auth-controller.handleAuthRequest",
      config: {
        policies: [],
        auth: false,
        prefix: "",
      },
    },
    {
      method: "PUT",
      path: "/auth/:path*",
      handler: "auth-controller.handleAuthRequest",
      config: {
        policies: [],
        auth: false,
        prefix: "",
      },
    },
    {
      method: "PATCH",
      path: "/auth/:path*",
      handler: "auth-controller.handleAuthRequest",
      config: {
        policies: [],
        auth: false,
        prefix: "",
      },
    },
    {
      method: "DELETE",
      path: "/auth/:path*",
      handler: "auth-controller.handleAuthRequest",
      config: {
        policies: [],
        auth: false,
        prefix: "",
      },
    },
    {
      method: "GET",
      path: "/better-auth-dashboard/db",
      handler: "db-controller.list",
      config: {
        policies: [],
        prefix: "",
      },
    },
    {
      method: "PUT",
      path: "/better-auth-dashboard/db/:documentId",
      handler: "db-controller.update",
      config: {
        policies: [],
        prefix: "",
      },
    },
  ],
});
