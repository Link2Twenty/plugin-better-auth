import {
  Box,
  Button,
  Dialog,
  EmptyStateLayout,
  Flex,
  IconButton,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Typography,
} from "@strapi/design-system";
import { Plus, Trash } from "@strapi/icons";
import { Layouts, Page, useNotification } from "@strapi/strapi/admin";
import { useState } from "react";
import { useIntl } from "react-intl";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { client } from "../../client";
import { CreateUserDialog } from "./CreateUserDialog";

const PLUGIN_ID = "better-auth-dashboard";
const LIMIT = 20;

function BannedBadge({ banned }: { banned: boolean }) {
  if (!banned) return null;
  return (
    <Box
      background="danger100"
      padding="2px 8px"
      borderRadius="4px"
      style={{ display: "inline-block" }}
    >
      <Typography variant="pi" textColor="danger600">
        Banned
      </Typography>
    </Box>
  );
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <Box
      background={verified ? "success100" : "neutral100"}
      padding="2px 8px"
      borderRadius="4px"
      style={{ display: "inline-block" }}
    >
      <Typography variant="pi" textColor={verified ? "success600" : "neutral500"}>
        {verified ? "Verified" : "Unverified"}
      </Typography>
    </Box>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Box
      background="primary100"
      borderRadius="50%"
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Typography variant="pi" textColor="primary600" fontWeight="bold">
        {initials}
      </Typography>
    </Box>
  );
}

