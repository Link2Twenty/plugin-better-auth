import {
  Box,
  Button,
  Dialog,
  EmptyStateLayout,
  Field,
  Flex,
  IconButton,
  SingleSelect,
  SingleSelectOption,
  Table,
  Tabs,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Typography,
  TextInput,
} from "@strapi/design-system";
import { ArrowLeft, Plus, Trash } from "@strapi/icons";
import { useNotification } from "@strapi/strapi/admin";
import { useState } from "react";
import { useIntl } from "react-intl";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { client } from "../../client";

const PLUGIN_ID = "better-auth-dashboard";

interface Props {
  orgId: string;
  onBack: () => void;
}

function InviteMemberDialog({
  orgId,
  onClose,
}: {
  orgId: string;
  onClose: () => void;
}) {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const mutation = useMutation(
    async () => {
      // organizationId is included so the Strapi proxy can add it to the JWT.
      // The inviteMember middleware reads organizationId from the JWT payload.
      const inviteBody = { email, role, invitedBy: "admin", organizationId: orgId };
      const result = await client.dash.organization.inviteMember(inviteBody);
      if (result.error) throw new Error(result.error.message ?? "Failed to send invitation");
      return result.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([PLUGIN_ID, "org-invitations", orgId]);
        toggleNotification({
          type: "success",
          message: formatMessage({
            id: `${PLUGIN_ID}.org.invite.success`,
            defaultMessage: "Invitation sent",
          }),
        });
        onClose();
      },
      onError: () => {
        toggleNotification({
          type: "danger",
          message: formatMessage({
            id: `${PLUGIN_ID}.org.invite.error`,
            defaultMessage: "Failed to send invitation",
          }),
        });
      },
    },
  );

  return (
    <Dialog.Root defaultOpen onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content>
        <Dialog.Header>
          {formatMessage({
            id: `${PLUGIN_ID}.org.invite.title`,
            defaultMessage: "Invite member",
          })}
        </Dialog.Header>
        <Dialog.Body>
          <form
            id="invite-member-form"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <Flex direction="column" gap={4}>
              <Field.Root required>
                <Field.Label>
                  {formatMessage({ id: "global.email", defaultMessage: "Email" })}
                </Field.Label>
                <TextInput
                  type="email"
                  placeholder="member@example.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>
                  {formatMessage({ id: `${PLUGIN_ID}.org.member.role`, defaultMessage: "Role" })}
                </Field.Label>
                <SingleSelect value={role} onChange={(val: string | number) => setRole(String(val))}>
                  <SingleSelectOption value="owner">Owner</SingleSelectOption>
                  <SingleSelectOption value="admin">Admin</SingleSelectOption>
                  <SingleSelectOption value="member">Member</SingleSelectOption>
                </SingleSelect>
              </Field.Root>
            </Flex>
          </form>
        </Dialog.Body>
        <Dialog.Footer>
          <Button variant="tertiary" onClick={onClose}>
            {formatMessage({ id: "app.components.Button.cancel", defaultMessage: "Cancel" })}
          </Button>
          <Button
            type="submit"
            form="invite-member-form"
            loading={mutation.isLoading}
            disabled={!email.trim() || mutation.isLoading}
          >
            {formatMessage({
              id: `${PLUGIN_ID}.org.invite.submit`,
              defaultMessage: "Send invitation",
            })}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}

