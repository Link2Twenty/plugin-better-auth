import get from "lodash/get";
import set from "lodash/set";
import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from "react";
import type { PermissionsFormState } from "../utils/transform";

const initialState = {
  initialData: {} as PermissionsFormState,
  modifiedData: {} as PermissionsFormState,
};

type State = typeof initialState;

type Action =
  | { type: "INIT"; payload: { permissions: PermissionsFormState } }
  | { type: "ON_CHANGE"; keys: string[]; value: boolean }
  | { type: "ON_CHANGE_SELECT_ALL"; keys: string[]; value: boolean }
  | {
      type: "ON_CHANGE_GLOBAL_ACTION";
      kind: "collectionTypes" | "singleTypes";
      actionId: string;
      value: boolean;
    }
  | { type: "ON_CHANGE_PARENT"; keys: string[]; value: boolean }
  | { type: "ON_RESET" }
  | { type: "ON_SUBMIT_SUCCEEDED" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INIT": {
      return {
        initialData: action.payload.permissions,
        modifiedData: action.payload.permissions,
      };
    }
    case "ON_CHANGE": {
      const modifiedData = JSON.parse(JSON.stringify(state.modifiedData));
      set(
        modifiedData,
        [...action.keys, "properties", "enabled"],
        action.value,
      );
      return { ...state, modifiedData };
    }
    case "ON_CHANGE_SELECT_ALL": {
      const pathToValue = action.keys;
      const oldValues = get(state.modifiedData, pathToValue, {}) as Record<
        string,
        { properties?: { enabled?: boolean } }
      >;
      const updatedValues = Object.fromEntries(
        Object.entries(oldValues).map(([k, v]) => [
          k,
          v && typeof v === "object"
            ? {
                ...v,
                properties: { ...(v.properties ?? {}), enabled: action.value },
              }
            : { properties: { enabled: action.value } },
        ]),
      );
      const modifiedData = JSON.parse(JSON.stringify(state.modifiedData));
      set(modifiedData, pathToValue, updatedValues);
      return { ...state, modifiedData };
    }
    case "ON_CHANGE_GLOBAL_ACTION": {
      const { kind, actionId, value } = action;
      const modifiedData = JSON.parse(JSON.stringify(state.modifiedData));
      const section = modifiedData[kind] ?? {};
      for (const ctUid of Object.keys(section)) {
        if (section[ctUid]?.[actionId]) {
          section[ctUid][actionId] = { properties: { enabled: value } };
        }
      }
      modifiedData[kind] = section;
      return { ...state, modifiedData };
    }
    case "ON_CHANGE_PARENT": {
      const pathToValue = action.keys;
      const oldValues = get(state.modifiedData, pathToValue, {}) as Record<
        string,
        { properties?: { enabled?: boolean } }
      >;
      const updatedValues = Object.fromEntries(
        Object.entries(oldValues).map(([k, v]) => [
          k,
          v && typeof v === "object"
            ? {
                ...v,
                properties: { ...(v.properties ?? {}), enabled: action.value },
              }
            : { properties: { enabled: action.value } },
        ]),
      );
      const modifiedData = JSON.parse(JSON.stringify(state.modifiedData));
      set(modifiedData, pathToValue, updatedValues);
      return { ...state, modifiedData };
    }
    case "ON_RESET":
      return { ...state, modifiedData: state.initialData };
    case "ON_SUBMIT_SUCCEEDED":
      return { ...state, initialData: state.modifiedData };
    default:
      return state;
  }
}

interface PermissionsContextValue {
  modifiedData: PermissionsFormState;
  onChange: (e: { target: { name: string; value: boolean } }) => void;
  onChangeSelectAll: (e: { target: { name: string; value: boolean } }) => void;
  onChangeGlobalAction: (
    kind: "collectionTypes" | "singleTypes",
    actionId: string,
    value: boolean,
  ) => void;
  onChangeParent: (e: { target: { name: string; value: boolean } }) => void;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({
  children,
  permissions,
}: {
  children: React.ReactNode;
  permissions: PermissionsFormState;
}) {
  const [state, dispatch] = useReducer(reducer, initialState, () => ({
    initialData: permissions,
    modifiedData: permissions,
  }));

  React.useEffect(() => {
    dispatch({ type: "INIT", payload: { permissions } });
  }, [permissions]);

  const onChange = useCallback(
    (e: { target: { name: string; value: boolean } }) => {
      const keys = e.target.name.split("..");
      dispatch({ type: "ON_CHANGE", keys, value: e.target.value });
    },
    [],
  );

  const onChangeSelectAll = useCallback(
    (e: { target: { name: string; value: boolean } }) => {
      const keys = e.target.name.split("..");
      dispatch({ type: "ON_CHANGE_SELECT_ALL", keys, value: e.target.value });
    },
    [],
  );

  const onChangeGlobalAction = useCallback(
    (
      kind: "collectionTypes" | "singleTypes",
      actionId: string,
      value: boolean,
    ) => {
      dispatch({ type: "ON_CHANGE_GLOBAL_ACTION", kind, actionId, value });
    },
    [],
  );

  const onChangeParent = useCallback(
    (e: { target: { name: string; value: boolean } }) => {
      const keys = e.target.name.split("..");
      dispatch({ type: "ON_CHANGE_PARENT", keys, value: e.target.value });
    },
    [],
  );

  const value: PermissionsContextValue = {
    modifiedData: state.modifiedData,
    onChange,
    onChangeSelectAll,
    onChangeGlobalAction,
    onChangeParent,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx)
    throw new Error("usePermissions must be used within PermissionsProvider");
  return ctx;
}
