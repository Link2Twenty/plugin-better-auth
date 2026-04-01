import { Box, Checkbox, Flex, Typography } from "@strapi/design-system";
import { ChevronDown, ChevronUp } from "@strapi/icons";
import get from "lodash/get";
import React from "react";
import { useIntl } from "react-intl";
import styled from "styled-components";

import { usePermissions } from "../../contexts/PermissionsContext";
import { cellWidth, firstRowWidth, rowHeight } from "../../utils/constants";
import { getCheckboxState } from "../../utils/getCheckboxState";
import { HiddenAction } from "./HiddenAction";

type Action = { actionId: string; label: string; subjects: string[] };
type Subject = { uid: string; label: string };

function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

interface ContentTypeCollapsesProps {
  actions: Action[];
  subjects: Subject[];
  pathToData: string;
  isFormDisabled?: boolean;
}

const Wrapper = styled(Flex)`
  border: 1px solid transparent;
`;

const Cell = styled(Flex)`
  width: ${cellWidth};
  position: relative;
`;

const Chevron = styled(Box)`
  display: none;
  padding-right: ${({ theme }) => theme.spaces[2]};

  svg {
    width: 1.4rem;
  }

  path {
    fill: ${({ theme }) => theme.colors.primary600};
  }
`;

const CollapseLabel = styled(Flex)<{ $isCollapsable: boolean }>`
  padding-right: ${({ theme }) => theme.spaces[2]};
  overflow: hidden;
  flex: 1;
  cursor: ${({ $isCollapsable }) => ($isCollapsable ? "pointer" : "default")};
`;

const activeRowStyle = `
  & > div:first-child {
    background-color: var(--strapi-colors-primary100);
    color: var(--strapi-colors-primary600);
    border-radius: 2px;
    font-weight: 600;
  }
  ${Chevron} {
    display: flex;
  }
`;

const BoxWrapper = styled.div<{ $isActive: boolean }>`
  display: inline-flex;
  min-width: 100%;
  position: relative;

  &:hover {
    ${activeRowStyle}
  }

  ${({ $isActive }) => $isActive && activeRowStyle}
`;

export function ContentTypeCollapses({
  actions = [],
  subjects = [],
  pathToData,
  isFormDisabled,
}: ContentTypeCollapsesProps) {
  const [collapseToOpen, setCollapseToOpen] = React.useState<string | null>(
    null,
  );
  const { formatMessage } = useIntl();
  const { modifiedData, onChange, onChangeParent } = usePermissions();

  const handleClickToggleCollapse = (uid: string) => () => {
    setCollapseToOpen((prev) => (prev === uid ? null : uid));
  };

  const displayedActions = actions.filter(
    (a) => a.subjects && a.subjects.length > 0,
  );
  const sortedSubjects = [...subjects].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  return (
    <>
      {sortedSubjects.map(({ uid, label }, index) => {
        const isActive = collapseToOpen === uid;
        const rowPath = `${pathToData}..${uid}`;
        const rowData = get(modifiedData, rowPath.split(".."), {}) as Record<
          string,
          { properties?: { enabled?: boolean } }
        >;
        const dataWithoutConditions = Object.fromEntries(
          Object.entries(rowData).map(([k, v]) => [
            k,
            v?.properties?.enabled ?? false,
          ]),
        );
        const { hasAllActionsSelected, hasSomeActionsSelected } =
          getCheckboxState(dataWithoutConditions);

        return (
          <BoxWrapper key={uid} $isActive={!!isActive}>
            <Wrapper
              height={rowHeight}
              flex={1}
              alignItems="center"
              background={index % 2 === 0 ? "neutral100" : "neutral0"}
              paddingRight={6}
              style={{
                borderRadius: isActive ? "2px 2px 0 0" : "2px",
              }}
            >
              <Flex
                alignItems="center"
                width={firstRowWidth}
                shrink={0}
                paddingLeft={6}
                paddingRight={2}
                onClick={handleClickToggleCollapse(uid)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClickToggleCollapse(uid)();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-expanded={isActive}
              >
                <Box paddingRight={2}>
                  <Checkbox
                    disabled={isFormDisabled}
                    name={rowPath}
                    aria-label={formatMessage(
                      {
                        id: "Settings.permissions.select-all-by-permission",
                        defaultMessage: "Select all {label} permissions",
                      },
                      { label: capitalise(label) },
                    )}
                    onCheckedChange={(value) => {
                      onChangeParent({
                        target: { name: rowPath, value: !!value },
                      });
                    }}
                    checked={
                      hasSomeActionsSelected
                        ? "indeterminate"
                        : hasAllActionsSelected
                    }
                  />
                </Box>
                <CollapseLabel $isCollapsable={true}>
                  <Typography ellipsis>{capitalise(label)}</Typography>
                  <Chevron>
                    {isActive ? (
                      <ChevronUp aria-hidden />
                    ) : (
                      <ChevronDown aria-hidden />
                    )}
                  </Chevron>
                </CollapseLabel>
              </Flex>
              <Flex style={{ flex: 1 }} gap={0}>
                {displayedActions.map(
                  ({
                    actionId,
                    label: actionLabel,
                    subjects: actionSubjects,
                  }) => {
                    const isDisplayed =
                      Array.isArray(actionSubjects) &&
                      actionSubjects.includes(uid);

                    if (!isDisplayed) {
                      return <HiddenAction key={actionId} />;
                    }

                    const checkboxName = `${rowPath}..${actionId}`;
                    const isChecked = get(
                      modifiedData,
                      [...checkboxName.split(".."), "properties", "enabled"],
                      false,
                    ) as boolean;

                    return (
                      <Cell
                        key={actionId}
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Checkbox
                          disabled={isFormDisabled}
                          name={checkboxName}
                          aria-label={formatMessage(
                            {
                              id: "Settings.permissions.select-by-permission",
                              defaultMessage: "Select {label} permission",
                            },
                            { label: `${actionLabel} ${label}` },
                          )}
                          onCheckedChange={(value) => {
                            onChange({
                              target: { name: checkboxName, value: !!value },
                            });
                          }}
                          checked={isChecked}
                        />
                      </Cell>
                    );
                  },
                )}
              </Flex>
            </Wrapper>
          </BoxWrapper>
        );
      })}
    </>
  );
}
