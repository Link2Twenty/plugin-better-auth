import {
  Badge,
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Modal,
  Tabs,
  TextInput,
  Typography,
} from "@strapi/design-system";
import type React from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { client } from "../../client";
import { withContext } from "../../utils/dashContext";

interface Props {
  userId: string;
  banEnabled: boolean;
  emailVerificationEnabled: boolean;
  onClose: () => void;
}

export function UserDetailDrawer({
  userId,
  banEnabled,
  emailVerificationEnabled,
  onClose,
}: Props) {
  const qc = useQueryClient();

  const userQuery = useQuery({
    queryKey: ["dash-user", userId],
    queryFn: async () => {
      const result = await client.dash.user({}, withContext({ userId }));
      if (result.error)
        throw new Error(result.error.message ?? "Failed to load user");
      return result.data;
    },
  });

  const orgsQuery = useQuery({
    queryKey: ["dash-user-orgs", userId],
    queryFn: async () => {
      const result = await client.dash.userOrganizations(
        {},
        withContext({ userId }),
      );
      if (result.error) throw new Error(result.error.message ?? "Failed");
      return result.data?.organizations ?? [];
    },
  });

  const [editName, setEditName] = useState<string | undefined>(undefined);
  const [editEmail, setEditEmail] = useState<string | undefined>(undefined);
  const [editEmailVerified, setEditEmailVerified] = useState<
    boolean | undefined
  >(undefined);
  const [newPassword, setNewPassword] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banExpiresDays, setBanExpiresDays] = useState("");

  const user = userQuery.data;
  const displayName = editName ?? user?.name ?? "";
  const displayEmail = editEmail ?? user?.email ?? "";
  const displayEmailVerified =
    editEmailVerified ?? user?.emailVerified ?? false;

  const updateMutation = useMutation({
    mutationFn: async () => {
      const body: {
        name?: string;
        email?: string;
        emailVerified?: boolean;
      } = {};
      if (editName !== undefined) body.name = editName;
      if (editEmail !== undefined) body.email = editEmail;
      if (editEmailVerified !== undefined)
        body.emailVerified = editEmailVerified;

      const result = await client.dash.updateUser(
        body,
        withContext({ userId }),
      );
      if (result.error)
        throw new Error(result.error.message ?? "Update failed");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dash-user", userId] });
      qc.invalidateQueries({ queryKey: ["dash-users"] });
      setEditName(undefined);
      setEditEmail(undefined);
      setEditEmailVerified(undefined);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const result = await client.dash.setPassword(
        { password: newPassword },
        withContext({ userId }),
      );
      if (result.error)
        throw new Error(result.error.message ?? "Password update failed");
      return result.data;
    },
    onSuccess: () => {
      setNewPassword("");
    },
  });

  const banMutation = useMutation({
    mutationFn: async () => {
      const body: { banReason?: string; banExpires?: number } = {};
      if (banReason) body.banReason = banReason;
      if (banExpiresDays) {
        const days = parseInt(banExpiresDays, 10);
        if (!Number.isNaN(days)) {
          body.banExpires = Date.now() + days * 24 * 60 * 60 * 1000;
        }
      }
      const result = await client.dash.banUser(body, withContext({ userId }));
      if (result.error) throw new Error(result.error.message ?? "Ban failed");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dash-user", userId] });
      qc.invalidateQueries({ queryKey: ["dash-users"] });
      setBanReason("");
      setBanExpiresDays("");
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async () => {
      const result = await client.dash.unbanUser({}, withContext({ userId }));
      if (result.error) throw new Error(result.error.message ?? "Unban failed");
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dash-user", userId] });
      qc.invalidateQueries({ queryKey: ["dash-users"] });
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: async () => {
      const result = await client.dash.sessions.revokeAll(
        { userId },
        withContext({}),
      );
      if (result.error)
        throw new Error(result.error.message ?? "Revoke failed");
      return result.data;
    },
  });

  const sendVerificationMutation = useMutation({
    mutationFn: async () => {
      const callbackUrl = new URL(window.location.href, window.location.origin);
      const result = await client.dash.sendVerificationEmail(
        { callbackUrl: callbackUrl.toString() },
        withContext({ userId }),
      );
      if (result.error) throw new Error(result.error.message ?? "Failed");
      return result.data;
    },
  });

  const sendResetPasswordMutation = useMutation({
    mutationFn: async () => {
      const callbackUrl = new URL(window.location.href, window.location.origin);
      const result = await client.dash.sendResetPasswordEmail(
        { callbackUrl: callbackUrl.toString() },
        withContext({ userId }),
      );
      if (result.error) throw new Error(result.error.message ?? "Failed");
      return result.data;
    },
  });

  const hasEdits =
    editName !== undefined ||
    editEmail !== undefined ||
    editEmailVerified !== undefined;

  return (
    <Modal.Root defaultOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Content>
        <Modal.Header>
          <Flex gap={2} alignItems="center">
            <Typography variant="beta" tag="h2">
              {user?.name ?? "User"}
            </Typography>
            {user?.banned && (
              <Badge backgroundColor="danger100" textColor="danger600">
                Banned
              </Badge>
            )}
            {user?.emailVerified && (
              <Badge backgroundColor="success100" textColor="success600">
                Verified
              </Badge>
            )}
          </Flex>
        </Modal.Header>

        <Modal.Body>
          {userQuery.isLoading ? (
            <Typography>Loading…</Typography>
          ) : userQuery.isError ? (
            <Typography textColor="danger600">
              {userQuery.error instanceof Error
                ? userQuery.error.message
                : "An error occurred"}
            </Typography>
          ) : (
            <Tabs.Root defaultValue="profile">
              <Tabs.List>
                <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
                <Tabs.Trigger value="sessions">Sessions</Tabs.Trigger>
                {banEnabled && <Tabs.Trigger value="ban">Ban</Tabs.Trigger>}
                <Tabs.Trigger value="security">Security</Tabs.Trigger>
                <Tabs.Trigger value="organizations">Organizations</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="profile">
                <Box paddingTop={4}>
                  <Flex direction="column" gap={4}>
                    <Field.Root>
                      <Field.Label>Name</Field.Label>
                      <TextInput
                        value={displayName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditName(e.target.value)
                        }
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Email</Field.Label>
                      <TextInput
                        type="email"
                        value={displayEmail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditEmail(e.target.value)
                        }
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Email verified</Field.Label>
                      <Checkbox
                        checked={displayEmailVerified}
                        onCheckedChange={(checked: boolean) =>
                          setEditEmailVerified(checked)
                        }
                      >
                        Email verified
                      </Checkbox>
                    </Field.Root>

                    {updateMutation.isError && (
                      <Typography textColor="danger600" variant="pi">
                        {updateMutation.error instanceof Error
                          ? updateMutation.error.message
                          : "An error occurred"}
                      </Typography>
                    )}

                    <Flex gap={2}>
                      <Button
                        disabled={!hasEdits}
                        loading={updateMutation.isLoading}
                        onClick={() => updateMutation.mutate()}
                      >
                        Save changes
                      </Button>
                      {hasEdits && (
                        <Button
                          variant="tertiary"
                          onClick={() => {
                            setEditName(undefined);
                            setEditEmail(undefined);
                            setEditEmailVerified(undefined);
                          }}
                        >
                          Discard
                        </Button>
                      )}
                    </Flex>

                    {emailVerificationEnabled && (
                      <Box
                        paddingTop={4}
                        borderColor="neutral150"
                        borderStyle="solid"
                        borderWidth="1px"
                      >
                        <Typography
                          variant="sigma"
                          textColor="neutral600"
                          paddingBottom={2}
                        >
                          Email actions
                        </Typography>
                        <Flex gap={2} paddingTop={2}>
                          <Button
                            variant="secondary"
                            size="S"
                            loading={sendVerificationMutation.isLoading}
                            disabled={user?.emailVerified}
                            onClick={() => sendVerificationMutation.mutate()}
                          >
                            Send verification email
                          </Button>
                          <Button
                            variant="secondary"
                            size="S"
                            loading={sendResetPasswordMutation.isLoading}
                            onClick={() => sendResetPasswordMutation.mutate()}
                          >
                            Send password reset
                          </Button>
                        </Flex>
                      </Box>
                    )}
                  </Flex>
                </Box>
              </Tabs.Content>

              <Tabs.Content value="sessions">
                <Box paddingTop={4}>
                  <Flex direction="column" gap={4}>
                    <Typography variant="omega" textColor="neutral600">
                      Revoke all active sessions for this user. They will be
                      signed out on all devices.
                    </Typography>
                    {revokeAllMutation.isSuccess && (
                      <Typography textColor="success600" variant="pi">
                        All sessions revoked.
                      </Typography>
                    )}
                    {revokeAllMutation.isError && (
                      <Typography textColor="danger600" variant="pi">
                        {revokeAllMutation.error instanceof Error
                          ? revokeAllMutation.error.message
                          : "An error occurred"}
                      </Typography>
                    )}
                    <Button
                      variant="danger-light"
                      loading={revokeAllMutation.isLoading}
                      onClick={() => revokeAllMutation.mutate()}
                    >
                      Revoke all sessions
                    </Button>
                  </Flex>
                </Box>
              </Tabs.Content>

              {banEnabled && (
                <Tabs.Content value="ban">
                  <Box paddingTop={4}>
                    {user?.banned ? (
                      <Flex direction="column" gap={4}>
                        <Box
                          background="danger100"
                          padding={4}
                          hasRadius
                          borderColor="danger200"
                          borderStyle="solid"
                          borderWidth="1px"
                        >
                          <Typography textColor="danger600" variant="omega">
                            This user is currently banned.
                          </Typography>
                          {user.banReason && (
                            <Typography
                              textColor="danger600"
                              variant="pi"
                              paddingTop={1}
                            >
                              Reason: {user.banReason}
                            </Typography>
                          )}
                        </Box>
                        {unbanMutation.isError && (
                          <Typography textColor="danger600" variant="pi">
                            {unbanMutation.error instanceof Error
                              ? unbanMutation.error.message
                              : "An error occurred"}
                          </Typography>
                        )}
                        <Button
                          variant="secondary"
                          loading={unbanMutation.isLoading}
                          onClick={() => unbanMutation.mutate()}
                        >
                          Unban user
                        </Button>
                      </Flex>
                    ) : (
                      <Flex direction="column" gap={4}>
                        <Field.Root hint="Optional reason for the ban">
                          <Field.Label>Ban reason</Field.Label>
                          <TextInput
                            value={banReason}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => setBanReason(e.target.value)}
                          />
                          <Field.Hint />
                        </Field.Root>
                        <Field.Root hint="Leave empty for a permanent ban">
                          <Field.Label>Ban duration</Field.Label>
                          <TextInput
                            type="number"
                            value={banExpiresDays}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => setBanExpiresDays(e.target.value)}
                          />
                          <Field.Hint />
                        </Field.Root>
                        {banMutation.isError && (
                          <Typography textColor="danger600" variant="pi">
                            {banMutation.error instanceof Error
                              ? banMutation.error.message
                              : "An error occurred"}
                          </Typography>
                        )}
                        <Button
                          variant="danger"
                          loading={banMutation.isLoading}
                          onClick={() => banMutation.mutate()}
                        >
                          Ban user
                        </Button>
                      </Flex>
                    )}
                  </Box>
                </Tabs.Content>
              )}

              <Tabs.Content value="security">
                <Box paddingTop={4}>
                  <Flex direction="column" gap={4}>
                    <Typography variant="delta">Set Password</Typography>
                    <Field.Root hint="Enter a new password for the user">
                      <Field.Label>New password</Field.Label>
                      <TextInput
                        type="password"
                        value={newPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewPassword(e.target.value)
                        }
                      />
                      <Field.Hint />
                    </Field.Root>
                    {passwordMutation.isSuccess && (
                      <Typography textColor="success600" variant="pi">
                        Password updated.
                      </Typography>
                    )}
                    {passwordMutation.isError && (
                      <Typography textColor="danger600" variant="pi">
                        {passwordMutation.error instanceof Error
                          ? passwordMutation.error.message
                          : "An error occurred"}
                      </Typography>
                    )}
                    <Button
                      disabled={!newPassword}
                      loading={passwordMutation.isLoading}
                      onClick={() => passwordMutation.mutate()}
                    >
                      Set password
                    </Button>

                    {user?.account && user.account.length > 0 && (
                      <Box
                        paddingTop={4}
                        borderColor="neutral150"
                        borderStyle="solid"
                        borderWidth="1px"
                      >
                        <Typography variant="delta" paddingBottom={2}>
                          Linked Accounts
                        </Typography>
                        {user.account.map((acc) => (
                          <Box key={acc.id} paddingTop={2}>
                            <Flex
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography variant="omega">
                                {acc.providerId}
                              </Typography>
                              <Button
                                variant="danger-light"
                                size="S"
                                onClick={async () => {
                                  await client.dash.unlinkAccount(
                                    { providerId: acc.providerId },
                                    withContext({ userId }),
                                  );
                                  qc.invalidateQueries({
                                    queryKey: ["dash-user", userId],
                                  });
                                }}
                              >
                                Unlink
                              </Button>
                            </Flex>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Flex>
                </Box>
              </Tabs.Content>

              <Tabs.Content value="organizations">
                <Box paddingTop={4}>
                  {orgsQuery.isLoading ? (
                    <Typography>Loading…</Typography>
                  ) : (orgsQuery.data ?? []).length === 0 ? (
                    <Typography textColor="neutral500">
                      Not a member of any organizations.
                    </Typography>
                  ) : (
                    <Flex direction="column" gap={2}>
                      {(orgsQuery.data ?? []).map((org) =>
                        org ? (
                          <Box
                            key={org.id}
                            padding={3}
                            background="neutral100"
                            hasRadius
                          >
                            <Flex
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Flex direction="column">
                                <Typography
                                  variant="omega"
                                  fontWeight="semiBold"
                                >
                                  {org.name}
                                </Typography>
                                <Typography variant="pi" textColor="neutral500">
                                  Role: {org.role}
                                </Typography>
                              </Flex>
                              {org.teams.length > 0 && (
                                <Typography variant="pi" textColor="neutral500">
                                  {org.teams.length} team
                                  {org.teams.length !== 1 ? "s" : ""}
                                </Typography>
                              )}
                            </Flex>
                          </Box>
                        ) : null,
                      )}
                    </Flex>
                  )}
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
