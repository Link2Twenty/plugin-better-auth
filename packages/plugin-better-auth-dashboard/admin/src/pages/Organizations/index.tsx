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
import { client } from "../../client";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { withContext } from "../../utils/dashContext";
import { CreateOrganizationDialog } from "./CreateOrganizationDialog";
import { OrganizationDetail } from "./OrganizationDetail";

const PAGE_SIZE = 25;

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
          <Typography variant="pi" textColor="neutral500" paddingTop={1}>
            {total} total
          </Typography>
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
      >
        {orgsQuery.isLoading ? (
          <Flex justifyContent="center" padding={8}>
            <Loader>Loading organizations…</Loader>
          </Flex>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #dcdce4",
                    width: 40,
                  }}
                >
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                {["Name", "Slug", "Members", "Created", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      borderBottom: "1px solid #dcdce4",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#666687",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orgs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      color: "#666687",
                    }}
                    data-testid="orgs-empty"
                  >
                    No organizations found
                  </td>
                </tr>
              ) : (
                orgs.map((org) => (
                  <tr
                    key={org.id}
                    data-testid="org-row"
                    style={{
                      background: selected.has(org.id) ? "#f0f0ff" : "inherit",
                    }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <Checkbox
                        checked={selected.has(org.id)}
                        onCheckedChange={() => toggleSelect(org.id)}
                        aria-label={`Select ${org.name}`}
                      />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Flex alignItems="center" gap={2}>
                        {org.logo && (
                          <Box
                            tag="img"
                            src={org.logo}
                            alt=""
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 4,
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <Typography variant="omega" fontWeight="semiBold">
                          {org.name}
                        </Typography>
                      </Flex>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge
                        backgroundColor="neutral100"
                        textColor="neutral600"
                      >
                        {org.slug}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Typography variant="omega">{org.memberCount}</Typography>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Typography variant="omega" textColor="neutral500">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </Typography>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