export const OrganizationDetail = ({ orgId, onBack }: Props) => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const queryClient = useQueryClient();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<string | null>(null);
  const [editingMemberRole, setEditingMemberRole] = useState<{
    memberId: string;
    role: string;
  } | null>(null);

  const { data: members, isLoading: membersLoading } = useQuery(
    [PLUGIN_ID, "org-members", orgId],
    async () => {
      const result = await client.dash.organization[orgId as ':id'].members();
      if (result.error) throw new Error(result.error.message ?? "Failed to load members");
      return result.data;
    },
  );

  const { data: invitations, isLoading: invitationsLoading } = useQuery(
    [PLUGIN_ID, "org-invitations", orgId],
    async () => {
      const result = await client.dash.organization[orgId as ':id'].invitations();
      if (result.error) throw new Error(result.error.message ?? "Failed to load invitations");
      return result.data;
    },
  );

  const removeMemberMutation = useMutation(
    async (memberId: string) => {
      // organizationId is passed for the proxy to include in the JWT;
      // the removeMember middleware reads organizationId from the JWT payload.
      const removeBody = { memberId, organizationId: orgId };
      const result = await client.dash.organization.removeMember(removeBody);
      if (result.error) throw new Error(result.error.message ?? "Failed to remove member");
      return result.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([PLUGIN_ID, "org-members", orgId]);
        queryClient.invalidateQueries([PLUGIN_ID, "organizations"]);
        setConfirmRemoveMember(null);
        toggleNotification({
          type: "success",
          message: formatMessage({
            id: `${PLUGIN_ID}.org.member.remove.success`,
            defaultMessage: "Member removed",
          }),
        });
      },
      onError: () => {
        toggleNotification({
          type: "danger",
          message: formatMessage({
            id: `${PLUGIN_ID}.org.member.remove.error`,
            defaultMessage: "Failed to remove member",
          }),
        });
      },
    },
  );

  const updateRoleMutation = useMutation(
    async ({ memberId, role }: { memberId: string; role: string }) => {
      const updateBody = { memberId, role, organizationId: orgId };
      const result = await client.dash.organization.updateMemberRole(updateBody);
      if (result.error) throw new Error(result.error.message ?? "Failed to update role");
      return result.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([PLUGIN_ID, "org-members", orgId]);
        setEditingMemberRole(null);
        toggleNotification({
          type: "success",
          message: formatMessage({
            id: `${PLUGIN_ID}.org.member.role.success`,
            defaultMessage: "Role updated",
          }),
        });
      },
      onError: () => {
        toggleNotification({
          type: "danger",
          message: formatMessage({
            id: `${PLUGIN_ID}.org.member.role.error`,
            defaultMessage: "Failed to update role",
          }),
        });
      },
    },
  );

  const cancelInvitationMutation = useMutation(
    async (invitationId: string) => {
      const cancelBody = { invitationId, organizationId: orgId };
      const result = await client.dash.organization.cancelInvitation(cancelBody);
      if (result.error) throw new Error(result.error.message ?? "Failed to cancel invitation");
      return result.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([PLUGIN_ID, "org-invitations", orgId]);
        toggleNotification({
          type: "success",
          message: formatMessage({
            id: `${PLUGIN_ID}.org.invitation.cancel.success`,
            defaultMessage: "Invitation cancelled",
          }),
        });
      },
      onError: () => {
        toggleNotification({
          type: "danger",
          message: formatMessage({
            id: `${PLUGIN_ID}.org.invitation.cancel.error`,
            defaultMessage: "Failed to cancel invitation",
          }),
        });
      },
    },
  );

  const resendInvitationMutation = useMutation(
    async (invitationId: string) => {
      const resendBody = { invitationId, organizationId: orgId };
      const result = await client.dash.organization.resendInvitation(resendBody);
      if (result.error) throw new Error(result.error.message ?? "Failed to resend invitation");
      return result.data;
    },
    {
      onSuccess: () => {
        toggleNotification({
          type: "success",
          message: formatMessage({
            id: `${PLUGIN_ID}.org.invitation.resend.success`,
            defaultMessage: "Invitation resent",
          }),
        });
      },
      onError: () => {
        toggleNotification({
          type: "danger",
          message: formatMessage({
            id: `${PLUGIN_ID}.org.invitation.resend.error`,
            defaultMessage: "Failed to resend invitation",
          }),
        });
      },
    },
  );

  return (
    <>
      <Box marginBottom={4}>
        <Button
          variant="tertiary"
          startIcon={<ArrowLeft />}
          onClick={onBack}
          size="S"
        >
          {formatMessage({
            id: `${PLUGIN_ID}.org.detail.back`,
            defaultMessage: "Back to organizations",
          })}
        </Button>
      </Box>

      <Tabs.Root defaultValue="members">
        <Tabs.List
          aria-label={formatMessage({
            id: `${PLUGIN_ID}.org.detail.tabs`,
            defaultMessage: "Organization sections",
          })}
        >
          <Tabs.Trigger value="members">
            {formatMessage({
              id: `${PLUGIN_ID}.org.detail.members`,
              defaultMessage: "Members",
            })}
            {members && ` (${members.length})`}
          </Tabs.Trigger>
          <Tabs.Trigger value="invitations">
            {formatMessage({
              id: `${PLUGIN_ID}.org.detail.invitations`,
              defaultMessage: "Invitations",
            })}
            {invitations && ` (${invitations.length})`}
          </Tabs.Trigger>
        </Tabs.List>

        <Box paddingTop={4}>
          <Tabs.Content value="members">
            <Box marginBottom={4}>
              <Button
                startIcon={<Plus />}
                onClick={() => setShowInviteDialog(true)}
                size="S"
              >
                {formatMessage({
                  id: `${PLUGIN_ID}.org.invite.button`,
                  defaultMessage: "Invite member",
                })}
              </Button>
            </Box>

            {membersLoading ? (
              <Typography>Loading...</Typography>
            ) : members && members.length > 0 ? (
              <Table colCount={4} rowCount={members.length + 1}>
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
                      <Typography variant="sigma" textColor="neutral600">
                        {formatMessage({
                          id: `${PLUGIN_ID}.org.member.role`,
                          defaultMessage: "Role",
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
                  {members.map((member) => (
                    <Tr key={member.id}>
                      <Td>
                        <Typography textColor="neutral800" fontWeight="semiBold">
                          {member.user?.name ?? "—"}
                        </Typography>
                      </Td>
                      <Td>
                        <Typography textColor="neutral800">{member.user?.email ?? "—"}</Typography>
                      </Td>
                      <Td>
                        {editingMemberRole?.memberId === member.id ? (
                          <Flex gap={2}>
                            <SingleSelect
                              value={editingMemberRole?.role}
                              onChange={(val: string | number) =>
                                setEditingMemberRole({ memberId: member.id, role: String(val) })
                              }
                            >
                              <SingleSelectOption value="owner">Owner</SingleSelectOption>
                              <SingleSelectOption value="admin">Admin</SingleSelectOption>
                              <SingleSelectOption value="member">Member</SingleSelectOption>
                            </SingleSelect>
                            <Button
                              size="S"
                              loading={updateRoleMutation.isLoading}
                              onClick={() => editingMemberRole && updateRoleMutation.mutate(editingMemberRole)}
                            >
                              {formatMessage({ id: "global.save", defaultMessage: "Save" })}
                            </Button>
                            <Button
                              size="S"
                              variant="tertiary"
                              onClick={() => setEditingMemberRole(null)}
                            >
                              {formatMessage({
                                id: "app.components.Button.cancel",
                                defaultMessage: "Cancel",
                              })}
                            </Button>
                          </Flex>
                        ) : (
                          <Flex gap={2} alignItems="center">
                            <Typography textColor="neutral800">{member.role}</Typography>
                            <Button
                              size="S"
                              variant="ghost"
                              onClick={() =>
                                setEditingMemberRole({ memberId: member.id, role: member.role })
                              }
                            >
                              {formatMessage({
                                id: `${PLUGIN_ID}.org.member.role.change`,
                                defaultMessage: "Change",
                              })}
                            </Button>
                          </Flex>
                        )}
                      </Td>
                      <Td>
                        <IconButton
                          label={formatMessage({
                            id: `${PLUGIN_ID}.org.member.remove`,
                            defaultMessage: "Remove member",
                          })}
                          onClick={() => setConfirmRemoveMember(member.id)}
                        >
                          <Trash />
                        </IconButton>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <EmptyStateLayout
                content={formatMessage({
                  id: `${PLUGIN_ID}.org.members.empty`,
                  defaultMessage: "No members yet.",
                })}
                action={
                  <Button
                    variant="secondary"
                    startIcon={<Plus />}
                    onClick={() => setShowInviteDialog(true)}
                  >
                    {formatMessage({
                      id: `${PLUGIN_ID}.org.invite.button`,
                      defaultMessage: "Invite member",
                    })}
                  </Button>
                }
              />
            )}
          </Tabs.Content>

          <Tabs.Content value="invitations">
            {invitationsLoading ? (
              <Typography>Loading...</Typography>
            ) : invitations && invitations.length > 0 ? (
              <Table colCount={5} rowCount={invitations.length + 1}>
                <Thead>
                  <Tr>
                    <Th>
                      <Typography variant="sigma" textColor="neutral600">
                        {formatMessage({ id: "global.email", defaultMessage: "Email" })}
                      </Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma" textColor="neutral600">
                        {formatMessage({
                          id: `${PLUGIN_ID}.org.member.role`,
                          defaultMessage: "Role",
                        })}
                      </Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma" textColor="neutral600">Status</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma" textColor="neutral600">Expires</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma" textColor="neutral600">
                        {formatMessage({ id: "global.actions", defaultMessage: "Actions" })}
                      </Typography>
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {invitations.map((inv) => (
                    <Tr key={inv.id}>
                      <Td>
                        <Typography textColor="neutral800">{inv.email}</Typography>
                      </Td>
                      <Td>
                        <Typography textColor="neutral800">{inv.role}</Typography>
                      </Td>
                      <Td>
                        <Box
                          background={inv.status === "pending" ? "warning100" : "neutral100"}
                          padding="2px 8px"
                          borderRadius="4px"
                          style={{ display: "inline-block" }}
                        >
                          <Typography
                            variant="pi"
                            textColor={inv.status === "pending" ? "warning600" : "neutral500"}
                          >
                            {inv.status}
                          </Typography>
                        </Box>
                      </Td>
                      <Td>
                        <Typography textColor="neutral800">
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </Typography>
                      </Td>
                      <Td>
                        <Flex gap={2}>
                          {inv.status === "pending" && (
                            <>
                              <Button
                                size="S"
                                variant="secondary"
                                loading={resendInvitationMutation.isLoading}
                                onClick={() => resendInvitationMutation.mutate(inv.id)}
                              >
                                {formatMessage({
                                  id: `${PLUGIN_ID}.org.invitation.resend`,
                                  defaultMessage: "Resend",
                                })}
                              </Button>
                              <Button
                                size="S"
                                variant="danger-light"
                                loading={cancelInvitationMutation.isLoading}
                                onClick={() => cancelInvitationMutation.mutate(inv.id)}
                              >
                                {formatMessage({
                                  id: `${PLUGIN_ID}.org.invitation.cancel`,
                                  defaultMessage: "Cancel",
                                })}
                              </Button>
                            </>
                          )}
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <EmptyStateLayout
                content={formatMessage({
                  id: `${PLUGIN_ID}.org.invitations.empty`,
                  defaultMessage: "No pending invitations.",
                })}
                action={
                  <Button
                    variant="secondary"
                    startIcon={<Plus />}
                    onClick={() => setShowInviteDialog(true)}
                  >
                    {formatMessage({
                      id: `${PLUGIN_ID}.org.invite.button`,
                      defaultMessage: "Invite member",
                    })}
                  </Button>
                }
              />
            )}
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      {showInviteDialog && (
        <InviteMemberDialog orgId={orgId} onClose={() => setShowInviteDialog(false)} />
      )}

      {confirmRemoveMember && (
        <Dialog.Root defaultOpen onOpenChange={(open) => !open && setConfirmRemoveMember(null)}>
          <Dialog.Content>
            <Dialog.Header>
              {formatMessage({
                id: `${PLUGIN_ID}.org.member.remove.confirm.title`,
                defaultMessage: "Remove member",
              })}
            </Dialog.Header>
            <Dialog.Body>
              <Typography>
                {formatMessage({
                  id: `${PLUGIN_ID}.org.member.remove.confirm.message`,
                  defaultMessage:
                    "Are you sure you want to remove this member from the organization?",
                })}
              </Typography>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="tertiary" onClick={() => setConfirmRemoveMember(null)}>
                {formatMessage({ id: "app.components.Button.cancel", defaultMessage: "Cancel" })}
              </Button>
              <Button
                variant="danger"
                loading={removeMemberMutation.isLoading}
                onClick={() => removeMemberMutation.mutate(confirmRemoveMember)}
              >
                {formatMessage({
                  id: `${PLUGIN_ID}.org.member.remove`,
                  defaultMessage: "Remove",
                })}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>
      )}
    </>
  );
};
