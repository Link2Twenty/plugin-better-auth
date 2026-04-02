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
import { Trash } from "@strapi/icons";
import { Layouts, Page, useNotification } from "@strapi/strapi/admin";
import { useState } from "react";
import { useIntl } from "react-intl";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { client } from "../../client";

const PLUGIN_ID = "better-auth-dashboard";
const LIMIT = 20;

export const SessionsPage = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const queryClient = useQueryClient();

  const [offset, setOffset] = useState(0);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery(
    [PLUGIN_ID, "sessions", offset],
    async () => {
      const result = await client.dash.listAllSessions({ query: { limit: LIMIT, offset } });
      if (result.error) throw new Error(result.error.message ?? "Failed to load sessions");
      return result.data;
    },
  );

  const revokeSessionMutation = useMutation(
    async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
      // sessionId and userId are passed so the Strapi proxy can include them in the JWT.
      // The revokeSession handler reads { sessionId, userId } from ctx.context.payload (JWT).
      const revokeBody = { sessionId, userId };
      const result = await client.dash.sessions.revoke(revokeBody);
      if (result.error) throw new Error(result.error.message ?? "Failed to revoke session");
      return result.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([PLUGIN_ID, "sessions"]);
        toggleNotification({
          type: "success",
          message: formatMessage({
            id: `${PLUGIN_ID}.sessions.revoke.success`,
            defaultMessage: "Session revoked",
          }),
        });
      },
      onError: () => {
        toggleNotification({
          type: "danger",
          message: formatMessage({
            id: `${PLUGIN_ID}.sessions.revoke.error`,
            defaultMessage: "Failed to revoke session",
          }),
        });
      },
    },
  );

  const revokeAllMutation = useMutation(
    async (userId: string) => {
      const result = await client.dash.sessions.revokeAll({ userId });
      if (result.error) throw new Error(result.error.message ?? "Failed to revoke sessions");
      return result.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([PLUGIN_ID, "sessions"]);
        setConfirmRevokeAll(null);
        toggleNotification({
          type: "success",
          message: formatMessage({
            id: `${PLUGIN_ID}.sessions.revokeAll.success`,
            defaultMessage: "All sessions revoked",
          }),
        });
      },
      onError: () => {
        toggleNotification({
          type: "danger",
          message: formatMessage({
            id: `${PLUGIN_ID}.sessions.revokeAll.error`,
            defaultMessage: "Failed to revoke sessions",
          }),
        });
      },
    },
  );

  if (isLoading) return <Page.Loading />;
  if (error) return <Page.Error />;

  const usersWithSessions = data ?? [];
  const totalSessions = usersWithSessions.reduce((sum, u) => sum + u.sessions.length, 0);
  const hasPrev = offset > 0;
  const hasNext = usersWithSessions.length === LIMIT;

  return (
    <Page.Main>
      <Page.Title>
        {formatMessage({
          id: `${PLUGIN_ID}.Settings.sessions`,
          defaultMessage: "Sessions - Better Auth",
        })}
      </Page.Title>
      <Layouts.Header
        title={formatMessage({ id: `${PLUGIN_ID}.Settings.sessions`, defaultMessage: "Sessions" })}
        subtitle={formatMessage(
          {
            id: `${PLUGIN_ID}.sessions.subtitle`,
            defaultMessage: "{total} active sessions",
          },
          { total: totalSessions },
        )}
      />
      <Layouts.Content>
        {usersWithSessions.length > 0 ? (
          <>
            {usersWithSessions.map((userWithSessions) => (
              <Box key={userWithSessions.id} marginBottom={6}>
                <Box
                  background="neutral100"
                  padding={4}
                  borderRadius="4px 4px 0 0"
                  style={{ borderBottom: "1px solid #DCDCE4" }}
                >
                  <Flex justifyContent="space-between" alignItems="center">
                    <Flex direction="column" gap={1}>
                      <Typography variant="omega" fontWeight="semiBold" textColor="neutral800">
                        {userWithSessions.name}
                      </Typography>
                      <Typography variant="pi" textColor="neutral500">
                        {userWithSessions.email}
                      </Typography>
                    </Flex>
                    <Flex gap={2} alignItems="center">
                      <Typography variant="pi" textColor="neutral500">
                        {userWithSessions.sessions.length}{" "}
                        {userWithSessions.sessions.length === 1 ? "session" : "sessions"}
                      </Typography>
                      <Button
                        variant="danger-light"
                        size="S"
                        onClick={() => setConfirmRevokeAll(userWithSessions.id)}
                      >
                        {formatMessage({
                          id: `${PLUGIN_ID}.sessions.revokeAll`,
                          defaultMessage: "Revoke all",
                        })}
                      </Button>
                    </Flex>
                  </Flex>
                </Box>

                <Table colCount={4} rowCount={userWithSessions.sessions.length + 1}>
                  <Thead>
                    <Tr>
                      <Th>
                        <Typography variant="sigma" textColor="neutral600">
                          IP Address
                        </Typography>
                      </Th>
                      <Th>
                        <Typography variant="sigma" textColor="neutral600">
                          User Agent
                        </Typography>
                      </Th>
                      <Th>
                        <Typography variant="sigma" textColor="neutral600">
                          Expires
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
                    {userWithSessions.sessions.map((session) => (
                      <Tr key={session.id}>
                        <Td>
                          <Typography textColor="neutral800">
                            {session.ipAddress ?? "—"}
                          </Typography>
                        </Td>
                        <Td>
                          <Typography
                            textColor="neutral800"
                            style={{
                              maxWidth: 280,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "block",
                            }}
                            title={session.userAgent ?? undefined}
                          >
                            {session.userAgent ?? "—"}
                          </Typography>
                        </Td>
                        <Td>
                          <Typography textColor="neutral800">
                            {new Date(session.expiresAt).toLocaleString()}
                          </Typography>
                        </Td>
                        <Td>
                          <IconButton
                            label={formatMessage({
                              id: `${PLUGIN_ID}.sessions.revoke`,
                              defaultMessage: "Revoke session",
                            })}
                            onClick={() => revokeSessionMutation.mutate({ sessionId: session.id, userId: userWithSessions.id })}
                          >
                            <Trash />
                          </IconButton>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ))}

            {(hasPrev || hasNext) && (
              <Flex justifyContent="flex-end" gap={2} marginTop={4}>
                <Button
                  variant="tertiary"
                  disabled={!hasPrev}
                  onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
                >
                  {formatMessage({
                    id: "components.pagination.go-to-previous",
                    defaultMessage: "Previous",
                  })}
                </Button>
                <Button
                  variant="tertiary"
                  disabled={!hasNext}
                  onClick={() => setOffset((o) => o + LIMIT)}
                >
                  {formatMessage({
                    id: "components.pagination.go-to-next",
                    defaultMessage: "Next",
                  })}
                </Button>
              </Flex>
            )}
          </>
        ) : (
          <EmptyStateLayout
            content={formatMessage({
              id: `${PLUGIN_ID}.sessions.empty`,
              defaultMessage: "No active sessions found.",
            })}
          />
        )}
      </Layouts.Content>

      {confirmRevokeAll && (
        <Dialog.Root defaultOpen onOpenChange={(open) => !open && setConfirmRevokeAll(null)}>
          <Dialog.Content>
            <Dialog.Header>
              {formatMessage({
                id: `${PLUGIN_ID}.sessions.revokeAll.confirm.title`,
                defaultMessage: "Revoke all sessions",
              })}
            </Dialog.Header>
            <Dialog.Body>
              <Typography>
                {formatMessage({
                  id: `${PLUGIN_ID}.sessions.revokeAll.confirm.message`,
                  defaultMessage:
                    "Are you sure you want to revoke all sessions for this user? They will be signed out of all devices.",
                })}
              </Typography>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="tertiary" onClick={() => setConfirmRevokeAll(null)}>
                {formatMessage({ id: "app.components.Button.cancel", defaultMessage: "Cancel" })}
              </Button>
              <Button
                variant="danger"
                loading={revokeAllMutation.isLoading}
                onClick={() => revokeAllMutation.mutate(confirmRevokeAll)}
              >
                {formatMessage({
                  id: `${PLUGIN_ID}.sessions.revokeAll.confirm.submit`,
                  defaultMessage: "Revoke all",
                })}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>
      )}
    </Page.Main>
  );
};

export default SessionsPage;
