export default () => ({
  type: "admin",
  routes: [
    {
      method: "GET",
      path: "/better-auth-dashboard/schema/:model",
      handler: "schema-controller.getModelSchema",
      config: {
        policies: [],
        prefix: "",
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/better-auth/:path*",
      handler: "auth-controller.handleAuthRequest",
      config: {
        policies: [],
        prefix: "",
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/better-auth/:path*",
      handler: "auth-controller.handleAuthRequest",
      config: {
        policies: [],
        auth: false,
        prefix: "",
      },
    },
    {
      method: "PUT",
      path: "/better-auth/:path*",
      handler: "auth-controller.handleAuthRequest",
      config: {
        policies: [],
        auth: false,
        prefix: "",
      },
    },
    {
      method: "PATCH",
      path: "/better-auth/:path*",
      handler: "auth-controller.handleAuthRequest",
      config: {
        policies: [],
        auth: false,
        prefix: "",
      },
    },
    {
      method: "DELETE",
      path: "/better-auth/:path*",
      handler: "auth-controller.handleAuthRequest",
      config: {
        policies: [],
        auth: false,
        prefix: "",
      },
    },
  ],
});
