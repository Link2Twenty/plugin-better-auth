import role from "./role";

export default () => ({
  type: "admin",
  routes: [
    {
      method: "GET",
      path: "/permissions/layout",
      handler: "permission.layout",
    },
    ...role.routes,
  ],
});
