import {
  Accordion,
  Box,
  Checkbox,
  Flex,
  Grid,
  Typography,
} from "@strapi/design-system";
import get from "lodash/get";
import { useIntl } from "react-intl";
import styled from "styled-components";

import { usePermissions } from "../../contexts/PermissionsContext";
import { getCheckboxState } from "../../utils/getCheckboxState";
import getTrad from "../../utils/getTrad";

type PluginPermission = {
  action: string;
  displayName: string;
  plugin: string;
  subCategory: string;
};

const Border = styled(Box)`
  align-self: center;
  margin-left: ${({ theme }) => theme.spaces[4]};
  margin-right: ${({ theme }) => theme.spaces[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral150};
`;

function capitalise(str: string): string {
  return str
    .split(/[-_.]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function groupPluginsByPlugin(
  plugins: PluginPermission[],
): Map<string, Map<string, PluginPermission[]>> {
  const byPlugin = new Map<string, Map<string, PluginPermission[]>>();
  for (const p of plugins) {
    if (!byPlugin.has(p.plugin)) {
      byPlugin.set(p.plugin, new Map());
    }
    const subMap = byPlugin.get(p.plugin)!;
    const list = subMap.get(p.subCategory) ?? [];
    const actionName = p.action.split(".").pop() ?? p.action;
    if (
      !list.some((x) => (x.action.split(".").pop() ?? x.action) === actionName)
    ) {
      list.push(p);
      subMap.set(p.subCategory, list);
    }
  }
  return byPlugin;
}

interface PluginsPermissionsProps {
  plugins: PluginPermission[];
  isFormDisabled?: boolean;
}

export function PluginsPermissions({
  plugins = [],
  isFormDisabled,
}: PluginsPermissionsProps) {
  const { formatMessage } = useIntl();
  const { modifiedData, onChange, onChangeParent } = usePermissions();

  const grouped = groupPluginsByPlugin(plugins);

  if (grouped.size === 0) {
    return (
      <Box padding={6}>
        <Typography variant="delta" textColor="neutral600">
          {formatMessage({
            id: getTrad("Permissions.pluginsEmpty"),
            defaultMessage: "No plugin permissions available.",
          })}
        </Typography>
      </Box>
    );
  }

  return (
    <Box padding={6} background="neutral0">
      <Accordion.Root size="M">
        {Array.from(grouped.entries()).map(([pluginName, subMap], index) => {
          const categoryDisplayName =
            pluginName === "upload"
              ? "Media Library"
              : capitalise(pluginName.replace(/-/g, " "));

          return (
            <Accordion.Item key={pluginName} value={pluginName}>
              <Accordion.Header
                variant={index % 2 === 1 ? "primary" : "secondary"}
              >
                <Accordion.Trigger caretPosition="right">
                  {categoryDisplayName}
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content>
                <Box padding={6}>
                  {Array.from(subMap.entries()).map(
                    ([subCategory, actions]) => {
                      const pathToData = `plugins..${pluginName}..${subCategory}`;
                      const mainData = get(
                        modifiedData,
                        pathToData.split(".."),
                        {},
                      ) as Record<
                        string,
                        { properties?: { enabled?: boolean } }
                      >;
                      const dataWithoutConditions = Object.fromEntries(
                        Object.entries(mainData).map(([k, v]) => [
                          k,
                          v?.properties?.enabled ?? false,
                        ]),
                      );
                      const { hasAllActionsSelected, hasSomeActionsSelected } =
                        getCheckboxState(dataWithoutConditions);

                      return (
                        <Box
                          key={subCategory}
                          paddingBottom={subCategory ? 4 : 0}
                        >
                          <Flex
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Box paddingRight={4}>
                              <Typography
                                variant="sigma"
                                textColor="neutral600"
                              >
                                {capitalise(subCategory.replace(/-/g, " "))}
                              </Typography>
                            </Box>
                            <Border flex={1} />
                            <Box paddingLeft={4}>
                              <Checkbox
                                name={pathToData}
                                disabled={isFormDisabled}
                                onCheckedChange={(value) => {
                                  onChangeParent({
                                    target: {
                                      name: pathToData,
                                      value: !!value,
                                    },
                                  });
                                }}
                                checked={
                                  hasSomeActionsSelected
                                    ? "indeterminate"
                                    : hasAllActionsSelected
                                }
                              >
                                {formatMessage({
                                  id: "app.utils.select-all",
                                  defaultMessage: "Select all",
                                })}
                              </Checkbox>
                            </Box>
                          </Flex>
                          <Flex paddingTop={6} paddingBottom={6}>
                            <Grid.Root gap={2} style={{ flex: 1 }}>
                              {actions.map((p) => {
                                const actionName =
                                  p.action.split(".").pop() ?? p.action;
                                const checkboxName = `${pathToData}..${actionName}`;
                                const isChecked = get(
                                  modifiedData,
                                  [
                                    ...checkboxName.split(".."),
                                    "properties",
                                    "enabled",
                                  ],
                                  false,
                                ) as boolean;

                                return (
                                  <Grid.Item
                                    col={4}
                                    xs={12}
                                    s={6}
                                    key={p.action}
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      name={checkboxName}
                                      disabled={isFormDisabled}
                                      onCheckedChange={(value) => {
                                        onChange({
                                          target: {
                                            name: checkboxName,
                                            value: !!value,
                                          },
                                        });
                                      }}
                                    >
                                      {p.displayName}
                                    </Checkbox>
                                  </Grid.Item>
                                );
                              })}
                            </Grid.Root>
                          </Flex>
                        </Box>
                      );
                    },
                  )}
                </Box>
              </Accordion.Content>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
    </Box>
  );
}
