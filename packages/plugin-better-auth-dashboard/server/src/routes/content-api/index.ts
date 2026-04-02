export default () => ({
  type: "content-api",
  routes: [
    {
      method: "GET",
      path: "/auth/jwks",
      handler: "auth-controller.getJwks",
      config: { policies: [], prefix: "", auth: false },
    },
  ],
});
