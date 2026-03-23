import { Box, Checkbox, Flex, Typography } from "@strapi/design-system";
import get from "lodash/get";
import React from "react";
import { useIntl } from "react-intl";

import { usePermissions } from "../../contexts/PermissionsContext";
import { cellWidth, firstRowWidth } from "../../utils/constants";
import { getCheckboxState } from "../../utils/getCheckboxState";

type Action = { actionId: string; label: string; subjects: string[] };

interface GlobalActionsProps {
  actions: Action[];
  kind: "collectionTypes" | "singleTypes";
  isFormDisabled?: boolean;
}

export function GlobalActions({
  actions = [],
  kind,
  isFormDisabled,
}: GlobalActionsProps) {
  const { formatMessage } = useIntl();
  const { modifiedData, onChangeGlobalAction } = usePermissions();

  const displayedActions = actions.filter(
    (a) => a.subjects && a.subjects.length > 0,
  );

  const checkboxesState = React.useMemo(() => {
    const section = modifiedData[kind] ?? {};
    const result: Record<
      string,
      { hasAllActionsSelected: boolean; hasSomeActionsSelected: boolean }
    > = {};
    for (const { actionId } of displayedActions) {
      const actionData: Record<string, boolean> = {};
      for (const ctUid of Object.keys(section)) {
        const val = get(
          section,
          [ctUid, actionId, "properties", "enabled"],
          false,
        );
        actionData[ctUid] = !!val;
      }
      result[actionId] = getCheckboxState(actionData);
    }
    return result;
  }, [modifiedData, displayedActions, kind]);

  return (
    <Box
      paddingBottom={4}
      paddingTop={6}
      style={{ paddingLeft: firstRowWidth }}
    >
      <Flex gap={0}>
        {displayedActions.map(({ label, actionId }) => (
          <Flex
            shrink={0}
            width={cellWidth}
            direction="column"
            alignItems="center"
            justifyContent="center"
            key={actionId}
            gap={3}
          >
            <Typography variant="sigma" textColor="neutral500">
              {formatMessage({
                id: `Settings.roles.form.permissions.${label.toLowerCase()}`,
                defaultMessage: label,
              })}
            </Typography>
            <Checkbox
              disabled={isFormDisabled}
              onCheckedChange={(value) => {
                onChangeGlobalAction(kind, actionId, !!value);
              }}
              name={actionId}
              aria-label={formatMessage(
                {
                  id: "Settings.permissions.select-all-by-permission",
                  defaultMessage: "Select all {label} permissions",
                },
                {
                  label: formatMessage({
                    id: `Settings.roles.form.permissions.${label.toLowerCase()}`,
                    defaultMessage: label,
                  }),
                },
              )}
              checked={
                get(
                  checkboxesState,
                  [actionId, "hasSomeActionsSelected"],
                  false,
                )
                  ? "indeterminate"
                  : get(
                      checkboxesState,
                      [actionId, "hasAllActionsSelected"],
                      false,
                    )
              }
            />
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}
