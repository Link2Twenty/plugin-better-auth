export default () => ({
  type: "admin",
  routes: [
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
