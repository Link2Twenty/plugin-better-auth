import {
  Badge,
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Grid,
  Tabs,
  TextInput,
  Typography,
} from "@strapi/design-system";
import type React from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { client } from "../../client";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Drawer } from "../../components/Drawer";
import { CustomFieldsSection } from "../../components/DynamicField";
import { useModelSchema } from "../../hooks/useModelSchema";
import { withContext } from "../../utils/dashContext";

// Fields already rendered in the standard form — exclude from custom fields
const STANDARD_FIELDS = new Set([
  "id",
  "name",
  "email",
  "emailVerified",
  "image",
  "banned",
  "banReason",
  "banExpires",
  "createdAt",
  "updatedAt",
]);

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
  const schemaQuery = useModelSchema("user");

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
  const [editExtra, setEditExtra] = useState<Record<string, unknown>>({});
  const [newPassword, setNewPassword] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banExpiresDays, setBanExpiresDays] = useState("");
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [confirmUnban, setConfirmUnban] = useState(false);
  const [confirmUnlinkAccountId, setConfirmUnlinkAccountId] = useState<string | null>(null);

  const user = userQuery.data;
  const displayName = editName ?? user?.name ?? "";
  const displayEmail = editEmail ?? user?.email ?? "";
  const displayEmailVerified =
    editEmailVerified ?? user?.emailVerified ?? false;

  const handleExtraChange = (name: string, value: unknown) => {
    setEditExtra((prev) => ({ ...prev, [name]: value }));
  };

  const extraData: Record<string, unknown> = {
    ...(user as Record<string, unknown> | undefined),
    ...editExtra,
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { ...editExtra };
      if (editName !== undefined) body.name = editName;
      if (editEmail !== undefined) body.email = editEmail;
      if (editEmailVerified !== undefined)
        body.emailVerified = editEmailVerified;

      const result = await client.dash.updateUser(
        body as never,
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
      setEditExtra({});
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
      setConfirmUnban(false);
      qc.invalidateQueries({ queryKey: ["dash-user", userId] });
      qc.invalidateQueries({ queryKey: ["dash-users"] });
    },
  });

  const unlinkAccountMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const result = await client.dash.unlinkAccount(
        { providerId },
        withContext({ userId }),
      );
      if (result.error)
        throw new Error(result.error.message ?? "Failed to unlink account");
    },
    onSuccess: () => {
      setConfirmUnlinkAccountId(null);
      qc.invalidateQueries({ queryKey: ["dash-user", userId] });
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
    onSuccess: () => {
      setConfirmRevokeAll(false);
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
    editEmailVerified !== undefined ||
    Object.keys(editExtra).length > 0;

  const customFields = Object.entries(schemaQuery.data ?? {})
    .filter(([name]) => !STANDARD_FIELDS.has(name))
    .map(([name, attribute]) => ({ name, attribute }));

  const title = (
    <Flex gap={2} alignItems="center">
      {user?.image && (
        <Box
          tag="img"
          src={user.image}
          alt=""
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      )}
      <span>{user?.name ?? "User"}</span>
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
  );

  return (
    <Drawer title={title} onClose={onClose} data-testid="user-detail-drawer">
      {userQuery.isLoading ? (
        <Typography textColor="neutral500">Loading…</Typography>
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

          {/* Profile tab */}
          <Tabs.Content value="profile">
            <Box paddingTop={6}>
              {/* Editable fields */}
              <Grid.Root gap={4}>
                <Grid.Item col={6}>
                  <Field.Root style={{ width: "100%" }}>
                    <Field.Label>Name</Field.Label>
                    <TextInput
                      value={displayName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditName(e.target.value)
                      }
                      data-testid="user-name-input"
                    />
                  </Field.Root>
                </Grid.Item>
                <Grid.Item col={6}>
                  <Field.Root style={{ width: "100%" }}>
                    <Field.Label>Email</Field.Label>
                    <TextInput
                      type="email"
                      value={displayEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditEmail(e.target.value)
                      }
                    />
                  </Field.Root>
                </Grid.Item>
                <Grid.Item col={12}>
                  <Checkbox
                    checked={displayEmailVerified}
                    onCheckedChange={(checked: boolean) =>
                      setEditEmailVerified(checked)
                    }
                  >
                    Mark email as verified
                  </Checkbox>
                </Grid.Item>
              </Grid.Root>

              {/* Custom fields */}
              <CustomFieldsSection
                fields={customFields}
                data={extraData}
                onChange={handleExtraChange}
              />

              {updateMutation.isError && (
                <Typography textColor="danger600" variant="pi" paddingTop={3}>
                  {updateMutation.error instanceof Error
                    ? updateMutation.error.message
                    : "An error occurred"}
                </Typography>
              )}

              <Flex gap={2} paddingTop={4}>
                <Button
                  disabled={!hasEdits}
                  loading={updateMutation.isLoading}
                  onClick={() => updateMutation.mutate()}
                  data-testid="save-user-btn"
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
                        User ID
                      </Typography>
                      <Typography
                        variant="omega"
                        textColor="neutral600"
                        style={{ fontFamily: "monospace", wordBreak: "break-all" }}
                      >
                        {user?.id}
                      </Typography>
                    </Flex>
                  </Grid.Item>
                  <Grid.Item col={6}>
                    <Flex direction="column" gap={1}>
                      <Typography variant="pi" textColor="neutral500">
                        Created
                      </Typography>
                      <Typography variant="omega" textColor="neutral600">
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleString()
                          : "—"}
                      </Typography>
                    </Flex>
                  </Grid.Item>
                  <Grid.Item col={6}>
                    <Flex direction="column" gap={1}>
                      <Typography variant="pi" textColor="neutral500">
                        Last updated
                      </Typography>
                      <Typography variant="omega" textColor="neutral600">
                        {user?.updatedAt
                          ? new Date(user.updatedAt).toLocaleString()
                          : "—"}
                      </Typography>
                    </Flex>
                  </Grid.Item>
                </Grid.Root>
              </Box>

              {/* Email actions */}
              {emailVerificationEnabled && (
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
                    paddingBottom={3}
                  >
                    Email actions
                  </Typography>
                  <Flex gap={2}>
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
            </Box>
          </Tabs.Content>

          {/* Sessions tab */}
          <Tabs.Content value="sessions">
            <Box paddingTop={6}>
              <Flex
                justifyContent="space-between"
                alignItems="center"
                padding={4}
                background="neutral50"
                hasRadius
                borderColor="neutral150"
                borderStyle="solid"
                borderWidth="1px"
                gap={4}
              >
                <Flex direction="column" gap={1}>
                  <Typography variant="omega" fontWeight="semiBold">
                    Revoke all sessions
                  </Typography>
                  <Typography variant="pi" textColor="neutral500">
                    Signs the user out on all devices immediately.
                  </Typography>
                  {revokeAllMutation.isSuccess && (
                    <Typography textColor="success600" variant="pi">
                      All sessions revoked successfully.
                    </Typography>
                  )}
                  {revokeAllMutation.isError && (
                    <Typography textColor="danger600" variant="pi">
                      {revokeAllMutation.error instanceof Error
                        ? revokeAllMutation.error.message
                        : "An error occurred"}
                    </Typography>
                  )}
                </Flex>
                <Button
                  variant="danger-light"
                  size="S"
                  onClick={() => setConfirmRevokeAll(true)}
                  style={{ flexShrink: 0 }}
                >
                  Revoke all
                </Button>
              </Flex>
            </Box>
          </Tabs.Content>

          {/* Ban tab */}
          {banEnabled && (
            <Tabs.Content value="ban">
              <Box paddingTop={6}>
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
                      onClick={() => setConfirmUnban(true)}
                    >
                      Unban user
                    </Button>
                  </Flex>
                ) : (
                  <Flex direction="column" gap={4}>
                    <Grid.Root gap={4}>
                      <Grid.Item col={6}>
                        <Field.Root
                          hint="Optional reason for the ban"
                          style={{ width: "100%" }}
                        >
                          <Field.Label>Ban reason</Field.Label>
                          <TextInput
                            value={banReason}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => setBanReason(e.target.value)}
                          />
                          <Field.Hint />
                        </Field.Root>
                      </Grid.Item>
                      <Grid.Item col={6}>
                        <Field.Root
                          hint="Leave empty for a permanent ban"
                          style={{ width: "100%" }}
                        >
                          <Field.Label>Duration (days)</Field.Label>
                          <TextInput
                            type="number"
                            value={banExpiresDays}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => setBanExpiresDays(e.target.value)}
                          />
                          <Field.Hint />
                        </Field.Root>
                      </Grid.Item>
                    </Grid.Root>
                    {banMutation.isError && (
                      <Typography textColor="danger600" variant="pi">
                        {banMutation.error instanceof Error
                          ? banMutation.error.message
                          : "An error occurred"}
                      </Typography>
                    )}
                    <Box>
                      <Button
                        variant="danger"
                        loading={banMutation.isLoading}
                        onClick={() => banMutation.mutate()}
                      >
                        Ban user
                      </Button>
                    </Box>
                  </Flex>
                )}
              </Box>
            </Tabs.Content>
          )}

          {/* Security tab */}
          <Tabs.Content value="security">
            <Box paddingTop={6}>
              {/* Set password */}
              <Typography variant="sigma" textColor="neutral600" paddingBottom={4}>
                Set password
              </Typography>
              <Field.Root hint="Enter a new password for this user">
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
                <Typography textColor="success600" variant="pi" paddingTop={2}>
                  Password updated.
                </Typography>
              )}
              {passwordMutation.isError && (
                <Typography textColor="danger600" variant="pi" paddingTop={2}>
                  {passwordMutation.error instanceof Error
                    ? passwordMutation.error.message
                    : "An error occurred"}
                </Typography>
              )}
              <Box paddingTop={4}>
                <Button
                  disabled={!newPassword}
                  loading={passwordMutation.isLoading}
                  onClick={() => passwordMutation.mutate()}
                >
                  Set password
                </Button>
              </Box>

              {/* Linked accounts */}
              {user?.account && user.account.length > 0 && (
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
                    Linked accounts
                  </Typography>
                  <Flex direction="column" gap={2}>
                    {user.account.map((acc) => (
                      <Flex
                        key={acc.id}
                        justifyContent="space-between"
                        alignItems="center"
                        padding={3}
                        background="neutral50"
                        hasRadius
                        borderColor="neutral150"
                        borderStyle="solid"
                        borderWidth="1px"
                      >
                        <Typography variant="omega" fontWeight="semiBold">
                          {acc.providerId}
                        </Typography>
                        <Button
                          variant="danger-light"
                          size="S"
                          onClick={() =>
                            setConfirmUnlinkAccountId(acc.providerId)
                          }
                        >
                          Unlink
                        </Button>
                      </Flex>
                    ))}
                  </Flex>
                </Box>
              )}
            </Box>
          </Tabs.Content>

          {/* Organizations tab */}
          <Tabs.Content value="organizations">
            <Box paddingTop={6}>
              {orgsQuery.isLoading ? (
                <Typography textColor="neutral500">Loading…</Typography>
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
                        padding={4}
                        background="neutral100"
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

      {confirmRevokeAll && (
        <ConfirmDialog
          title="Revoke all sessions"
          message="Are you sure you want to revoke all sessions for this user? They will be signed out on all devices."
          confirmLabel="Revoke all"
          loading={revokeAllMutation.isLoading}
          onConfirm={() => revokeAllMutation.mutate()}
          onCancel={() => setConfirmRevokeAll(false)}
        />
      )}

      {confirmUnban && (
        <ConfirmDialog
          title="Unban user"
          message="Are you sure you want to unban this user? They will be able to sign in again."
          confirmLabel="Unban"
          variant="default"
          loading={unbanMutation.isLoading}
          onConfirm={() => unbanMutation.mutate()}
          onCancel={() => setConfirmUnban(false)}
        />
      )}

      {confirmUnlinkAccountId && (
        <ConfirmDialog
          title="Unlink account"
          message={`Are you sure you want to unlink the "${confirmUnlinkAccountId}" provider from this user?`}
          confirmLabel="Unlink"
          loading={unlinkAccountMutation.isLoading}
          onConfirm={() =>
            unlinkAccountMutation.mutate(confirmUnlinkAccountId)
          }
          onCancel={() => setConfirmUnlinkAccountId(null)}
        />
      )}
    </Drawer>
  );
}
