import { Box, Tabs, Typography } from "@strapi/design-system";
import { forwardRef, useImperativeHandle } from "react";
import { useIntl } from "react-intl";

import { usePermissions } from "../../contexts/PermissionsContext";
import getTrad from "../../utils/getTrad";
import type {
  PermissionsFormState,
  PermissionsLayout,
} from "../../utils/transform";
import { formStateToApi } from "../../utils/transform";
import { ContentTypes } from "./ContentTypes";
import { PluginsPermissions } from "./PluginsPermissions";

export interface PermissionsRef {
  getPermissions: () => Record<
    string,
    { controllers: Record<string, Record<string, { enabled: boolean }>> }
  >;
}

interface PermissionsProps {
  permissions: PermissionsFormState;
  layout: PermissionsLayout;
  isFormDisabled?: boolean;
}

const TAB_LABELS = [
  {
    labelId: "app.components.LeftMenuLinkContainer.collectionTypes",
    defaultMessage: "Collection Types",
    id: "collectionTypes",
  },
  {
    labelId: "app.components.LeftMenuLinkContainer.singleTypes",
    defaultMessage: "Single Types",
    id: "singleTypes",
  },
  {
    labelId: "app.components.LeftMenuLinkContainer.plugins",
    defaultMessage: "Plugins",
    id: "plugins",
  },
] as const;

export const Permissions = forwardRef<PermissionsRef, PermissionsProps>(
  function Permissions({ layout, isFormDisabled }, ref) {
    const { formatMessage } = useIntl();
    const { modifiedData } = usePermissions();

    useImperativeHandle(ref, () => ({
      getPermissions: () => formStateToApi(modifiedData),
    }));

    const hasCollectionTypes = layout.collectionTypes.subjects.length > 0;
    const hasSingleTypes = layout.singleTypes.subjects.length > 0;
    const hasPlugins = layout.plugins.length > 0;
    const hasContentTypes = hasCollectionTypes || hasSingleTypes;

    if (!hasContentTypes && !hasPlugins) {
      return (
        <Box padding={6}>
          <Typography variant="delta" textColor="neutral600">
            {formatMessage({
              id: getTrad("Permissions.empty"),
              defaultMessage: "No Content API content types found.",
            })}
          </Typography>
        </Box>
      );
    }

    const visibleTabs = TAB_LABELS.filter((t) => {
      if (t.id === "collectionTypes") return hasCollectionTypes;
      if (t.id === "singleTypes") return hasSingleTypes;
      if (t.id === "plugins") return hasPlugins;
      return false;
    });
    const defaultTab = visibleTabs[0]?.id ?? "collectionTypes";

    return (
      <Tabs.Root defaultValue={defaultTab}>
        <Tabs.List
          aria-label={formatMessage({
            id: "Settings.permissions.users.tabs.label",
            defaultMessage: "Tabs Permissions",
          })}
        >
          {visibleTabs.map((tabLabel) => (
            <Tabs.Trigger key={tabLabel.id} value={tabLabel.id}>
              {formatMessage({
                id: tabLabel.labelId,
                defaultMessage: tabLabel.defaultMessage,
              })}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="collectionTypes">
          <ContentTypes
            layout={layout.collectionTypes}
            kind="collectionTypes"
            isFormDisabled={isFormDisabled}
          />
        </Tabs.Content>
        <Tabs.Content value="singleTypes">
          <ContentTypes
            layout={layout.singleTypes}
            kind="singleTypes"
            isFormDisabled={isFormDisabled}
          />
        </Tabs.Content>
        <Tabs.Content value="plugins">
          <PluginsPermissions
            plugins={layout.plugins}
            isFormDisabled={isFormDisabled}
          />
        </Tabs.Content>
      </Tabs.Root>
    );
  },
);
