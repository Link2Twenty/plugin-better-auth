export default {
  routes: [
    {
      method: "GET",
      path: "/roles",
      handler: "role.find",
      config: { policies: [] },
    },
    {
      method: "POST",
      path: "/roles",
      handler: "role.create",
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/roles/:id",
      handler: "role.findOne",
      config: { policies: [] },
    },
    {
      method: "PUT",
      path: "/roles/:id",
      handler: "role.update",
      config: { policies: [] },
    },
    {
      method: "DELETE",
      path: "/roles/:id",
      handler: "role.delete",
      config: { policies: [] },
    },
  ],
};
