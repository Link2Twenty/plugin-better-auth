const pluginId = "better-auth-dashboard";

export default {
  register(app: {
    createSettingSection: (
      section: {
        id: string;
        intlLabel: { id: string; defaultMessage: string };
      },
      links: Array<{
        id: string;
        intlLabel: { id: string; defaultMessage: string };
        to: string;
        Component: () => Promise<{ default: React.ComponentType }>;
        permissions?: Array<{ action: string; subject: null }>;
      }>,
    ) => void;
    registerPlugin: (config: { id: string; name: string }) => void;
  }) {
    app.createSettingSection(
      {
        id: pluginId,
        intlLabel: {
          id: `${pluginId}.Settings.section-label`,
          defaultMessage: "Better Auth",
        },
      },
      [
        {
          id: "overview",
          intlLabel: {
            id: `${pluginId}.Settings.overview`,
            defaultMessage: "Overview",
          },
          to: `${pluginId}`,
          Component: () =>
            import("./pages/Overview").then((mod) => ({ default: mod.default })),
        },
        {
          id: "users",
          intlLabel: {
            id: `${pluginId}.Settings.users`,
            defaultMessage: "Users",
          },
          to: `${pluginId}/users`,
          Component: () =>
            import("./pages/Users").then((mod) => ({ default: mod.default })),
        },
        {
          id: "organizations",
          intlLabel: {
            id: `${pluginId}.Settings.organizations`,
            defaultMessage: "Organizations",
          },
          to: `${pluginId}/organizations`,
          Component: () =>
            import("./pages/Organizations").then((mod) => ({ default: mod.default })),
        },
        {
          id: "sessions",
          intlLabel: {
            id: `${pluginId}.Settings.sessions`,
            defaultMessage: "Sessions",
          },
          to: `${pluginId}/sessions`,
          Component: () =>
            import("./pages/Sessions").then((mod) => ({ default: mod.default })),
        },
      ],
    );

    app.registerPlugin({
      id: pluginId,
      name: "Better Auth Dashboard",
    });
  },
};
