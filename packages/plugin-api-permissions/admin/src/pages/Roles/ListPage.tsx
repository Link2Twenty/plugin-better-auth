import {
  EmptyStateLayout,
  LinkButton,
  Table,
  Th,
  Thead,
  Tr,
  Typography,
  VisuallyHidden,
} from "@strapi/design-system";
import { Plus } from "@strapi/icons";
import {
  Layouts,
  Page,
  SearchInput,
  useFetchClient,
  useNotification,
  useRBAC,
} from "@strapi/strapi/admin";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useIntl } from "react-intl";
import TableBody from "./components/TableBody";
import { PERMISSIONS } from "./constants";
import { ROLES_NEW } from "./paths";

type Role = {
  id: number;
  name: string;
  description: string;
  type: string;
  nb_users: number;
};

export const RolesListPage = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const { get, del } = useFetchClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const {
    isLoading: isLoadingForPermissions,
    allowedActions: { canRead, canDelete, canCreate, canUpdate },
  } = useRBAC({
    create: PERMISSIONS.createRole,
    read: PERMISSIONS.readRoles,
    update: PERMISSIONS.updateRole,
    delete: PERMISSIONS.deleteRole,
  });

  const fetchRoles = useCallback(async () => {
    if (!canRead) return;
    setIsLoadingData(true);
    try {
      const { data } = await get("/api-permissions/roles");
      setRoles(data?.roles ?? []);
    } finally {
      setIsLoadingData(false);
    }
  }, [get, canRead]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDeleteClick = useCallback(
    async (id: string, name: string) => {
      const confirmed = window.confirm(
        formatMessage(
          {
            id: "app.components.ConfirmDialog.body",
            defaultMessage: "Are you sure you want to delete {target}?",
          },
          { target: name },
        ),
      );
      if (!confirmed) return;
      try {
        await del(`/api-permissions/roles/${id}`);
        await fetchRoles();
      } catch {
        toggleNotification({
          type: "danger",
          message: formatMessage({
            id: "notification.error",
            defaultMessage: "An error occurred",
          }),
        });
      }
    },
    [del, fetchRoles, formatMessage, toggleNotification],
  );

  const sortedRoles = roles
    .filter(
      (role) =>
        !searchQuery ||
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (role.description ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const isLoading = isLoadingData || isLoadingForPermissions;

  if (isLoading) {
    return <Page.Loading />;
  }

  return (
    <Page.Main>
      <Page.Title>
        {formatMessage(
          { id: "Settings.PageTitle", defaultMessage: "Settings - {name}" },
          {
            name: formatMessage({
              id: "global.roles",
              defaultMessage: "Roles",
            }),
          },
        )}
      </Page.Title>
      <Layouts.Header
        title={formatMessage({ id: "global.roles", defaultMessage: "Roles" })}
        subtitle={formatMessage({
          id: "Settings.roles.list.description",
          defaultMessage: "List of roles",
        })}
        primaryAction={
          canCreate ? (
            <LinkButton href={ROLES_NEW} startIcon={<Plus />} size="S">
              {formatMessage({
                id: "api-permissions.List.button.roles",
                defaultMessage: "Add new role",
              })}
            </LinkButton>
          ) : null
        }
      />
      <Layouts.Action
        startActions={
          <SearchInput
            label={formatMessage({
              id: "app.component.search.label",
              defaultMessage: "Search",
            })}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value ?? "")
            }
          />
        }
      />
      <Layouts.Content>
        {!canRead && <Page.NoPermissions />}
        {canRead && sortedRoles.length > 0 ? (
          <Table colCount={4} rowCount={sortedRoles.length + 1}>
            <Thead>
              <Tr>
                <Th>
                  <Typography variant="sigma" textColor="neutral600">
                    {formatMessage({ id: "global.name", defaultMessage: "Name" })}
                  </Typography>
                </Th>
                <Th>
                  <Typography variant="sigma" textColor="neutral600">
                    {formatMessage({ id: "global.description", defaultMessage: "Description" })}
                  </Typography>
                </Th>
                <Th>
                  <Typography variant="sigma" textColor="neutral600">
                    {formatMessage({ id: "global.users", defaultMessage: "Users" })}
                  </Typography>
                </Th>
                <Th>
                  <VisuallyHidden>
                    {formatMessage({ id: "global.actions", defaultMessage: "Actions" })}
                  </VisuallyHidden>
                </Th>
              </Tr>
            </Thead>
            <TableBody
              sortedRoles={sortedRoles}
              canDelete={canDelete}
              canUpdate={canUpdate}
              onDeleteClick={handleDeleteClick}
            />
          </Table>
        ) : (
          <EmptyStateLayout
            content={formatMessage({
              id: "api-permissions.Roles.empty",
              defaultMessage: "You don't have any roles yet.",
            })}
          />
        )}
      </Layouts.Content>
    </Page.Main>
  );
};

export const ProtectedRolesListPage = () => (
  <Page.Protect permissions={PERMISSIONS.accessRoles}>
    <RolesListPage />
  </Page.Protect>
);
