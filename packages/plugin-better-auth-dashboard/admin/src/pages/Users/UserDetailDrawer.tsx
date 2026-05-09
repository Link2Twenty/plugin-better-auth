import {
  Alert,
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
import { useNotification } from "@strapi/strapi/admin";
import type React from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { client } from "../../client";
import { Avatar } from "../../components/Avatar";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Drawer } from "../../components/Drawer";
import { CustomFieldsSection } from "../../components/DynamicField";
import {
  AccountRow,
  EditLayout,
  EditSidebar,
  FormSection,
  MetaItem,
  MetaKey,
  MetaVal,
  MonoChip,
  PreviewPill,
  ProviderBadge,
  SectionLabel,
  WarnCard,
} from "../../components/FormPrimitives";

import { MediaPickerField } from "../../components/MediaPickerField";
import { useModelSchema } from "../../hooks/useModelSchema";
import { withContext } from "../../utils/dashContext";

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
  const { toggleNotification } = useNotification();
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

  const [activeTab, setActiveTab] = useState("profile");
  const [editName, setEditName] = useState<string | undefined>(undefined);
  const [editEmail, setEditEmail] = useState<string | undefined>(undefined);
  const [editEmailVerified, setEditEmailVerified] = useState<
    boolean | undefined
  >(undefined);
  const [editImage, setEditImage] = useState<string | undefined>(undefined);
  const [editExtra, setEditExtra] = useState<Record<string, unknown>>({});
  const [newPassword, setNewPassword] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banExpiresDays, setBanExpiresDays] = useState("");
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [confirmUnban, setConfirmUnban] = useState(false);
  const [confirmUnlinkAccountId, setConfirmUnlinkAccountId] = useState<
    string | null
  >(null);

  const user = userQuery.data;
  const displayName = editName ?? user?.name ?? "";
  const displayEmail = editEmail ?? user?.email ?? "";
  const displayEmailVerified =
    editEmailVerified ?? user?.emailVerified ?? false;
  const displayImage = editImage ?? user?.image ?? "";

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
      if (editImage !== undefined) body.image = editImage;
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
      setEditImage(undefined);
      setEditExtra({});
      toggleNotification({
        type: "success",
        message: "User updated successfully",
      });
      onClose();
    },
    onError: (err: Error) => {
      toggleNotification({
        type: "danger",
        message: err.message ?? "Update failed",
      });
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
      toggleNotification({
        type: "success",
        message: "Password updated successfully",
      });
    },
    onError: (err: Error) => {
      toggleNotification({
        type: "danger",
        message: err.message ?? "Password update failed",
      });
    },
  });

  const banMutation = useMutation({
    mutationFn: async () => {
      const body: { banReason?: string; banExpires?: number } = {};
      if (banReason) body.banReason = banReason;
      if (banExpiresDays) {
        const days = parseInt(banExpiresDays, 10);
        if (!Number.isNaN(days)) body.banExpires = Date.now() + days * 86400000;
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
      toggleNotification({ type: "success", message: "User has been banned" });
    },
    onError: (err: Error) => {
      toggleNotification({
        type: "danger",
        message: err.message ?? "Ban failed",
      });
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
      toggleNotification({ type: "success", message: "Ban has been lifted" });
    },
    onError: (err: Error) => {
      toggleNotification({
        type: "danger",
        message: err.message ?? "Unban failed",
      });
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
      toggleNotification({ type: "success", message: "Account unlinked" });
    },
    onError: (err: Error) => {
      toggleNotification({
        type: "danger",
        message: err.message ?? "Failed to unlink account",
      });
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
      toggleNotification({ type: "success", message: "All sessions revoked" });
    },
    onError: (err: Error) => {
      toggleNotification({
        type: "danger",
        message: err.message ?? "Failed to revoke sessions",
      });
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
    onSuccess: () => {
      toggleNotification({
        type: "success",
        message: "Verification email sent",
      });
    },
    onError: (err: Error) => {
      toggleNotification({
        type: "danger",
        message: err.message ?? "Failed to send email",
      });
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
    onSuccess: () => {
      toggleNotification({
        type: "success",
        message: "Password reset email sent",
      });
    },
    onError: (err: Error) => {
      toggleNotification({
        type: "danger",
        message: err.message ?? "Failed to send email",
      });
    },
  });

  const hasEdits =
    editName !== undefined ||
    editEmail !== undefined ||
    editEmailVerified !== undefined ||
    editImage !== undefined ||
    Object.keys(editExtra).length > 0;

  const customFields = Object.entries(schemaQuery.data ?? {})
    .filter(([name]) => !STANDARD_FIELDS.has(name))
    .map(([name, attribute]) => ({ name, attribute }));

  const banExpiryPreview =
    banExpiresDays && !Number.isNaN(parseInt(banExpiresDays, 10))
      ? new Date(
          Date.now() + parseInt(banExpiresDays, 10) * 86400000,
        ).toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

  const drawerTitle = (
    <Flex gap={2} alignItems="center">
      <Avatar name={user?.name ?? "?"} src={user?.image} size={30} />
      <Box>
        <Typography variant="beta" tag="span">
          {user?.name ?? "User"}
        </Typography>
        {user?.email && (
          <Box>
            <Typography variant="pi" textColor="neutral500">
              {user.email}
            </Typography>
          </Box>
        )}
      </Box>
      {user?.banned && (
        <Badge backgroundColor="danger100" textColor="danger600">
          Banned
        </Badge>
      )}
    </Flex>
  );

  const profileFooter =
    activeTab === "profile" ? (
      <>
        <Button
          variant="tertiary"
          onClick={() => {
            setEditName(undefined);
            setEditEmail(undefined);
            setEditEmailVerified(undefined);
            setEditImage(undefined);
            setEditExtra({});
          }}
        >
          Discard
        </Button>
        <Button
          disabled={!hasEdits}
          loading={updateMutation.isLoading}
          onClick={() => updateMutation.mutate()}
          data-testid="save-user-btn"
        >
          Save changes
        </Button>
      </>
    ) : undefined;

  return (
    <Drawer
      title={drawerTitle}
      footer={profileFooter}
      onClose={onClose}
      data-testid="user-detail-drawer"
    >
      {userQuery.isLoading ? (
        <Flex justifyContent="center" padding={8}>
          <Typography textColor="neutral500">Loading user…</Typography>
        </Flex>
      ) : userQuery.isError ? (
        <Alert closeLabel="Close" title="Failed to load user" variant="danger">
          {userQuery.error instanceof Error
            ? userQuery.error.message
            : "An error occurred"}
        </Alert>
      ) : (
        <Tabs.Root defaultValue="profile" onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
            <Tabs.Trigger value="security">Security</Tabs.Trigger>
            {banEnabled && <Tabs.Trigger value="ban">Ban</Tabs.Trigger>}
            <Tabs.Trigger value="sessions">Sessions</Tabs.Trigger>
            <Tabs.Trigger value="organizations">Organizations</Tabs.Trigger>
          </Tabs.List>

          {/* ── Profile ── */}
          <Tabs.Content value="profile">
            <EditLayout>
              {/* Left: editable fields */}
              <Flex direction="column" gap={5}>
                <FormSection>
                  <SectionLabel>Personal information</SectionLabel>
                  <Field.Root style={{ width: "100%" }}>
                    <Field.Label>Full name</Field.Label>
                    <TextInput
                      value={displayName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditName(e.target.value)
                      }
                      data-testid="user-name-input"
                    />
                  </Field.Root>
                  <Field.Root style={{ width: "100%" }}>
                    <Field.Label>Email address</Field.Label>
                    <TextInput
                      type="email"
                      value={displayEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditEmail(e.target.value)
                      }
                    />
                  </Field.Root>
                  <MediaPickerField
                    label="Avatar URL"
                    name="image"
                    value={displayImage}
                    onChange={setEditImage}
                    placeholder="https://example.com/avatar.png"
                    hint="Optional — publicly accessible image URL"
                  />
                  <Checkbox
                    checked={displayEmailVerified}
                    onCheckedChange={(checked: boolean) =>
                      setEditEmailVerified(checked)
                    }
                  >
                    Mark email as verified
                  </Checkbox>
                </FormSection>

                <CustomFieldsSection
                  fields={customFields}
                  data={extraData}
                  onChange={handleExtraChange}
                />
              </Flex>

              {/* Right: metadata + email actions */}
              <EditSidebar>
                <FormSection>
                  <SectionLabel>Details</SectionLabel>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <MetaItem style={{ gridColumn: "1 / -1" }}>
                      <MetaKey>User ID</MetaKey>
                      <MonoChip>{user?.id}</MonoChip>
                    </MetaItem>
                    <MetaItem>
                      <MetaKey>Created</MetaKey>
                      <MetaVal>
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleString()
                          : "—"}
                      </MetaVal>
                    </MetaItem>
                    <MetaItem>
                      <MetaKey>Last updated</MetaKey>
                      <MetaVal>
                        {user?.updatedAt
                          ? new Date(user.updatedAt).toLocaleString()
                          : "—"}
                      </MetaVal>
                    </MetaItem>
                  </div>
                </FormSection>

                {emailVerificationEnabled && (
                  <Box>
                    <SectionLabel style={{ marginBottom: 10 }}>
                      Email actions
                    </SectionLabel>
                    <Flex direction="column" gap={2}>
                      <Button
                        variant="secondary"
                        size="S"
                        loading={sendVerificationMutation.isLoading}
                        disabled={user?.emailVerified}
                        onClick={() => sendVerificationMutation.mutate()}
                        style={{ width: "100%" }}
                      >
                        Send verification email
                      </Button>
                      <Button
                        variant="secondary"
                        size="S"
                        loading={sendResetPasswordMutation.isLoading}
                        onClick={() => sendResetPasswordMutation.mutate()}
                        style={{ width: "100%" }}
                      >
                        Send password reset
                      </Button>
                    </Flex>
                  </Box>
                )}
              </EditSidebar>
            </EditLayout>
          </Tabs.Content>

          {/* ── Security ── */}
          <Tabs.Content value="security">
            <Flex direction="column" gap={5} paddingTop={6}>
              {/* Password */}
              <Box>
                <SectionLabel style={{ marginBottom: 10 }}>
                  Set password
                </SectionLabel>
                <Flex direction="column" gap={3}>
                  <Field.Root hint="The user will be able to sign in with this new password">
                    <Field.Label>New password</Field.Label>
                    <TextInput
                      type="password"
                      value={newPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewPassword(e.target.value)
                      }
                      placeholder="Enter a strong password…"
                    />
                    <Field.Hint />
                  </Field.Root>
                  <Box>
                    <Button
                      disabled={!newPassword}
                      loading={passwordMutation.isLoading}
                      onClick={() => passwordMutation.mutate()}
                    >
                      Set password
                    </Button>
                  </Box>
                </Flex>
              </Box>

              {/* Linked accounts */}
              {user?.account && user.account.length > 0 && (
                <Box>
                  <SectionLabel style={{ marginBottom: 10 }}>
                    Linked accounts
                  </SectionLabel>
                  <Flex direction="column" gap={2}>
                    {user.account.map((acc) => (
                      <AccountRow key={acc.id}>
                        <ProviderBadge>{acc.providerId}</ProviderBadge>
                        <Button
                          variant="danger-light"
                          size="S"
                          onClick={() =>
                            setConfirmUnlinkAccountId(acc.providerId)
                          }
                        >
                          Unlink
                        </Button>
                      </AccountRow>
                    ))}
                  </Flex>
                </Box>
              )}

              {(!user?.account || user.account.length === 0) && (
                <Typography variant="pi" textColor="neutral500">
                  No linked OAuth accounts.
                </Typography>
              )}
            </Flex>
          </Tabs.Content>

          {/* ── Ban ── */}
          {banEnabled && (
            <Tabs.Content value="ban">
              <Flex direction="column" gap={4} paddingTop={6}>
                {user?.banned ? (
                  <>
                    <WarnCard>
                      <Typography
                        variant="omega"
                        fontWeight="semiBold"
                        textColor="danger600"
                      >
                        This user is currently banned
                      </Typography>
                      {user.banReason && (
                        <Typography variant="pi" textColor="danger600">
                          Reason: {user.banReason}
                        </Typography>
                      )}
                      {user.banExpires && (
                        <Typography variant="pi" textColor="danger600">
                          Expires:{" "}
                          {new Date(user.banExpires).toLocaleDateString(
                            undefined,
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </Typography>
                      )}
                      {!user.banExpires && (
                        <Typography variant="pi" textColor="danger600">
                          Duration: Permanent
                        </Typography>
                      )}
                    </WarnCard>
                    <Box>
                      <Button
                        variant="secondary"
                        onClick={() => setConfirmUnban(true)}
                      >
                        Lift ban
                      </Button>
                    </Box>
                  </>
                ) : (
                  <>
                    <Grid.Root gap={4}>
                      <Grid.Item col={12}>
                        <Field.Root
                          hint="Optional — will be shown to the user"
                          style={{ width: "100%" }}
                        >
                          <Field.Label>Reason</Field.Label>
                          <TextInput
                            value={banReason}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => setBanReason(e.target.value)}
                            placeholder="e.g. Violated terms of service"
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
                            placeholder="e.g. 30"
                          />
                          <Field.Hint />
                        </Field.Root>
                      </Grid.Item>
                      <Grid.Item col={6}>
                        {banExpiryPreview ? (
                          <Flex
                            direction="column"
                            justifyContent="flex-end"
                            style={{ height: "100%", paddingBottom: 4 }}
                          >
                            <PreviewPill>
                              ⏱ Expires {banExpiryPreview}
                            </PreviewPill>
                          </Flex>
                        ) : (
                          <Flex
                            direction="column"
                            justifyContent="flex-end"
                            style={{ height: "100%", paddingBottom: 4 }}
                          >
                            <PreviewPill>♾ Permanent ban</PreviewPill>
                          </Flex>
                        )}
                      </Grid.Item>
                    </Grid.Root>

                    <Box>
                      <Button
                        variant="danger"
                        loading={banMutation.isLoading}
                        onClick={() => banMutation.mutate()}
                      >
                        Ban user
                      </Button>
                    </Box>
                  </>
                )}
              </Flex>
            </Tabs.Content>
          )}

          {/* ── Sessions ── */}
          <Tabs.Content value="sessions">
            <Flex direction="column" gap={4} paddingTop={6}>
              <Box
                background="neutral50"
                padding={4}
                hasRadius
                borderColor="neutral150"
                borderStyle="solid"
                borderWidth="1px"
              >
                <Flex
                  justifyContent="space-between"
                  alignItems="center"
                  gap={4}
                >
                  <Flex direction="column" gap={1}>
                    <Typography variant="omega" fontWeight="semiBold">
                      Revoke all sessions
                    </Typography>
                    <Typography variant="pi" textColor="neutral500">
                      Signs the user out immediately on all devices.
                    </Typography>
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
            </Flex>
          </Tabs.Content>

          {/* ── Organizations ── */}
          <Tabs.Content value="organizations">
            <Flex direction="column" gap={3} paddingTop={6}>
              {orgsQuery.isLoading ? (
                <Typography textColor="neutral500">Loading…</Typography>
              ) : (orgsQuery.data ?? []).length === 0 ? (
                <Box
                  background="neutral50"
                  padding={6}
                  hasRadius
                  borderColor="neutral150"
                  borderStyle="solid"
                  borderWidth="1px"
                >
                  <Flex justifyContent="center">
                    <Typography textColor="neutral500">
                      Not a member of any organizations.
                    </Typography>
                  </Flex>
                </Box>
              ) : (
                (orgsQuery.data ?? []).map((org) =>
                  org ? (
                    <Box
                      key={org.id}
                      padding={4}
                      background="neutral0"
                      hasRadius
                      borderColor="neutral150"
                      borderStyle="solid"
                      borderWidth="1px"
                    >
                      <Flex justifyContent="space-between" alignItems="center">
                        <Flex direction="column" gap={1}>
                          <Typography variant="omega" fontWeight="semiBold">
                            {org.name}
                          </Typography>
                          <Typography variant="pi" textColor="neutral500">
                            {org.role.charAt(0).toUpperCase() +
                              org.role.slice(1)}
                            {org.teams.length > 0
                              ? ` · ${org.teams.length} team${org.teams.length !== 1 ? "s" : ""}`
                              : ""}
                          </Typography>
                        </Flex>
                      </Flex>
                    </Box>
                  ) : null,
                )
              )}
            </Flex>
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
          title="Lift ban"
          message="Are you sure you want to lift the ban on this user? They will be able to sign in again."
          confirmLabel="Lift ban"
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
          onConfirm={() => unlinkAccountMutation.mutate(confirmUnlinkAccountId)}
          onCancel={() => setConfirmUnlinkAccountId(null)}
        />
      )}
    </Drawer>
  );
}
