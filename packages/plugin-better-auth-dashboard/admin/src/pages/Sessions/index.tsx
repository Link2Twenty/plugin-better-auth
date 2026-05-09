import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  IconButton,
  Loader,
  Typography,
} from "@strapi/design-system";
import { Trash } from "@strapi/icons";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import styled from "styled-components";
import { client } from "../../client";
import { Avatar } from "../../components/Avatar";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { withContext } from "../../utils/dashContext";

const PAGE_SIZE = 25;

const SessionCard = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px 10px 32px;
  border-top: 1px solid #eaeaef;
  background: white;
  transition: background 100ms ease;

  &:hover {
    background: #f6f6f9;
  }
`;

const SessionMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
`;

const IpText = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #32324d;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  background: #f0f0ff;
  padding: 1px 5px;
  border-radius: 3px;
`;

const TimestampText = styled.span`
  font-size: 11px;
  color: #8e8ea9;
`;

const AgentText = styled.span`
  font-size: 11px;
  color: #8e8ea9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  max-width: 480px;
`;

const UserRowHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: default;
`;

export function SessionsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmRevokeSessionId, setConfirmRevokeSessionId] = useState<
    string | null
  >(null);
  const [confirmRevokeMany, setConfirmRevokeMany] = useState(false);

  const sessionsQuery = useQuery({
    queryKey: ["dash-all-sessions", page],
    queryFn: async () => {
      const result = await client.dash.listAllSessions({});
      if (result.error)
        throw new Error(result.error.message ?? "Failed to load sessions");
      return result.data ?? [];
    },
    keepPreviousData: true,
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await client.dash.sessions.revoke(
        {},
        withContext({ sessionId }),
      );
      if (result.error)
        throw new Error(result.error.message ?? "Revoke failed");
    },
    onSuccess: () => {
      setConfirmRevokeSessionId(null);
      qc.invalidateQueries({ queryKey: ["dash-all-sessions"] });
    },
  });

  const revokeManyMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const result = await client.dash.sessions.revokeMany(
        {},
        withContext({ userIds } as never),
      );
      if (result.error)
        throw new Error(result.error.message ?? "Revoke failed");
      return result.data;
    },
    onSuccess: () => {
      setConfirmRevokeMany(false);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["dash-all-sessions"] });
    },
  });

  const usersWithSessions = sessionsQuery.data ?? [];
  const allUserIds = usersWithSessions.map((u) => u.id);
  const allSelected =
    allUserIds.length > 0 && allUserIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allUserIds));
  };

  return (
    <Box padding={6} data-testid="sessions-page">
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        paddingBottom={4}
      >
        <Box>
          <Typography variant="beta" textColor="neutral800">
            Sessions
          </Typography>
          <Box paddingTop={1}>
            <Typography variant="pi" textColor="neutral500">
              {usersWithSessions.length > 0
                ? `${usersWithSessions.length} user${usersWithSessions.length !== 1 ? "s" : ""} with active sessions`
                : "Active sessions across all users"}
            </Typography>
          </Box>
        </Box>
        {someSelected && (
          <Button
            variant="danger-light"
            size="S"
            onClick={() => setConfirmRevokeMany(true)}
            data-testid="revoke-selected-btn"
          >
            Revoke sessions for {selected.size} user
            {selected.size !== 1 ? "s" : ""}
          </Button>
        )}
      </Flex>

      {sessionsQuery.isError && (
        <Alert closeLabel="Close" title="Error" variant="danger">
          {sessionsQuery.error instanceof Error
            ? sessionsQuery.error.message
            : "An error occurred"}
        </Alert>
      )}

      <Box
        background="neutral0"
        shadow="filterShadow"
        hasRadius
        borderColor="neutral150"
        borderStyle="solid"
        borderWidth="1px"
        style={{ overflow: "hidden" }}
      >
        {!sessionsQuery.isLoading && usersWithSessions.length > 0 && (
          <Flex
            paddingLeft={4}
            paddingRight={4}
            paddingTop={3}
            paddingBottom={3}
            alignItems="center"
            gap={3}
            background="neutral50"
            borderColor="neutral150"
            borderStyle="solid"
            borderWidth="0 0 1px 0"
          >
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              aria-label="Select all users"
            />
            <Typography
              variant="sigma"
              textColor="neutral600"
              style={{ flex: 1 }}
            >
              User
            </Typography>
            <Typography variant="sigma" textColor="neutral600">
              Sessions
            </Typography>
          </Flex>
        )}

        {sessionsQuery.isLoading ? (
          <Flex justifyContent="center" padding={8}>
            <Loader>Loading sessions…</Loader>
          </Flex>
        ) : usersWithSessions.length === 0 ? (
          <Flex justifyContent="center" padding={8}>
            <Typography textColor="neutral500">No active sessions</Typography>
          </Flex>
        ) : (
          usersWithSessions.map((userRow) => (
            <Box
              key={userRow.id}
              borderColor="neutral150"
              borderStyle="solid"
              borderWidth="0 0 1px 0"
              data-testid="session-user-row"
            >
              <UserRowHeader>
                <Checkbox
                  checked={selected.has(userRow.id)}
                  onCheckedChange={() => toggleSelect(userRow.id)}
                  aria-label={`Select ${userRow.name}`}
                />
                <Avatar name={userRow.name ?? ""} src={null} size={30} />
                <Flex direction="column" gap={1} style={{ flex: 1 }}>
                  <Typography variant="omega" fontWeight="semiBold">
                    {userRow.name}
                  </Typography>
                  <Typography variant="pi" textColor="neutral500">
                    {userRow.email}
                  </Typography>
                </Flex>
                <Badge backgroundColor="neutral100" textColor="neutral600">
                  {userRow.sessions.length} session
                  {userRow.sessions.length !== 1 ? "s" : ""}
                </Badge>
              </UserRowHeader>

              {userRow.sessions.map((session) => (
                <SessionCard key={session.id} data-testid="session-row">
                  <SessionMeta>
                    <Flex
                      gap={2}
                      alignItems="center"
                      style={{ flexWrap: "wrap" }}
                    >
                      {session.ipAddress && (
                        <IpText>{session.ipAddress}</IpText>
                      )}
                      <TimestampText>
                        Created {new Date(session.createdAt).toLocaleString()} ·
                        Expires {new Date(session.expiresAt).toLocaleString()}
                      </TimestampText>
                    </Flex>
                    {session.userAgent && (
                      <AgentText>{session.userAgent}</AgentText>
                    )}
                  </SessionMeta>
                  <IconButton
                    label="Revoke session"
                    onClick={() => setConfirmRevokeSessionId(session.id)}
                    style={{ flexShrink: 0 }}
                    data-testid="revoke-session-btn"
                  >
                    <Trash />
                  </IconButton>
                </SessionCard>
              ))}
            </Box>
          ))
        )}
      </Box>

      {usersWithSessions.length === PAGE_SIZE && (
        <Flex justifyContent="flex-end" paddingTop={4}>
          <Flex gap={2}>
            <Button
              variant="tertiary"
              size="S"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="tertiary"
              size="S"
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </Flex>
        </Flex>
      )}

      {confirmRevokeSessionId && (
        <ConfirmDialog
          title="Revoke session"
          message="Are you sure you want to revoke this session? The user will be signed out on this device."
          confirmLabel="Revoke"
          loading={revokeSessionMutation.isLoading}
          onConfirm={() => revokeSessionMutation.mutate(confirmRevokeSessionId)}
          onCancel={() => setConfirmRevokeSessionId(null)}
        />
      )}

      {confirmRevokeMany && (
        <ConfirmDialog
          title={`Revoke sessions for ${selected.size} user${selected.size !== 1 ? "s" : ""}`}
          message={`Are you sure you want to revoke all sessions for ${selected.size} user${selected.size !== 1 ? "s" : ""}? They will be signed out on all their devices.`}
          confirmLabel="Revoke all"
          loading={revokeManyMutation.isLoading}
          onConfirm={() => revokeManyMutation.mutate([...selected])}
          onCancel={() => setConfirmRevokeMany(false)}
        />
      )}
    </Box>
  );
}
