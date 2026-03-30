import type { Core } from "@strapi/strapi";
import type { ParameterizedContext } from "koa";

export type SessionResolverResult = {
  userId?: string | number;
  roleId?: string | number;
} | null;

export type SessionResolver = (ctx: ParameterizedContext) => Promise<SessionResolverResult>;

// Actions that don't apply to single types (no concept of creating or fetching one-by-id)
const SINGLE_TYPE_EXCLUDED_ACTIONS = new Set(["create", "findOne"]);

const actionLabels: Record<string, string> = {
  create: "Create",
  find: "Find",
  findOne: "Find One",
  update: "Update",
  delete: "Delete",
};

const isSingleType = (ct: { kind?: string }) => ct?.kind === "singleType";

type ContentPermission = {
  actions: Array<{ actionId: string; label: string; subjects: string[] }>;
  subjects: Array<{ uid: string; label: string }>;
};
type PluginPermission = { action: string; displayName: string; plugin: string; subCategory: string };

function buildPermissionsLayout(strapi: Core.Strapi): {
  collectionTypes: ContentPermission;
  singleTypes: ContentPermission;
  plugins: PluginPermission[];
  settings: PluginPermission[];
} {
  const collectionSubjects: Array<{ uid: string; label: string }> = [];
  const singleSubjects: Array<{ uid: string; label: string }> = [];
  const collectionActions = new Map<string, { actionId: string; label: string; subjects: string[] }>();
  const singleActions = new Map<string, { actionId: string; label: string; subjects: string[] }>();
  const plugins: PluginPermission[] = [];

  try {
    const actionsMap = strapi.contentAPI.permissions.getActionsMap();

    for (const [uid, contentType] of Object.entries(strapi.contentTypes ?? {})) {
      const ct = contentType as { uid?: string; info?: { displayName?: string }; kind?: string };
      if (!uid.startsWith("api::")) continue;

      const label = ct.info?.displayName ?? uid.split(".").pop() ?? uid;
      const isSingle = isSingleType(ct);
      const parts = uid.split(".");
      const apiKey = `api::${parts[0]?.replace("api::", "") ?? ""}`;
      const controllerName = parts[1] ?? parts[0] ?? "";

      const apiEntry = actionsMap[apiKey];
      const controllerActions = apiEntry?.controllers?.[controllerName] ?? [];

      const allowedActions = isSingle
        ? (controllerActions as string[]).filter((a) => !SINGLE_TYPE_EXCLUDED_ACTIONS.has(a))
        : (controllerActions as string[]);

      if (allowedActions.length === 0) continue;

      if (isSingle) {
        singleSubjects.push({ uid, label });
        for (const actionId of allowedActions) {
          if (!singleActions.has(actionId)) {
            singleActions.set(actionId, {
              actionId,
              label: actionLabels[actionId] ?? actionId,
              subjects: [],
            });
          }
          singleActions.get(actionId)!.subjects.push(uid);
        }
      } else {
        collectionSubjects.push({ uid, label });
        for (const actionId of allowedActions) {
          if (!collectionActions.has(actionId)) {
            collectionActions.set(actionId, {
              actionId,
              label: actionLabels[actionId] ?? actionId,
              subjects: [],
            });
          }
          collectionActions.get(actionId)!.subjects.push(uid);
        }
      }
    }

    for (const [pluginKey, value] of Object.entries(actionsMap)) {
      if (!pluginKey.startsWith("plugin::") || pluginKey.includes("api-permissions")) continue;
      const pluginName = pluginKey.replace("plugin::", "");
      const { controllers } = value ?? {};
      for (const [subCategory, actions] of Object.entries(controllers ?? {})) {
        for (const actionName of actions ?? []) {
          plugins.push({
            action: `${pluginKey}.${subCategory}.${actionName}`,
            displayName: `${subCategory} - ${actionName}`,
            plugin: pluginName,
            subCategory,
          });
        }
      }
    }
  } catch {
    // Fallback
  }

  return {
    collectionTypes: {
      actions: Array.from(collectionActions.values()),
      subjects: collectionSubjects,
    },
    singleTypes: {
      actions: Array.from(singleActions.values()),
      subjects: singleSubjects,
    },
    plugins,
    settings: [],
  };
}

export default ({ strapi }: { strapi: Core.Strapi }) => {
  let sessionResolver: SessionResolver = async () => null;

  return {
    registerSessionResolver(fn: SessionResolver) {
      sessionResolver = fn;
    },

    getSessionResolver(): SessionResolver {
      return sessionResolver;
    },

    getPermissionsLayout() {
      return buildPermissionsLayout(strapi);
    },

    getActions(): Record<string, { controllers: Record<string, Record<string, { enabled: boolean; policy: string }>> }> {
      const actionMap: Record<
        string,
        { controllers: Record<string, Record<string, { enabled: boolean; policy: string }>> }
      > = {};

      try {
        for (const [apiName, api] of Object.entries(strapi.apis ?? {})) {
          const apiKey = `api::${apiName}`;
          if (!actionMap[apiKey]) actionMap[apiKey] = { controllers: {} };
          const controllers = (api as { controllers?: Record<string, unknown> }).controllers ?? {};
          for (const [controllerName, controller] of Object.entries(controllers)) {
            const routes = (controller as { routes?: Record<string, unknown> })?.routes ?? {};
            const actions: Record<string, { enabled: boolean; policy: string }> = {};
            for (const actionName of Object.keys(routes)) {
              actions[actionName] = { enabled: false, policy: "" };
            }
            if (Object.keys(actions).length > 0) {
              actionMap[apiKey].controllers[controllerName] = actions;
            }
          }
        }

        for (const [pluginName, plugin] of Object.entries(strapi.plugins ?? {})) {
          const pluginKey = `plugin::${pluginName}`;
          if (!actionMap[pluginKey]) actionMap[pluginKey] = { controllers: {} };
          const routes = (plugin as { routes?: Record<string, unknown> }).routes ?? {};
          const contentApiRoutes = routes["content-api"] as { routes?: Array<{ handler?: string }> } | undefined;
          const routeList = contentApiRoutes?.routes ?? [];
          for (const route of routeList) {
            const handler = route.handler ?? "";
            const parts = handler.split(".");
            if (parts.length >= 2) {
              const controllerName = parts[0]?.replace("-controller", "") ?? "unknown";
              const actionName = parts[1] ?? "unknown";
              if (!actionMap[pluginKey].controllers[controllerName]) {
                actionMap[pluginKey].controllers[controllerName] = {};
              }
              actionMap[pluginKey].controllers[controllerName][actionName] = {
                enabled: false,
                policy: "",
              };
            }
          }
        }
      } catch {
        // Fallback to empty map if structure is unexpected
      }

      return actionMap;
    },
  };
};
