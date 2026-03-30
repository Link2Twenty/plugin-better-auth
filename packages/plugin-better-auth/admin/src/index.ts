import SendInviteAction from "./components/SendInviteAction";

const pluginId = "better-auth";

export default {
  register(app: {
    registerPlugin: (config: { id: string; name: string }) => void;
  }) {
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
