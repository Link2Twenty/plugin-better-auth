import {
  Box,
  Button,
  Field,
  Flex,
  Grid,
  IconButton,
  SingleSelect,
  SingleSelectOption,
  Tabs,
  TextInput,
  Typography,
} from "@strapi/design-system";
import { Plus, Trash } from "@strapi/icons";
import type React from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { client } from "../../client";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Drawer } from "../../components/Drawer";
import { CustomFieldsSection } from "../../components/DynamicField";
import { UserCombobox } from "../../components/UserCombobox";
import { useModelSchema } from "../../hooks/useModelSchema";
import { withContext } from "../../utils/dashContext";

const STANDARD_ORG_FIELDS = new Set([
  "id",
  "name",
  "slug",
  "logo",
  "metadata",
  "memberCount",
  "createdAt",
  "updatedAt",
]);

interface Props {
  organizationId: string;
  teamsEnabled: boolean;
  onClose: () => void;
}

export function OrganizationDetail({
  organizationId,
  teamsEnabled,
  onClose,
}: Props) {
  const schemaQuery = useModelSchema("organization");
  const qc = useQueryClient();

  const orgQuery = useQuery({
    queryKey: ["dash-org", organizationId],
    queryFn: async () => {
      const result = await client.dash.organization[organizationId as ":id"](
        {},
        withContext({ organizationId }),
      );
      if (result.error)
        throw new Error(result.error.message ?? "Failed to load org");
      return result.data;
    },
  });

  const membersQuery = useQuery({
    queryKey: ["dash-org-members", organizationId],
    queryFn: async () => {
      const result = await client.dash.organization[
        organizationId as ":id"
      ].members({}, withContext({ organizationId }));
      if (result.error) throw new Error(result.error.message ?? "Failed");
      return result.data ?? [];
    },
  });

  const teamsQuery = useQuery({
    queryKey: ["dash-org-teams", organizationId],
    queryFn: async () => {
      if (!teamsEnabled) return [];
      const result = await client.dash.organization[
        organizationId as ":id"
      ].teams({}, withContext({ organizationId }));
      if (result.error) throw new Error(result.error.message ?? "Failed");
      return (result.data ?? []) as Array<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt?: Date;
      }>;
    },
    enabled: teamsEnabled,
  });

  const ssoQuery = useQuery({
    queryKey: ["dash-org-sso", organizationId],
    queryFn: async () => {
      const result = await client.dash.organization[
        organizationId as ":id"
      ].ssoProviders({}, withContext({ organizationId }));
      if (result.error) throw new Error(result.error.message ?? "Failed");
      return result.data ?? [];
    },
  });

  const [editName, setEditName] = useState<string | undefined>(undefined);
  const [editSlug, setEditSlug] = useState<string | undefined>(undefined);
  const [editExtra, setEditExtra] = useState<Record<string, unknown>>({});
  const [confirmRemoveMemberId, setConfirmRemoveMemberId] = useState<string | null>(null);
  const [confirmDeleteTeamId, setConfirmDeleteTeamId] = useState<string | null>(null);
  const [confirmDeleteSsoId, setConfirmDeleteSsoId] = useState<string | null>(null);

  const handleExtraChange = (name: string, value: unknown) => {
    setEditExtra((prev) => ({ ...prev, [name]: value }));
  };

  const org = orgQuery.data;
  const extraData: Record<string, unknown> = {
    ...(org as Record<string, unknown> | undefined),
    ...editExtra,
  };

  const updateOrgMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { ...editExtra };
      if (editName !== undefined) body.name = editName;
      if (editSlug !== undefined) body.slug = editSlug;
      const result = await client.dash.organization.update(
        body as never,
        withContext({ organizationId }),
      );
      if (result.error)
        throw new Error(result.error.message ?? "Update failed");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dash-org", organizationId] });
      qc.invalidateQueries({ queryKey: ["dash-organizations"] });
      setEditName(undefined);
      setEditSlug(undefined);
      setEditExtra({});
    },
  });

  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState("member");

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      const result = await client.dash.organization.addMember(
        { userId: addUserId, role: addRole },
        withContext({ organizationId }),
      );
      if (result.error)
        throw new Error(result.error.message ?? "Add member failed");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dash-org-members", organizationId] });
      setAddUserId("");
      setAddRole("member");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const result = await client.dash.organization.removeMember(
        { memberId },
        withContext({ organizationId }),
      );
      if (result.error) throw new Error(result.error.message ?? "Failed");
    },
    onSuccess: () => {
      setConfirmRemoveMemberId(null);
      qc.invalidateQueries({ queryKey: ["dash-org-members", organizationId] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: string;
    }) => {
      const result = await client.dash.organization.updateMemberRole(
        { memberId, role },
        withContext({ organizationId }),
      );
      if (result.error) throw new Error(result.error.message ?? "Failed");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dash-org-members", organizationId] });
    },
  });

  const [newTeamName, setNewTeamName] = useState("");

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const result = await client.dash.organization.createTeam(
        { name: newTeamName },
        withContext({ organizationId }),
      );
      if (result.error)
        throw new Error(result.error.message ?? "Create team failed");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dash-org-teams", organizationId] });
      setNewTeamName("");
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const result = await client.dash.organization.deleteTeam(
        { teamId },
        withContext({ organizationId }),
      );
      if (result.error) throw new Error(result.error.message ?? "Failed");
    },
    onSuccess: () => {
      setConfirmDeleteTeamId(null);
      qc.invalidateQueries({ queryKey: ["dash-org-teams", organizationId] });
    },
  });

  const deleteSsoMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const result = await client.dash.organization[
        organizationId as ":id"
      ].ssoProvider.delete({ providerId }, withContext({ organizationId }));
      if (result.error) throw new Error(result.error.message ?? "Failed");
    },
    onSuccess: () => {
      setConfirmDeleteSsoId(null);
      qc.invalidateQueries({ queryKey: ["dash-org-sso", organizationId] });
    },
  });

  const members = membersQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const ssoProviders = ssoQuery.data ?? [];

  const hasOrgEdits =
    editName !== undefined ||
    editSlug !== undefined ||
    Object.keys(editExtra).length > 0;

  const customFields = Object.entries(schemaQuery.data ?? {})
    .filter(([name]) => !STANDARD_ORG_FIELDS.has(name))
    .map(([name, attribute]) => ({ name, attribute }));

  return (
    <Drawer
      title={org?.name ?? "Organization"}
      onClose={onClose}
      data-testid="org-detail-drawer"
    >
      {orgQuery.isLoading ? (
        <Typography textColor="neutral500">Loading…</Typography>
      ) : orgQuery.isError ? (
        <Typography textColor="danger600">
          {orgQuery.error instanceof Error
            ? orgQuery.error.message
            : "An error occurred"}
        </Typography>
      ) : (
        <Tabs.Root defaultValue="details">
          <Tabs.List>
            <Tabs.Trigger value="details">Details</Tabs.Trigger>
            <Tabs.Trigger value="members" data-testid="org-members-tab">
              Members ({members.length})
            </Tabs.Trigger>
            {teamsEnabled && (
              <Tabs.Trigger value="teams">Teams ({teams.length})</Tabs.Trigger>
            )}
            <Tabs.Trigger value="sso">SSO ({ssoProviders.length})</Tabs.Trigger>
          </Tabs.List>

          {/* Details tab */}
          <Tabs.Content value="details">
            <Box paddingTop={6}>
              {/* Editable fields */}
              <Grid.Root gap={4}>
                <Grid.Item col={6}>
                  <Field.Root style={{ width: "100%" }}>
                    <Field.Label>Name</Field.Label>
                    <TextInput
                      value={editName ?? org?.name ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditName(e.target.value)
                      }
                      data-testid="org-name-input"
                    />
                  </Field.Root>
                </Grid.Item>
                <Grid.Item col={6}>
                  <Field.Root
                    hint="URL-safe identifier"
                    style={{ width: "100%" }}
                  >
                    <Field.Label>Slug</Field.Label>
                    <TextInput
                      value={editSlug ?? org?.slug ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditSlug(e.target.value)
                      }
                      data-testid="org-slug-input"
                    />
                    <Field.Hint />
                  </Field.Root>
                </Grid.Item>
              </Grid.Root>

              {/* Custom fields */}
              <CustomFieldsSection
                fields={customFields}
                data={extraData}
                onChange={handleExtraChange}
              />

              {updateOrgMutation.isError && (
                <Typography textColor="danger600" variant="pi" paddingTop={3}>
                  {updateOrgMutation.error instanceof Error
                    ? updateOrgMutation.error.message
                    : "An error occurred"}
                </Typography>
              )}

              <Flex gap={2} paddingTop={4}>
                <Button
                  disabled={!hasOrgEdits}
                  loading={updateOrgMutation.isLoading}
                  onClick={() => updateOrgMutation.mutate()}
                  data-testid="save-org-btn"
                >
                  Save changes
                </Button>
                {hasOrgEdits && (
                  <Button
                    variant="tertiary"
                    onClick={() => {
                      setEditName(undefined);
                      setEditSlug(undefined);
                      setEditExtra({});
                    }}
                  >
                    Discard
                  </Button>
                )}
              </Flex>

              {/* Read-only metadata */}
              <Box
                paddingTop={6}
                marginTop={4}
                borderColor="neutral150"
                borderStyle="solid"
                borderWidth="1px 0 0 0"
              >
                <Typography
                  variant="sigma"
                  textColor="neutral600"
                  paddingBottom={4}
                >
                  Details
                </Typography>
                <Grid.Root gap={4}>
                  <Grid.Item col={12}>
                    <Flex direction="column" gap={1}>
                      <Typography variant="pi" textColor="neutral500">
                        Organization ID
                      </Typography>
                      <Typography
                        variant="omega"
                        textColor="neutral600"
                        style={{
                          fontFamily: "monospace",
                          wordBreak: "break-all",
                        }}
                      >
                        {org?.id}
                      </Typography>
                    </Flex>
                  </Grid.Item>
                  <Grid.Item col={4}>
                    <Flex direction="column" gap={1}>
                      <Typography variant="pi" textColor="neutral500">
                        Members
                      </Typography>
                      <Typography variant="omega">
                        {org?.memberCount ?? 0}
                      </Typography>
                    </Flex>
                  </Grid.Item>
                  <Grid.Item col={4}>
                    <Flex direction="column" gap={1}>
                      <Typography variant="pi" textColor="neutral500">
                        Created
                      </Typography>
                      <Typography variant="omega">
                        {org?.createdAt
                          ? new Date(org.createdAt).toLocaleDateString()
                          : "—"}
                      </Typography>
                    </Flex>
                  </Grid.Item>
                </Grid.Root>
              </Box>
            </Box>
          </Tabs.Content>

          {/* Members tab */}
          <Tabs.Content value="members">
            <Box paddingTop={6}>
              <Flex direction="column" gap={4}>
                <Box
                  background="neutral50"
                  padding={4}
                  hasRadius
                  borderColor="neutral150"
                  borderStyle="solid"
                  borderWidth="1px"
                >
                  <Typography
                    variant="sigma"
                    textColor="neutral600"
                    paddingBottom={3}
                  >
                    Add member
                  </Typography>
                  <Grid.Root gap={3}>
                    <Grid.Item col={8}>
                      <UserCombobox
                        label="User"
                        value={addUserId}
                        onChange={setAddUserId}
                      />
                    </Grid.Item>
                    <Grid.Item col={4}>
                      <Field.Root>
                        <Field.Label>Role</Field.Label>
                        <SingleSelect
                          value={addRole}
                          onChange={(role: string | number) =>
                            setAddRole(String(role))
                          }
                          aria-label="Member role"
                        >
                          <SingleSelectOption value="member">
                            Member
                          </SingleSelectOption>
                          <SingleSelectOption value="admin">
                            Admin
                          </SingleSelectOption>
                          <SingleSelectOption value="owner">
                            Owner
                          </SingleSelectOption>
                        </SingleSelect>
                      </Field.Root>
                    </Grid.Item>
                  </Grid.Root>
                  {addMemberMutation.isError && (
                    <Typography
                      textColor="danger600"
                      variant="pi"
                      paddingTop={2}
                    >
                      {addMemberMutation.error instanceof Error
                        ? addMemberMutation.error.message
                        : "An error occurred"}
                    </Typography>
                  )}
                  <Box paddingTop={3}>
                    <Button
                      size="S"
                      startIcon={<Plus />}
                      disabled={!addUserId}
                      loading={addMemberMutation.isLoading}
                      onClick={() => addMemberMutation.mutate()}
                      data-testid="add-member-btn"
                    >
                      Add member
                    </Button>
                  </Box>
                </Box>

                {membersQuery.isLoading ? (
                  <Typography textColor="neutral500">Loading…</Typography>
                ) : members.length === 0 ? (
                  <Typography textColor="neutral500">No members yet</Typography>
                ) : (
                  members.map((member) => (
                    <Box
                      key={member.id}
                      padding={3}
                      background="neutral0"
                      hasRadius
                      borderColor="neutral150"
                      borderStyle="solid"
                      borderWidth="1px"
                      data-testid="member-row"
                    >
                      <Flex justifyContent="space-between" alignItems="center">
                        <Flex direction="column" gap={1}>
                          <Typography variant="omega" fontWeight="semiBold">
                            {member.user?.name ?? "Unknown"}
                          </Typography>
                          <Typography variant="pi" textColor="neutral500">
                            {member.user?.email}
                          </Typography>
                        </Flex>
                        <Flex gap={2} alignItems="center">
                          <Field.Root>
                            <SingleSelect
                              value={member.role}
                              onChange={(role: string | number) =>
                                updateRoleMutation.mutate({
                                  memberId: member.id,
                                  role: String(role),
                                })
                              }
                              size="S"
                              aria-label="Member role"
                            >
                              <SingleSelectOption value="member">
                                Member
                              </SingleSelectOption>
                              <SingleSelectOption value="admin">
                                Admin
                              </SingleSelectOption>
                              <SingleSelectOption value="owner">
                                Owner
                              </SingleSelectOption>
                            </SingleSelect>
                          </Field.Root>
                          <IconButton
                            label="Remove member"
                            onClick={() =>
                              setConfirmRemoveMemberId(member.id)
                            }
                            data-testid="remove-member-btn"
                          >
                            <Trash />
                          </IconButton>
                        </Flex>
                      </Flex>
                    </Box>
                  ))
                )}
              </Flex>
            </Box>
          </Tabs.Content>

          {/* Teams tab */}
          {teamsEnabled && (
            <Tabs.Content value="teams">
              <Box paddingTop={6}>
                <Flex direction="column" gap={4}>
                  <Box
                    background="neutral50"
                    padding={4}
                    hasRadius
                    borderColor="neutral150"
                    borderStyle="solid"
                    borderWidth="1px"
                  >
                    <Typography
                      variant="sigma"
                      textColor="neutral600"
                      paddingBottom={3}
                    >
                      Create team
                    </Typography>
                    <Flex gap={2} alignItems="flex-end">
                      <Box style={{ flex: 1 }}>
                        <Field.Root>
                          <Field.Label>Team name</Field.Label>
                          <TextInput
                            value={newTeamName}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => setNewTeamName(e.target.value)}
                          />
                        </Field.Root>
                      </Box>
                      <Button
                        startIcon={<Plus />}
                        disabled={!newTeamName}
                        loading={createTeamMutation.isLoading}
                        onClick={() => createTeamMutation.mutate()}
                      >
                        Create
                      </Button>
                    </Flex>
                  </Box>

                  {teamsQuery.isLoading ? (
                    <Typography textColor="neutral500">Loading…</Typography>
                  ) : teams.length === 0 ? (
                    <Typography textColor="neutral500">No teams yet</Typography>
                  ) : (
                    teams.map((team) => (
                      <TeamRow
                        key={team.id}
                        team={team}
                        organizationId={organizationId}
                        onDelete={() => setConfirmDeleteTeamId(team.id)}
                      />
                    ))
                  )}
                </Flex>
              </Box>
            </Tabs.Content>
          )}

          {/* SSO tab */}
          <Tabs.Content value="sso">
            <Box paddingTop={6}>
              <Flex direction="column" gap={4}>
                {ssoQuery.isLoading ? (
                  <Typography textColor="neutral500">Loading…</Typography>
                ) : ssoProviders.length === 0 ? (
                  <Typography textColor="neutral500">
                    No SSO providers configured.
                  </Typography>
                ) : (
                  ssoProviders.map((provider) => (
                    <Box
                      key={provider.id}
                      padding={3}
                      background="neutral0"
                      hasRadius
                      borderColor="neutral150"
                      borderStyle="solid"
                      borderWidth="1px"
                      data-testid="sso-provider-row"
                    >
                      <Flex justifyContent="space-between" alignItems="center">
                        <Flex direction="column" gap={1}>
                          <Typography variant="omega" fontWeight="semiBold">
                            {provider.providerId}
                          </Typography>
                          <Typography variant="pi" textColor="neutral500">
                            {provider.domain}
                          </Typography>
                          <Typography variant="pi" textColor="neutral500">
                            Issuer: {provider.issuer}
                          </Typography>
                        </Flex>
                        <IconButton
                          label="Delete SSO provider"
                          onClick={() =>
                            setConfirmDeleteSsoId(provider.providerId)
                          }
                        >
                          <Trash />
                        </IconButton>
                      </Flex>
                    </Box>
                  ))
                )}
              </Flex>
            </Box>
          </Tabs.Content>
        </Tabs.Root>
      )}

      {confirmRemoveMemberId && (
        <ConfirmDialog
          title="Remove member"
          message="Are you sure you want to remove this member from the organization?"
          confirmLabel="Remove"
          loading={removeMemberMutation.isLoading}
          onConfirm={() => removeMemberMutation.mutate(confirmRemoveMemberId)}
          onCancel={() => setConfirmRemoveMemberId(null)}
        />
      )}

      {confirmDeleteTeamId && (
        <ConfirmDialog
          title="Delete team"
          message="Are you sure you want to delete this team? All team members will be removed. This action cannot be undone."
          confirmLabel="Delete"
          loading={deleteTeamMutation.isLoading}
          onConfirm={() => deleteTeamMutation.mutate(confirmDeleteTeamId)}
          onCancel={() => setConfirmDeleteTeamId(null)}
        />
      )}

      {confirmDeleteSsoId && (
        <ConfirmDialog
          title="Delete SSO provider"
          message="Are you sure you want to delete this SSO provider? Members using this provider will need to authenticate differently."
          confirmLabel="Delete"
          loading={deleteSsoMutation.isLoading}
          onConfirm={() => deleteSsoMutation.mutate(confirmDeleteSsoId)}
          onCancel={() => setConfirmDeleteSsoId(null)}
        />
      )}
    </Drawer>
  );
}

