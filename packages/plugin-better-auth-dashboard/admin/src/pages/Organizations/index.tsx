import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  IconButton,
  Loader,
  Searchbar,
  SearchForm,
  Typography,
} from "@strapi/design-system";
import { Pencil, Plus, Trash } from "@strapi/icons";
import type React from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import styled from "styled-components";
import { client } from "../../client";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { withContext } from "../../utils/dashContext";
import { CreateOrganizationDialog } from "./CreateOrganizationDialog";
import { OrganizationDetail } from "./OrganizationDetail";

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

const OrgLogoFallback = styled.div<{ $bg: string; $fg: string }>`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$fg};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  user-select: none;
`;

const ORG_COLORS = [
  { bg: "#EAF5FF", fg: "#0C75AF" },
  { bg: "#F0F0FF", fg: "#4945FF" },
  { bg: "#EAFBE7", fg: "#328048" },
  { bg: "#FFF3D3", fg: "#8E6A00" },
  { bg: "#FCECEA", fg: "#D02B20" },
  { bg: "#F6ECFC", fg: "#8312D1" },
];

function OrgAvatar({ name, logo }: { name: string; logo?: string | null }) {
  if (logo) {
    return (
      <Box
        tag="img"
        src={logo}
        alt=""
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  const color = ORG_COLORS[(name.charCodeAt(0) || 0) % ORG_COLORS.length];
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <OrgLogoFallback $bg={color.bg} $fg={color.fg}>
      {initials}
    </OrgLogoFallback>
  );
}

interface Props {
  teamsEnabled: boolean;
}

export function OrganizationsPage({ teamsEnabled }: Props) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [detailOrgId, setDetailOrgId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeleteMany, setConfirmDeleteMany] = useState(false);

  const offset = (page - 1) * PAGE_SIZE;

  const orgsQuery = useQuery({
    queryKey: ["dash-organizations", page, search],
    queryFn: async () => {
      const result = await client.dash.listOrganizations({
        query: {
          limit: PAGE_SIZE,
          offset,
          sortBy: "createdAt",
          sortOrder: "desc",
          ...(search ? { search } : {}),
        },
      });
      if (result.error)
        throw new Error(result.error.message ?? "Failed to load organizations");
      return result.data;
    },
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const result = await client.dash.organization.delete(
        { organizationId },
        withContext({ organizationId }),
      );
      if (result.error)
        throw new Error(result.error.message ?? "Delete failed");
    },
    onSuccess: () => {
      setConfirmDelete(null);
      qc.invalidateQueries({ queryKey: ["dash-organizations"] });
    },
  });

  const deleteManyMutation = useMutation({
    mutationFn: async (organizationIds: string[]) => {
      const result = await client.dash.organization.deleteMany(
        {},
        withContext({ organizationIds } as never),
      );
      if (result.error)
        throw new Error(result.error.message ?? "Delete failed");
      return result.data;
    },
    onSuccess: () => {
      setConfirmDeleteMany(false);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["dash-organizations"] });
    },
  });

  const orgs =
    orgsQuery.data && "organizations" in orgsQuery.data
      ? orgsQuery.data.organizations
      : [];
  const total =
    orgsQuery.data && "total" in orgsQuery.data ? orgsQuery.data.total : 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);

  const allSelected = orgs.length > 0 && orgs.every((o) => selected.has(o.id));
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
    else setSelected(new Set(orgs.map((o) => o.id)));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <Box padding={6} data-testid="organizations-page">
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        paddingBottom={4}
      >
        <Box>
          <Typography variant="beta" textColor="neutral800">
            Organizations
          </Typography>
          <Box paddingTop={1}>
            <Typography variant="pi" textColor="neutral500">
              {total.toLocaleString()} total
            </Typography>
          </Box>
        </Box>
        <Button
          startIcon={<Plus />}
          onClick={() => setShowCreate(true)}
          data-testid="create-org-btn"
        >
          Create organization
        </Button>
      </Flex>

      <Flex gap={3} paddingBottom={4} alignItems="flex-end">
        <Box>
          <SearchForm onSubmit={handleSearch}>
            <Searchbar
              clearLabel="Clear"
              name="search"
              placeholder="Search organizations…"
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchInput(e.target.value)
              }
              onClear={() => {
                setSearchInput("");
                setSearch("");
                setPage(1);
              }}
            >
              Search organizations
            </Searchbar>
          </SearchForm>
        </Box>
        {someSelected && (
          <Button
            variant="danger-light"
            size="S"
            onClick={() => setConfirmDeleteMany(true)}
            data-testid="delete-selected-orgs-btn"
          >
            Delete {selected.size} selected
          </Button>
        )}
      </Flex>

      {orgsQuery.isError && (
        <Alert closeLabel="Close" title="Error" variant="danger">
          {orgsQuery.error instanceof Error
            ? orgsQuery.error.message
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
        {orgsQuery.isLoading ? (
          <Flex justifyContent="center" padding={8}>
            <Loader>Loading organizations…</Loader>
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
                <TH>Slug</TH>
                <TH>Members</TH>
                <TH>Created</TH>
                <THActions />
              </tr>
            </thead>
            <tbody>
              {orgs.length === 0 ? (
                <tr>
                  <TD
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#8e8ea9",
                    }}
                    data-testid="orgs-empty"
                  >
                    {search
                      ? `No organizations matching "${search}"`
                      : "No organizations found"}
                  </TD>
                </tr>
              ) : (
                orgs.map((org) => (
                  <TR
                    key={org.id}
                    $selected={selected.has(org.id)}
                    data-testid="org-row"
                  >
                    <TDCheck>
                      <Checkbox
                        checked={selected.has(org.id)}
                        onCheckedChange={() => toggleSelect(org.id)}
                        aria-label={`Select ${org.name}`}
                      />
                    </TDCheck>
                    <TD>
                      <Flex alignItems="center" gap={2}>
                        <OrgAvatar name={org.name} logo={org.logo} />
                        <Typography variant="omega" fontWeight="semiBold">
                          {org.name}
                        </Typography>
                      </Flex>
                    </TD>
                    <TD>
                      <Badge
                        backgroundColor="neutral100"
                        textColor="neutral600"
                      >
                        {org.slug}
                      </Badge>
                    </TD>
                    <TD>
                      <Typography variant="omega">{org.memberCount}</Typography>
                    </TD>
                    <TD>
                      <Typography variant="omega" textColor="neutral500">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </Typography>
                    </TD>
                    <TDActions>
                      <Flex gap={1} justifyContent="flex-end">
                        <IconButton
                          label="Edit organization"
                          onClick={() => setDetailOrgId(org.id)}
                          data-testid="edit-org-btn"
                        >
                          <Pencil />
                        </IconButton>
                        <IconButton
                          label="Delete organization"
                          onClick={() => setConfirmDelete(org.id)}
                          data-testid="delete-org-btn"
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
              disabled={page >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </Flex>
        </Flex>
      )}

      {showCreate && (
        <CreateOrganizationDialog
          teamsEnabled={teamsEnabled}
          onClose={() => setShowCreate(false)}
        />
      )}

      {detailOrgId && (
        <OrganizationDetail
          organizationId={detailOrgId}
          teamsEnabled={teamsEnabled}
          onClose={() => setDetailOrgId(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete organization"
          message="Are you sure you want to delete this organization? All members and teams will be removed. This action cannot be undone."
          confirmLabel="Delete"
          loading={deleteMutation.isLoading}
          onConfirm={() => deleteMutation.mutate(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmDeleteMany && (
        <ConfirmDialog
          title={`Delete ${selected.size} organization${selected.size !== 1 ? "s" : ""}`}
          message={`Are you sure you want to delete ${selected.size} organization${selected.size !== 1 ? "s" : ""}? This action cannot be undone.`}
          confirmLabel="Delete all"
          loading={deleteManyMutation.isLoading}
          onConfirm={() => deleteManyMutation.mutate([...selected])}
          onCancel={() => setConfirmDeleteMany(false)}
        />
      )}
    </Box>
  );
}
