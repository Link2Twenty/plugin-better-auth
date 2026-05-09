import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  IconButton,
  Loader,
  Pagination,
  Searchbar,
  SearchForm,
  Typography,
} from "@strapi/design-system";
import { Pencil, Plus, Trash } from "@strapi/icons";
import type React from "react";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import styled from "styled-components";
import { client } from "../../client";
import { Avatar } from "../../components/Avatar";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import type { DashConfig } from "../../hooks/useDashConfig";
import { hasPlugin } from "../../hooks/useDashConfig";
import { useUsers } from "../../hooks/useUsers";
import { withContext } from "../../utils/dashContext";
import { CreateUserDialog } from "./CreateUserDialog";
import { UserDetailDrawer } from "./UserDetailDrawer";

const PAGE_SIZE = 25;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TH = styled.th`
  text-align: left;
  padding: 10px 16px;
  border-bottom: 1px solid #dcdce4;
  font-size: 11px;
  font-weight: 600;
  color: #666687;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  background: #f6f6f9;
`;

const THCheck = styled(TH)`
  width: 44px;
  padding-right: 8px;
`;

const THActions = styled(TH)`
  width: 80px;
`;

const TD = styled.td`
  padding: 11px 16px;
  vertical-align: middle;
  border-bottom: 1px solid #eaeaef;
`;

const TDCheck = styled(TD)`
  width: 44px;
  padding-right: 8px;
`;

const TDActions = styled(TD)`
  width: 80px;
`;

const TR = styled.tr<{ $selected?: boolean }>`
  background: ${(p) => (p.$selected ? "#F0F0FF" : "white")};
  transition: background 100ms ease;

  &:hover {
    background: ${(p) => (p.$selected ? "#E6E5FF" : "#F6F6F9")};
  }

  &:last-child td {
    border-bottom: none;
  }
`;

interface Props {
  config: DashConfig;
}

