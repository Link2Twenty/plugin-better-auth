import {
  Box,
  Button,
  Field,
  Flex,
  Grid,
  Link,
  Textarea,
  TextInput,
  Typography,
} from "@strapi/design-system";
import { ArrowLeft, Check } from "@strapi/icons";
import {
  Layouts,
  Page,
  useFetchClient,
  useNotification,
  useRBAC,
} from "@strapi/strapi/admin";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { Permissions, type PermissionsRef } from "./components/Permissions";
import { PERMISSIONS } from "./constants";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import { ROLES_BASE } from "./paths";
import { apiToFormState, type PermissionsLayout } from "./utils/transform";

type RoleData = {
  name?: string;
  description?: string;
  nb_users?: number;
  permissions?: Record<
    string,
    { controllers: Record<string, Record<string, { enabled: boolean }>> }
  >;
};

export const RolesEditPage = ({ id }: { id: string }) => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const { get, put } = useFetchClient();
  const permissionsRef = useRef<PermissionsRef>(null);
  const goBack = () => {
    if (typeof window !== "undefined") window.location.href = ROLES_BASE;
  };

  const {
    allowedActions: { canUpdate },
  } = useRBAC({
    update: PERMISSIONS.updateRole,
  });

  const [data, setData] = useState<RoleData | null>(null);
  const [layout, setLayout] = useState<PermissionsLayout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([
      get("/api-permissions/permissions-layout"),
      get(`/api-permissions/roles/${id}`),
    ])
      .then(([layoutRes, roleRes]) => {
        const sections =
          layoutRes.data?.data?.sections ??
          layoutRes.data?.sections ??
          layoutRes.data;
        const role = roleRes.data?.role;
        if (!cancelled && sections) {
          setLayout(sections);
        }
        if (!cancelled && role) {
          setData(role);
          setName(role.name ?? "");
          setDescription(role.description ?? "");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, get]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || name.length < 3) {
      setError(
        formatMessage({
          id: "form.validation.required",
          defaultMessage: "This value is required",
        }),
      );
      return;
    }
    setIsSaving(true);
    try {
      const permissionsToSend =
        permissionsRef.current?.getPermissions() ?? data?.permissions ?? {};
      await put(`/api-permissions/roles/${id}`, {
        name,
        description,
        permissions: permissionsToSend,
      });
      toggleNotification({
        type: "success",
        message: formatMessage({
          id: "notification.success.saved",
          defaultMessage: "Saved",
        }),
      });
      goBack();
    } catch {
      toggleNotification({
        type: "danger",
        message: formatMessage({
          id: "notification.error",
          defaultMessage: "An error occurred",
        }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !data || !layout) {
    return <Page.Loading />;
  }

  if (!canUpdate) {
    return <Page.NoPermissions />;
  }

  const permissionsForm = apiToFormState(data.permissions ?? {}, layout);
  const usersCount = data.nb_users ?? 0;

  return (
    <Page.Main>
      <Page.Title>
        {formatMessage(
          { id: "Settings.PageTitle", defaultMessage: "Settings - {name}" },
          { name: "Roles" },
        )}
      </Page.Title>
      <form onSubmit={handleSubmit}>
        <Layouts.Header
          title={formatMessage({
            id: "Settings.roles.edit.title",
            defaultMessage: "Edit a role",
          })}
          subtitle={formatMessage({
            id: "Settings.roles.create.description",
            defaultMessage: "Define the rights given to the role",
          })}
          primaryAction={
            <Button type="submit" loading={isSaving} startIcon={<Check />}>
              {formatMessage({ id: "global.save", defaultMessage: "Save" })}
            </Button>
          }
          navigationAction={
            <Link
              href={ROLES_BASE}
              startIcon={<ArrowLeft />}
              onClick={(e) => {
                e.preventDefault();
                goBack();
              }}
            >
              {formatMessage({ id: "global.back", defaultMessage: "Back" })}
            </Link>
          }
        />
        <Layouts.Content>
          <Flex direction="column" alignItems="stretch" gap={6}>
            <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
              <Flex direction="column" alignItems="stretch" gap={4}>
                <Flex justifyContent="space-between">
                  <Box>
                    <Typography fontWeight="bold">
                      {formatMessage({ id: "global.details", defaultMessage: "Details" })}
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      {formatMessage({
                        id: "Settings.roles.form.description",
                        defaultMessage: "Name and description of the role",
                      })}
                    </Typography>
                  </Box>
                  <Box
                    padding={2}
                    paddingLeft={4}
                    paddingRight={4}
                    background="primary100"
                    style={{
                      border: "1px solid var(--strapi-colors-primary200)",
                      borderRadius: "var(--strapi-border-radius)",
                      color: "var(--strapi-colors-primary600)",
                      fontWeight: 600,
                    }}
                  >
                    {formatMessage(
                      {
                        id: "Settings.roles.form.button.users-with-role",
                        defaultMessage:
                          "{number, plural, =0 {# users} one {# user} other {# users}} with this role",
                      },
                      { number: usersCount },
                    )}
                  </Box>
                </Flex>
                <Grid.Root gap={4}>
                  <Grid.Item xs={12} col={6} direction="column" alignItems="stretch">
                    <Field.Root
                      name="name"
                      error={
                        error
                          ? formatMessage({
                              id: "form.validation.required",
                              defaultMessage: "This value is required",
                            })
                          : undefined
                      }
                      required
                    >
                      <Field.Label>
                        {formatMessage({ id: "global.name", defaultMessage: "Name" })}
                      </Field.Label>
                      <TextInput value={name} onChange={(e) => setName(e.target.value)} type="text" />
                      <Field.Error />
                    </Field.Root>
                  </Grid.Item>
                  <Grid.Item xs={12} col={6} direction="column" alignItems="stretch">
                    <Field.Root name="description">
                      <Field.Label>
                        {formatMessage({ id: "global.description", defaultMessage: "Description" })}
                      </Field.Label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                      <Field.Error />
                    </Field.Root>
                  </Grid.Item>
                </Grid.Root>
              </Flex>
            </Box>
            <Box shadow="filterShadow" hasRadius>
              <PermissionsProvider permissions={permissionsForm}>
                <Permissions ref={permissionsRef} permissions={permissionsForm} layout={layout} />
              </PermissionsProvider>
            </Box>
          </Flex>
        </Layouts.Content>
      </form>
    </Page.Main>
  );
};

export const ProtectedRolesEditPage = ({ id }: { id: string }) => (
  <Page.Protect permissions={PERMISSIONS.accessRoles}>
    <RolesEditPage id={id} />
  </Page.Protect>
);
