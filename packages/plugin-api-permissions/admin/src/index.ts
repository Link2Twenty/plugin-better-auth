const pluginId = "api-permissions";

export default {
  register(app: {
    createSettingSection: (
      section: { id: string; intlLabel: { id: string; defaultMessage: string } },
      links: Array<{
        id: string;
        intlLabel: { id: string; defaultMessage: string };
        to: string;
        Component: () => Promise<{ default: React.ComponentType }>;
        permissions?: Array<{ action: string; subject: null }>;
      }>
    ) => void;
    registerPlugin: (config: { id: string; name: string }) => void;
  }) {
    app.createSettingSection(
      {
        id: pluginId,
        intlLabel: {
          id: `${pluginId}.Settings.section-label`,
          defaultMessage: "API Permissions",
        },
      },
      [
        {
          id: "roles",
          intlLabel: {
            id: "global.roles",
            defaultMessage: "Roles",
          },
          to: `${pluginId}/roles`,
          Component: () => import("./pages/Roles").then((mod) => ({ default: mod.default })),
          permissions: [
            { action: "plugin::api-permissions.roles.read", subject: null },
            { action: "plugin::api-permissions.roles.create", subject: null },
          ],
        },
      ]
    );

    app.registerPlugin({
      id: pluginId,
      name: "API Permissions",
    });
  },
};