export function UsersPage({ config }: Props) {
  const qc = useQueryClient();
  const banEnabled = hasPlugin(config, "admin");
  const emailVerificationEnabled =
    config.emailVerification.sendVerificationEmailEnabled;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeleteMany, setConfirmDeleteMany] = useState(false);
  const [confirmBanMany, setConfirmBanMany] = useState(false);

  const offset = (page - 1) * PAGE_SIZE;
  const { data, isLoading, isError, error } = useUsers({
    limit: PAGE_SIZE,
    offset,
    search: search || undefined,
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await client.dash.deleteUser({}, withContext({ userId }));
      if (result.error)
        throw new Error(result.error.message ?? "Delete failed");
    },
    onSuccess: () => {
      setConfirmDelete(null);
      qc.invalidateQueries({ queryKey: ["dash-users"] });
      qc.invalidateQueries({ queryKey: ["dash-user-stats"] });
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const result = await client.dash.deleteManyUsers(
        {},
        withContext({ userIds } as never),
      );
      if (result.error)
        throw new Error(result.error.message ?? "Delete failed");
      return result.data;
    },
    onSuccess: () => {
      setConfirmDeleteMany(false);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["dash-users"] });
      qc.invalidateQueries({ queryKey: ["dash-user-stats"] });
    },
  });

  const banManyMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const result = await client.dash.banManyUsers(
        {},
        withContext({ userIds } as never),
      );
      if (result.error) throw new Error(result.error.message ?? "Ban failed");
      return result.data;
    },
    onSuccess: () => {
      setConfirmBanMany(false);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["dash-users"] });
    },
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected =
    users.length > 0 && users.every((u) => selected.has(u.id));
  const someSelected = selected.size > 0;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u) => u.id)));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <Box padding={6} data-testid="users-page">
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        paddingBottom={4}
      >
        <Box>
          <Typography variant="beta" textColor="neutral800">
            Users
          </Typography>
          <Box paddingTop={1}>
            <Typography variant="pi" textColor="neutral500">
              {total.toLocaleString()} total
              {data?.onlineUsers ? ` · ${data.onlineUsers} online` : ""}
            </Typography>
          </Box>
        </Box>
        <Button
          startIcon={<Plus />}
          onClick={() => setShowCreate(true)}
          data-testid="create-user-btn"
        >
          Create user
        </Button>
      </Flex>

      <Flex gap={3} paddingBottom={4} alignItems="flex-end">
        <Box>
          <SearchForm onSubmit={handleSearch}>
            <Searchbar
              clearLabel="Clear"
              name="search"
              placeholder="Search by email…"
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchInput(e.target.value)
              }
              onClear={() => {
                setSearchInput("");
                setSearch("");
                setPage(1);
              }}
              data-testid="user-search"
            >
              Search users
            </Searchbar>
          </SearchForm>
        </Box>

        {someSelected && (
          <Flex gap={2}>
            <Button
              variant="danger-light"
              size="S"
              onClick={() => setConfirmDeleteMany(true)}
              data-testid="delete-selected-btn"
            >
              Delete {selected.size} selected
            </Button>
            {banEnabled && (
              <Button
                variant="secondary"
                size="S"
                onClick={() => setConfirmBanMany(true)}
              >
                Ban {selected.size} selected
              </Button>
            )}
          </Flex>
        )}
      </Flex>

      {isError && (
        <Alert closeLabel="Close" title="Error" variant="danger">
          {(error as Error)?.message}
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
        {isLoading ? (
          <Flex justifyContent="center" padding={8}>
            <Loader>Loading users…</Loader>
          </Flex>
        ) : (
          <Table>
            <thead>
              <tr>
                <THCheck>
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </THCheck>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Status</TH>
                <TH>Created</TH>
                <THActions />
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <TD
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#8e8ea9",
                    }}
                    data-testid="users-empty"
                  >
                    {search
                      ? `No users matching "${search}"`
                      : "No users found"}
                  </TD>
                </tr>
              ) : (
                users.map((user) => (
                  <TR
                    key={user.id}
                    $selected={selected.has(user.id)}
                    data-testid="user-row"
                  >
                    <TDCheck>
                      <Checkbox
                        checked={selected.has(user.id)}
                        onCheckedChange={() => toggleSelect(user.id)}
                        aria-label={`Select ${user.name}`}
                      />
                    </TDCheck>
                    <TD>
                      <Flex alignItems="center" gap={2}>
                        <Avatar
                          name={user.name ?? ""}
                          src={user.image}
                          size={28}
                        />
                        <Typography variant="omega" fontWeight="semiBold">
                          {user.name}
                        </Typography>
                      </Flex>
                    </TD>
                    <TD>
                      <Typography variant="omega" textColor="neutral600">
                        {user.email}
                      </Typography>
                    </TD>
                    <TD>
                      <Flex gap={1}>
                        {user.emailVerified ? (
                          <Badge
                            backgroundColor="success100"
                            textColor="success600"
                          >
                            Verified
                          </Badge>
                        ) : (
                          <Badge
                            backgroundColor="warning100"
                            textColor="warning600"
                          >
                            Unverified
                          </Badge>
                        )}
                        {user.banned && (
                          <Badge
                            backgroundColor="danger100"
                            textColor="danger600"
                          >
                            Banned
                          </Badge>
                        )}
                      </Flex>
                    </TD>
                    <TD>
                      <Typography variant="omega" textColor="neutral500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </TD>
                    <TDActions>
                      <Flex gap={1} justifyContent="flex-end">
                        <IconButton
                          label="Edit user"
                          onClick={() => setDetailUserId(user.id)}
                          data-testid="edit-user-btn"
                        >
                          <Pencil />
                        </IconButton>
                        <IconButton
                          label="Delete user"
                          onClick={() => setConfirmDelete(user.id)}
                          data-testid="delete-user-btn"
                        >
                          <Trash />
                        </IconButton>
                      </Flex>
                    </TDActions>
                  </TR>
                ))
              )}
            </tbody>
          </Table>
        )}
      </Box>

      {pageCount > 1 && (
        <Flex justifyContent="flex-end" paddingTop={4}>
          <Pagination
            activePage={page}
            pageCount={pageCount}
            // @ts-expect-error
            onChangePage={setPage}
          />
        </Flex>
      )}

      {showCreate && <CreateUserDialog onClose={() => setShowCreate(false)} />}

      {detailUserId && (
        <UserDetailDrawer
          userId={detailUserId}
          banEnabled={banEnabled}
          emailVerificationEnabled={emailVerificationEnabled}
          onClose={() => setDetailUserId(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete user"
          message="Are you sure you want to delete this user? This action cannot be undone."
          confirmLabel="Delete"
          loading={deleteMutation.isLoading}
          onConfirm={() => deleteMutation.mutate(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmDeleteMany && (
        <ConfirmDialog
          title={`Delete ${selected.size} user${selected.size !== 1 ? "s" : ""}`}
          message={`Are you sure you want to delete ${selected.size} user${selected.size !== 1 ? "s" : ""}? This action cannot be undone.`}
          confirmLabel="Delete all"
          loading={deleteManyMutation.isLoading}
          onConfirm={() => deleteManyMutation.mutate([...selected])}
          onCancel={() => setConfirmDeleteMany(false)}
        />
      )}

      {confirmBanMany && (
        <ConfirmDialog
          title={`Ban ${selected.size} user${selected.size !== 1 ? "s" : ""}`}
          message={`Are you sure you want to ban ${selected.size} user${selected.size !== 1 ? "s" : ""}? They will be prevented from signing in.`}
          confirmLabel="Ban all"
          variant="danger"
          loading={banManyMutation.isLoading}
          onConfirm={() => banManyMutation.mutate([...selected])}
          onCancel={() => setConfirmBanMany(false)}
        />
      )}
    </Box>
  );
}
