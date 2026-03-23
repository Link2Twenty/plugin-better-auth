import SendInviteAction from "./components/SendInviteAction";

const pluginId = "better-auth";

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
    getPlugin: (pluginId: string) => { apis?: { addDocumentAction: (action: unknown) => void } };
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
          id: "roles",
          intlLabel: {
            id: "global.roles",
            defaultMessage: "Roles",
          },
          to: `${pluginId}/roles`,
          Component: () => import("./pages/Roles").then((mod) => ({ default: mod.default })),
          permissions: [
            { action: "plugin::better-auth.roles.read", subject: null },
            { action: "plugin::better-auth.roles.create", subject: null },
          ],
        },
      ]
    );

    app.registerPlugin({
      id: pluginId,
      name: "Better Auth",
    });
  },
  bootstrap(app: { getPlugin: (pluginId: string) => { apis?: { addDocumentAction: (action: (actions: unknown[]) => unknown[]) => void } } }) {
    const contentManager = app.getPlugin("content-manager");
    if (contentManager?.apis?.addDocumentAction) {
      contentManager.apis.addDocumentAction((actions: unknown[]) => [
        ...actions,
        SendInviteAction,
      ]);
    }
  },
};
