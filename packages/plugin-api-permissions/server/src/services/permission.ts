import type { Core } from "@strapi/strapi";
import { PLUGIN_ID } from "../utils";

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
    if (!pluginKey.startsWith("plugin::") || pluginKey.includes(PLUGIN_ID)) continue;
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
  return {
    getPermissionsLayout() {
      return buildPermissionsLayout(strapi);
    },
  };
};
