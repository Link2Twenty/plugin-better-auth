import {
  Button,
  Dialog,
  EmptyStateLayout,
  Flex,
  IconButton,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Typography,
} from "@strapi/design-system";
import { Eye, Plus, Trash } from "@strapi/icons";
import { Layouts, Page, useNotification } from "@strapi/strapi/admin";
import { useState } from "react";
import { useIntl } from "react-intl";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { client } from "../../client";
import { CreateOrganizationDialog } from "./CreateOrganizationDialog";
import { OrganizationDetail } from "./OrganizationDetail";

const PLUGIN_ID = "better-auth-dashboard";

export const OrganizationsPage = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const queryClient = useQueryClient();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedOrgName, setSelectedOrgName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery(
    [PLUGIN_ID, "organizations"],
    async () => {
      const result = await client.dash.listOrganizations({ query: {} });
      if (result.error) throw new Error(result.error.message ?? "Failed to load organizations");
      return result.data;
    },
  );

  const deleteMutation = useMutation(
    async (organizationId: string) => {
      const result = await client.dash.organization.delete({ organizationId });
      if (result.error) throw new Error(result.error.message ?? "Failed to delete organization");
      return result.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([PLUGIN_ID, "organizations"]);
        setConfirmDelete(null);
        toggleNotification({
          type: "success",
          message: formatMessage({
            id: `${PLUGIN_ID}.organizations.delete.success`,
            defaultMessage: "Organization deleted",
          }),
        });
      },
      onError: () => {
        toggleNotification({
          type: "danger",
          message: formatMessage({
            id: `${PLUGIN_ID}.organizations.delete.error`,
            defaultMessage: "Failed to delete organization",
          }),
        });
      },
    },
  );

  if (isLoading) return <Page.Loading />;
  if (error) return <Page.Error />;

  if (selectedOrgId) {
    return (
      <Page.Main>
        <Page.Title>{selectedOrgName}</Page.Title>
        <Layouts.Header
          title={selectedOrgName}
          subtitle={formatMessage({
            id: `${PLUGIN_ID}.Settings.organizations`,
            defaultMessage: "Organizations",
          })}
        />
        <Layouts.Content>
          <OrganizationDetail
            orgId={selectedOrgId}
            onBack={() => {
              setSelectedOrgId(null);
              setSelectedOrgName("");
            }}
          />
        </Layouts.Content>
      </Page.Main>
    );
  }

  const organizations = data?.organizations ?? [];
  const total = data?.total ?? 0;

  return (
    <Page.Main>
      <Page.Title>
        {formatMessage({
          id: `${PLUGIN_ID}.Settings.organizations`,
          defaultMessage: "Organizations - Better Auth",
        })}
      </Page.Title>
      <Layouts.Header
        title={formatMessage({
          id: `${PLUGIN_ID}.Settings.organizations`,
          defaultMessage: "Organizations",
        })}
        subtitle={formatMessage(
          {
            id: `${PLUGIN_ID}.Settings.organizations.subtitle`,
            defaultMessage: "{total} organizations in total",
          },
          { total },
        )}
        primaryAction={
          <Button startIcon={<Plus />} onClick={() => setShowCreateDialog(true)} size="S">
            {formatMessage({
              id: `${PLUGIN_ID}.organizations.create.button`,
              defaultMessage: "Create organization",
            })}
          </Button>
        }
      />
      <Layouts.Content>
        {organizations.length > 0 ? (
          <Table colCount={5} rowCount={organizations.length + 1}>
            <Thead>
              <Tr>
                <Th>
                  <Typography variant="sigma" textColor="neutral600">
                    {formatMessage({ id: "global.name", defaultMessage: "Name" })}
                  </Typography>
                </Th>
                <Th>
                  <Typography variant="sigma" textColor="neutral600">Slug</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma" textColor="neutral600">Members</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma" textColor="neutral600">
                    {formatMessage({
                      id: "app.components.ListViewTable.createdAt",
                      defaultMessage: "Created At",
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
              {organizations.map((org) => (
                <Tr key={org.id}>
                  <Td>
                    <Typography textColor="neutral800" fontWeight="semiBold">
                      {org.name}
                    </Typography>
                  </Td>
                  <Td>
                    <Typography textColor="neutral800">{org.slug}</Typography>
                  </Td>
                  <Td>
                    <Typography textColor="neutral800">{org.memberCount}</Typography>
                  </Td>
                  <Td>
                    <Typography textColor="neutral800">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </Typography>
                  </Td>
                  <Td>
                    <Flex gap={2}>
                      <IconButton
                        label={formatMessage({
                          id: `${PLUGIN_ID}.organizations.view`,
                          defaultMessage: "View",
                        })}
                        onClick={() => {
                          setSelectedOrgId(org.id);
                          setSelectedOrgName(org.name);
                        }}
                      >
                        <Eye />
                      </IconButton>
                      <IconButton
                        label={formatMessage({ id: "global.delete", defaultMessage: "Delete" })}
                        onClick={() => setConfirmDelete(org.id)}
                      >
                        <Trash />
                      </IconButton>
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <EmptyStateLayout
            content={formatMessage({
              id: `${PLUGIN_ID}.organizations.empty`,
              defaultMessage: "No organizations found.",
            })}
            action={
              <Button
                variant="secondary"
                startIcon={<Plus />}
                onClick={() => setShowCreateDialog(true)}
              >
                {formatMessage({
                  id: `${PLUGIN_ID}.organizations.create.button`,
                  defaultMessage: "Create organization",
                })}
              </Button>
            }
          />
        )}
      </Layouts.Content>

      {showCreateDialog && (
        <CreateOrganizationDialog onClose={() => setShowCreateDialog(false)} />
      )}

      {confirmDelete && (
        <Dialog.Root defaultOpen onOpenChange={(open) => !open && setConfirmDelete(null)}>
          <Dialog.Content>
            <Dialog.Header>
              {formatMessage({
                id: `${PLUGIN_ID}.organizations.delete.confirm.title`,
                defaultMessage: "Delete organization",
              })}
            </Dialog.Header>
            <Dialog.Body>
              <Typography>
                {formatMessage({
                  id: `${PLUGIN_ID}.organizations.delete.confirm.message`,
                  defaultMessage:
                    "Are you sure you want to delete this organization? This action cannot be undone.",
                })}
              </Typography>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="tertiary" onClick={() => setConfirmDelete(null)}>
                {formatMessage({ id: "app.components.Button.cancel", defaultMessage: "Cancel" })}
              </Button>
              <Button
                variant="danger"
                loading={deleteMutation.isLoading}
                onClick={() => deleteMutation.mutate(confirmDelete)}
              >
                {formatMessage({ id: "global.delete", defaultMessage: "Delete" })}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>
      )}
    </Page.Main>
  );
};

export default OrganizationsPage;
