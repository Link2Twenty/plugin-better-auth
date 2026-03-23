export default () => ({
  type: "admin",
  routes: [
    {
      method: "GET",
      path: "/permissions-layout",
      handler: "role-controller.getPermissionsLayout",
      config: {
        policies: [
          {
            name: "admin::hasPermissions",
            config: {
              actions: ["plugin::better-auth.roles.read"],
            },
          },
        ],
      },
    },
    {
      method: "GET",
      path: "/actions",
      handler: "role-controller.getActions",
      config: {
        policies: [
          {
            name: "admin::hasPermissions",
            config: {
              actions: ["plugin::better-auth.roles.read"],
            },
          },
        ],
      },
    },
    {
      method: "GET",
      path: "/roles/:id",
      handler: "role-controller.findOne",
      config: {
        policies: [
          {
            name: "admin::hasPermissions",
            config: {
              actions: ["plugin::better-auth.roles.read"],
            },
          },
        ],
      },
    },
    {
      method: "GET",
      path: "/roles",
      handler: "role-controller.find",
      config: {
        policies: [
          {
            name: "admin::hasPermissions",
            config: {
              actions: ["plugin::better-auth.roles.read"],
            },
          },
        ],
      },
    },
    {
      method: "POST",
      path: "/roles",
      handler: "role-controller.createRole",
      config: {
        policies: [
          {
            name: "admin::hasPermissions",
            config: {
              actions: ["plugin::better-auth.roles.create"],
            },
          },
        ],
      },
    },
    {
      method: "PUT",
      path: "/roles/:role",
      handler: "role-controller.updateRole",
      config: {
        policies: [
          {
            name: "admin::hasPermissions",
            config: {
              actions: ["plugin::better-auth.roles.update"],
            },
          },
        ],
      },
    },
    {
      method: "DELETE",
      path: "/roles/:role",
      handler: "role-controller.deleteRole",
      config: {
        policies: [
          {
            name: "admin::hasPermissions",
            config: {
              actions: ["plugin::better-auth.roles.delete"],
            },
          },
        ],
      },
    },
    {
      method: "POST",
      path: "/users/:id/send-invite",
      handler: "invite-controller.sendInvite",
      config: {
        policies: [
          {
            name: "admin::hasPermissions",
            config: {
              actions: ["plugin::better-auth.users.invite"],
            },
          },
        ],
      },
    },
    {
      method: "GET",
      path: "/users/:id/has-credential-account",
      handler: "invite-controller.hasCredentialAccount",
      config: {
        policies: [
          {
            name: "admin::hasPermissions",
            config: {
              actions: ["plugin::better-auth.users.invite"],
            },
          },
        ],
      },
    },
  ],
});
