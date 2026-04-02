import {
  Badge,
  Box,
  Button,
  Field,
  Flex,
  IconButton,
  Modal,
  Tabs,
  TextInput,
  Typography,
} from "@strapi/design-system";
import { Plus, Trash } from "@strapi/icons";
import type React from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { client } from "../../client";
import { UserCombobox } from "../../components/UserCombobox";
import { withContext } from "../../utils/dashContext";

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

  // Edit org state
  const [editName, setEditName] = useState<string | undefined>(undefined);
  const [editSlug, setEditSlug] = useState<string | undefined>(undefined);

  const updateOrgMutation = useMutation({
    mutationFn: async () => {
      const body: { name?: string; slug?: string } = {};
      if (editName !== undefined) body.name = editName;
      if (editSlug !== undefined) body.slug = editSlug;
      const result = await client.dash.organization.update(
        body,
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
    },
  });

  // Add member state
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

  // Teams
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
      qc.invalidateQueries({ queryKey: ["dash-org-teams", organizationId] });
    },
  });

  // SSO
  const deleteSsoMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const result = await client.dash.organization[
        organizationId as ":id"
      ].ssoProvider.delete({ providerId }, withContext({ organizationId }));
      if (result.error) throw new Error(result.error.message ?? "Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dash-org-sso", organizationId] });
    },
  });

  const org = orgQuery.data;
  const members = membersQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const ssoProviders = ssoQuery.data ?? [];

  const hasOrgEdits = editName !== undefined || editSlug !== undefined;

  return (
    <Modal.Root defaultOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Content>
        <Modal.Header>
          <Typography variant="beta" tag="h2">
            {org?.name ?? "Organization"}
          </Typography>
        </Modal.Header>

        <Modal.Body>
          {orgQuery.isLoading ? (
            <Typography>Loading…</Typography>
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
                <Tabs.Trigger value="members">
                  Members ({members.length})
                </Tabs.Trigger>
                {teamsEnabled && (
                  <Tabs.Trigger value="teams">
                    Teams ({teams.length})
                  </Tabs.Trigger>
                )}
                <Tabs.Trigger value="sso">
                  SSO ({ssoProviders.length})
                </Tabs.Trigger>
              </Tabs.List>

              {/* Details tab */}
              <Tabs.Content value="details">
                <Box paddingTop={4}>
                  <Flex direction="column" gap={4}>
                    <Field.Root>
                      <Field.Label>Name</Field.Label>
                      <TextInput
                        value={editName ?? org?.name ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditName(e.target.value)
                        }
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Slug</Field.Label>
                      <TextInput
                        value={editSlug ?? org?.slug ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditSlug(e.target.value)
                        }
                      />
                    </Field.Root>
                    <Flex gap={2}>
                      <Typography variant="pi" textColor="neutral500">
                        Members:
                      </Typography>
                      <Typography variant="pi">
                        {org?.memberCount ?? 0}
                      </Typography>
                    </Flex>
                    <Flex gap={2}>
                      <Typography variant="pi" textColor="neutral500">
                        Created:
                      </Typography>
                      <Typography variant="pi">
                        {org?.createdAt
                          ? new Date(org.createdAt).toLocaleDateString()
                          : "—"}
                      </Typography>
                    </Flex>

                    {updateOrgMutation.isError && (
                      <Typography textColor="danger600" variant="pi">
                        {updateOrgMutation.error instanceof Error
                          ? updateOrgMutation.error.message
                          : "An error occurred"}
                      </Typography>
                    )}

                    <Flex gap={2}>
                      <Button
                        disabled={!hasOrgEdits}
                        loading={updateOrgMutation.isLoading}
                        onClick={() => updateOrgMutation.mutate()}
                      >
                        Save changes
                      </Button>
                      {hasOrgEdits && (
                        <Button
                          variant="tertiary"
                          onClick={() => {
                            setEditName(undefined);
                            setEditSlug(undefined);
                          }}
                        >
                          Discard
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                </Box>
              </Tabs.Content>

              {/* Members tab */}
              <Tabs.Content value="members">
                <Box paddingTop={4}>
                  <Flex direction="column" gap={4}>
                    {/* Add member */}
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
                      <Flex direction="column" gap={3}>
                        <UserCombobox
                          label="User"
                          value={addUserId}
                          onChange={setAddUserId}
                        />
                        <Field.Root hint="e.g. member, admin, owner">
                          <Field.Label>Role</Field.Label>
                          <TextInput
                            value={addRole}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => setAddRole(e.target.value)}
                          />
                          <Field.Hint />
                        </Field.Root>
                        {addMemberMutation.isError && (
                          <Typography textColor="danger600" variant="pi">
                            {addMemberMutation.error instanceof Error
                              ? addMemberMutation.error.message
                              : "An error occurred"}
                          </Typography>
                        )}
                        <Button
                          size="S"
                          startIcon={<Plus />}
                          disabled={!addUserId}
                          loading={addMemberMutation.isLoading}
                          onClick={() => addMemberMutation.mutate()}
                        >
                          Add
                        </Button>
                      </Flex>
                    </Box>

                    {/* Members list */}
                    {membersQuery.isLoading ? (
                      <Typography>Loading…</Typography>
                    ) : members.length === 0 ? (
                      <Typography textColor="neutral500">
                        No members yet
                      </Typography>
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
                        >
                          <Flex
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Flex direction="column" gap={1}>
                              <Typography variant="omega" fontWeight="semiBold">
                                {member.user?.name ?? "Unknown"}
                              </Typography>
                              <Typography variant="pi" textColor="neutral500">
                                {member.user?.email}
                              </Typography>
                            </Flex>
                            <Flex gap={2} alignItems="center">
                              <Badge
                                backgroundColor="neutral100"
                                textColor="neutral600"
                              >
                                {member.role}
                              </Badge>
                              <IconButton
                                label="Remove member"
                                onClick={() =>
                                  removeMemberMutation.mutate(member.id)
                                }
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
                  <Box paddingTop={4}>
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
                          <Box>
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
                        <Typography>Loading…</Typography>
                      ) : teams.length === 0 ? (
                        <Typography textColor="neutral500">
                          No teams yet
                        </Typography>
                      ) : (
                        teams.map((team) => (
                          <TeamRow
                            key={team.id}
                            team={team}
                            organizationId={organizationId}
                            members={members}
                            onDelete={() => deleteTeamMutation.mutate(team.id)}
                          />
                        ))
                      )}
                    </Flex>
                  </Box>
                </Tabs.Content>
              )}

              {/* SSO tab */}
              <Tabs.Content value="sso">
                <Box paddingTop={4}>
                  <Flex direction="column" gap={4}>
                    {ssoQuery.isLoading ? (
                      <Typography>Loading…</Typography>
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
                        >
                          <Flex
                            justifyContent="space-between"
                            alignItems="center"
                          >
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
                                deleteSsoMutation.mutate(provider.providerId)
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
        </Modal.Body>

        <Modal.Footer>
          <Button variant="tertiary" onClick={onClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}

function TeamRow({
  team,
  organizationId,
  members,
  onDelete,
}: {
  team: { id: string; name: string; organizationId: string; createdAt: Date };
  organizationId: string;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      email: string;
      name: string;
      image: string | null;
    } | null;
  }>;
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

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
          borderWidth="1px"
        >
          <Flex direction="column" gap={3}>
            {/* Add team member */}
            <Flex gap={2} alignItems="flex-end">
              <Box>
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

            {/* Team members list */}
            {teamMembersQuery.isLoading ? (
              <Typography variant="pi" textColor="neutral500">
                Loading…
              </Typography>
            ) : (teamMembersQuery.data ?? []).length === 0 ? (
              <Typography variant="pi" textColor="neutral500">
                No members in this team
              </Typography>
            ) : (
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
                    onClick={() => removeTeamMemberMutation.mutate(tm.userId)}
                  >
                    <Trash />
                  </IconButton>
                </Flex>
              ))
            )}
          </Flex>
        </Box>
      )}
    </Box>
  );
}