export const UsersPage = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const queryClient = useQueryClient();

  const [offset, setOffset] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery(
    [PLUGIN_ID, "users", offset],
    async () => {
      const result = await client.dash.listUsers({ query: { limit: LIMIT, offset } });
      if (result.error) throw new Error(result.error.message ?? "Failed to load users");
      return result.data;
    },
  );

  const banMutation = useMutation(
    async ({ userId, banned }: { userId: string; banned: boolean }) => {
      // userId is passed in the body so the Strapi proxy can include it in the JWT.
      // The dash() middleware validates userId from the JWT payload, not from the body.
      // Using a variable avoids TypeScript's excess property check on object literals.
      const userIdBody = { userId };
      const result = banned
        ? await client.dash.unbanUser(userIdBody)
        : await client.dash.banUser(userIdBody);
      if (result.error) throw new Error(result.error.message ?? "Action failed");
      return result.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([PLUGIN_ID, "users"]);
        toggleNotification({
          type: "success",
          message: formatMessage({
            id: `${PLUGIN_ID}.users.ban.success`,
            defaultMessage: "User updated successfully",
          }),
        });
      },
      onError: () => {
        toggleNotification({
          type: "danger",
          message: formatMessage({
            id: `${PLUGIN_ID}.users.ban.error`,
            defaultMessage: "Failed to update user",
          }),
        });
      },
    },
  );

  const deleteMutation = useMutation(
    async (userId: string) => {
      const userIdBody = { userId };
      const result = await client.dash.deleteUser(userIdBody);
      if (result.error) throw new Error(result.error.message ?? "Failed to delete user");
      return result.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([PLUGIN_ID, "users"]);
        queryClient.invalidateQueries([PLUGIN_ID, "user-stats"]);
        setConfirmDelete(null);
        toggleNotification({
          type: "success",
          message: formatMessage({
            id: `${PLUGIN_ID}.users.delete.success`,
            defaultMessage: "User deleted",
          }),
        });
      },
      onError: () => {
        toggleNotification({
          type: "danger",
          message: formatMessage({
            id: `${PLUGIN_ID}.users.delete.error`,
            defaultMessage: "Failed to delete user",
          }),
        });
      },
    },
  );

  if (isLoading) return <Page.Loading />;
  if (error) return <Page.Error />;

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const hasPrev = offset > 0;
  const hasNext = offset + LIMIT < total;

  return (
    <Page.Main>
      <Page.Title>
        {formatMessage({ id: `${PLUGIN_ID}.Settings.users`, defaultMessage: "Users - Better Auth" })}
      </Page.Title>
      <Layouts.Header
        title={formatMessage({ id: `${PLUGIN_ID}.Settings.users`, defaultMessage: "Users" })}
        subtitle={formatMessage(
          { id: `${PLUGIN_ID}.users.subtitle`, defaultMessage: "{total} users in total" },
          { total },
        )}
        primaryAction={
          <Button startIcon={<Plus />} onClick={() => setShowCreateDialog(true)} size="S">
            {formatMessage({
              id: `${PLUGIN_ID}.users.create.button`,
              defaultMessage: "Create user",
            })}
          </Button>
        }
      />
      <Layouts.Content>
        {users.length > 0 ? (
          <>
            <Table colCount={6} rowCount={users.length + 1}>
              <Thead>
                <Tr>
                  <Th>
                    <Typography variant="sigma" textColor="neutral600">
                      {formatMessage({ id: "global.name", defaultMessage: "Name" })}
                    </Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma" textColor="neutral600">
                      {formatMessage({ id: "global.email", defaultMessage: "Email" })}
                    </Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma" textColor="neutral600">Email</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma" textColor="neutral600">Status</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma" textColor="neutral600">
                      {formatMessage({
                        id: "app.components.ListViewTable.createdAt",
                        defaultMessage: "Created At",
                      })}
                    </Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma" textColor="neutral600">
                      {formatMessage({ id: "global.actions", defaultMessage: "Actions" })}
                    </Typography>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.id}>
                    <Td>
                      <Flex gap={3} alignItems="center">
                        <Avatar name={user.name} />
                        <Typography textColor="neutral800" fontWeight="semiBold">
                          {user.name}
                        </Typography>
                      </Flex>
                    </Td>
                    <Td>
                      <Typography textColor="neutral800">{user.email}</Typography>
                    </Td>
                    <Td>
                      <VerifiedBadge verified={user.emailVerified} />
                    </Td>
                    <Td>
                      <BannedBadge banned={user.banned} />
                    </Td>
                    <Td>
                      <Typography textColor="neutral800">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </Td>
                    <Td>
                      <Flex gap={2}>
                        <Button
                          variant={user.banned ? "secondary" : "danger-light"}
                          size="S"
                          onClick={() =>
                            banMutation.mutate({ userId: user.id, banned: user.banned })
                          }
                        >
                          {user.banned
                            ? formatMessage({
                                id: `${PLUGIN_ID}.users.unban`,
                                defaultMessage: "Unban",
                              })
                            : formatMessage({
                                id: `${PLUGIN_ID}.users.ban`,
                                defaultMessage: "Ban",
                              })}
                        </Button>
                        <IconButton
                          label={formatMessage({ id: "global.delete", defaultMessage: "Delete" })}
                          onClick={() => setConfirmDelete(user.id)}
                        >
                          <Trash />
                        </IconButton>
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {(hasPrev || hasNext) && (
              <Flex justifyContent="flex-end" gap={2} marginTop={4}>
                <Button
                  variant="tertiary"
                  disabled={!hasPrev}
                  onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
                >
                  {formatMessage({ id: "components.pagination.go-to-previous", defaultMessage: "Previous" })}
                </Button>
                <Typography textColor="neutral600" paddingTop={2}>
                  {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
                </Typography>
                <Button
                  variant="tertiary"
                  disabled={!hasNext}
                  onClick={() => setOffset((o) => o + LIMIT)}
                >
                  {formatMessage({ id: "components.pagination.go-to-next", defaultMessage: "Next" })}
                </Button>
              </Flex>
            )}
          </>
        ) : (
          <EmptyStateLayout
            content={formatMessage({
              id: `${PLUGIN_ID}.users.empty`,
              defaultMessage: "No users found.",
            })}
            action={
              <Button
                variant="secondary"
                startIcon={<Plus />}
                onClick={() => setShowCreateDialog(true)}
              >
                {formatMessage({
                  id: `${PLUGIN_ID}.users.create.button`,
                  defaultMessage: "Create user",
                })}
              </Button>
            }
          />
        )}
      </Layouts.Content>

      {showCreateDialog && (
        <CreateUserDialog onClose={() => setShowCreateDialog(false)} />
      )}

      {confirmDelete && (
        <Dialog.Root defaultOpen onOpenChange={(open) => !open && setConfirmDelete(null)}>
          <Dialog.Content>
            <Dialog.Header>
              {formatMessage({
                id: `${PLUGIN_ID}.users.delete.confirm.title`,
                defaultMessage: "Delete user",
              })}
            </Dialog.Header>
            <Dialog.Body>
              <Typography>
                {formatMessage({
                  id: `${PLUGIN_ID}.users.delete.confirm.message`,
                  defaultMessage: "Are you sure you want to delete this user? This action cannot be undone.",
                })}
              </Typography>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="tertiary" onClick={() => setConfirmDelete(null)}>
                {formatMessage({ id: "app.components.Button.cancel", defaultMessage: "Cancel" })}
              </Button>
              <Button
                variant="danger"
                loading={deleteMutation.isLoading}
                onClick={() => deleteMutation.mutate(confirmDelete)}
              >
                {formatMessage({ id: "global.delete", defaultMessage: "Delete" })}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>
      )}
    </Page.Main>
  );
};

export default UsersPage;
