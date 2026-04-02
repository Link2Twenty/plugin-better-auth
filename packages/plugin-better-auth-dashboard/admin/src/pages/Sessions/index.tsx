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
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { client } from "../../client";
import { withContext } from "../../utils/dashContext";

const PAGE_SIZE = 25;

export function SessionsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const offset = (page - 1) * PAGE_SIZE;

  const sessionsQuery = useQuery({
    queryKey: ["dash-all-sessions", page],
    queryFn: async () => {
      const result = await client.dash.listAllSessions({
        // query: { limit: PAGE_SIZE, offset },
      });
      if (result.error)
        throw new Error(result.error.message ?? "Failed to load sessions");
      return result.data ?? [];
    },
    keepPreviousData: true,
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await client.dash.sessions.revoke({
        query: {},
        fetchOptions: {
          headers: { "Content-Type": "application/json" },
        },
      });
      if (result.error)
        throw new Error(result.error.message ?? "Revoke failed");
    },
    onSuccess: () => {
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
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["dash-all-sessions"] });
    },
  });

  const usersWithSessions = sessionsQuery.data ?? [];

  // Flatten for selection — selecting by userId
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
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allUserIds));
    }
  };

  return (
    <Box padding={6}>
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        paddingBottom={4}
      >
        <Typography variant="beta" textColor="neutral800">
          Sessions
        </Typography>
        {someSelected && (
          <Button
            variant="danger-light"
            size="S"
            loading={revokeManyMutation.isLoading}
            onClick={() => revokeManyMutation.mutate([...selected])}
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
      >
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
              borderWidth="1px"
            >
              <Flex
                padding={4}
                alignItems="center"
                gap={3}
                background="neutral50"
              >
                <Checkbox
                  checked={selected.has(userRow.id)}
                  onCheckedChange={() => toggleSelect(userRow.id)}
                  aria-label={`Select ${userRow.name}`}
                />
                <Flex direction="column">
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
              </Flex>

              {userRow.sessions.map((session) => (
                <Flex
                  key={session.id}
                  paddingLeft={10}
                  paddingRight={4}
                  paddingTop={3}
                  paddingBottom={3}
                  alignItems="center"
                  gap={3}
                  borderColor="neutral100"
                  borderStyle="solid"
                  borderWidth="1px"
                >
                  <Flex direction="column" gap={1}>
                    {session.ipAddress && (
                      <Typography variant="pi" textColor="neutral700">
                        IP: {session.ipAddress}
                      </Typography>
                    )}
                    {session.userAgent && (
                      <Typography
                        variant="pi"
                        textColor="neutral500"
                        style={{
                          maxWidth: 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {session.userAgent}
                      </Typography>
                    )}
                    <Typography variant="pi" textColor="neutral400">
                      Created: {new Date(session.createdAt).toLocaleString()}
                      {" · "}
                      Expires: {new Date(session.expiresAt).toLocaleString()}
                    </Typography>
                  </Flex>
                  <IconButton
                    label="Revoke session"
                    onClick={() => revokeSessionMutation.mutate(session.id)}
                  >
                    <Trash />
                  </IconButton>
                </Flex>
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
    </Box>
  );
}
