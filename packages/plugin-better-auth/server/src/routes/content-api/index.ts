export default () => ({
  type: "content-api",
  routes: [
    {
      method: "POST",
      path: "/better-auth/invite/set-password",
      handler: "invite-controller.setPasswordFromInvite",
      config: {
        auth: false,
        policies: [],
        prefix: "",
      },
    },
    {
      method: "GET",
      path: "/better-auth/:path*",
      handler: "auth-controller.handleAuthRequest",
      config: {
        policies: [],
        prefix: "",
        auth: false, // Allow unauthenticated access for auth endpoints
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