function TeamRow({
  team,
  organizationId,
  onDelete,
}: {
  team: { id: string; name: string; organizationId: string; createdAt: Date };
  organizationId: string;
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [confirmRemoveTeamMemberId, setConfirmRemoveTeamMemberId] = useState<string | null>(null);

  const teamMembersQuery = useQuery({
    queryKey: ["dash-team-members", organizationId, team.id],
    queryFn: async () => {
      const result = await client.dash.organization[
        // @ts-expect-error
        organizationId as ":orgId"
      ].teams[team.id as ":teamId"].members(
        { params: { orgId: organizationId, teamId: team.id } },
        withContext({ organizationId }),
      );
      if (result.error) throw new Error(result.error.message ?? "Failed");
      return result.data ?? [];
    },
    enabled: expanded,
  });

  const [addUserId, setAddUserId] = useState("");

  const addTeamMemberMutation = useMutation({
    mutationFn: async () => {
      const result = await client.dash.organization.addTeamMember(
        { teamId: team.id, userId: addUserId },
        withContext({ organizationId }),
      );
      if (result.error) throw new Error(result.error.message ?? "Failed");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["dash-team-members", organizationId, team.id],
      });
      setAddUserId("");
    },
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await client.dash.organization.removeTeamMember(
        { teamId: team.id, userId },
        withContext({ organizationId }),
      );
      if (result.error) throw new Error(result.error.message ?? "Failed");
    },
    onSuccess: () => {
      setConfirmRemoveTeamMemberId(null);
      qc.invalidateQueries({
        queryKey: ["dash-team-members", organizationId, team.id],
      });
    },
  });

  return (
    <Box
      background="neutral0"
      hasRadius
      borderColor="neutral150"
      borderStyle="solid"
      borderWidth="1px"
      data-testid="team-row"
    >
      <Flex
        padding={3}
        justifyContent="space-between"
        alignItems="center"
        style={{ cursor: "pointer" }}
        onClick={() => setExpanded((e) => !e)}
      >
        <Typography variant="omega" fontWeight="semiBold">
          {team.name}
        </Typography>
        <Flex gap={2} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <IconButton label="Delete team" onClick={onDelete}>
            <Trash />
          </IconButton>
        </Flex>
      </Flex>

      {expanded && (
        <Box
          padding={3}
          borderColor="neutral150"
          borderStyle="solid"
          borderWidth="1px 0 0 0"
        >
          <Flex direction="column" gap={3}>
            <Flex gap={2} alignItems="flex-end">
              <Box style={{ flex: 1 }}>
                <UserCombobox
                  label="Add member to team"
                  value={addUserId}
                  onChange={setAddUserId}
                />
              </Box>
              <Button
                size="S"
                startIcon={<Plus />}
                disabled={!addUserId}
                loading={addTeamMemberMutation.isLoading}
                onClick={() => addTeamMemberMutation.mutate()}
              >
                Add
              </Button>
            </Flex>

            {teamMembersQuery.isLoading ? (
              <Typography variant="pi" textColor="neutral500">
                Loading…
              </Typography>
            ) : (teamMembersQuery.data ?? []).length === 0 ? (
              <Typography variant="pi" textColor="neutral500">
                No members in this team
              </Typography>
            ) : (
              // biome-ignore lint/suspicious/noExplicitAny: team member shape varies by config
              (teamMembersQuery.data ?? []).map((tm: any) => (
                <Flex
                  key={tm.id}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="pi">
                    {tm.user?.name ?? tm.userId}
                    {tm.user?.email ? ` — ${tm.user.email}` : ""}
                  </Typography>
                  <IconButton
                    label="Remove from team"
                    onClick={() =>
                      setConfirmRemoveTeamMemberId(tm.userId)
                    }
                  >
                    <Trash />
                  </IconButton>
                </Flex>
              ))
            )}
          </Flex>
        </Box>
      )}

      {confirmRemoveTeamMemberId && (
        <ConfirmDialog
          title="Remove from team"
          message="Are you sure you want to remove this member from the team?"
          confirmLabel="Remove"
          loading={removeTeamMemberMutation.isLoading}
          onConfirm={() =>
            removeTeamMemberMutation.mutate(confirmRemoveTeamMemberId)
          }
          onCancel={() => setConfirmRemoveTeamMemberId(null)}
        />
      )}
    </Box>
  );
}
