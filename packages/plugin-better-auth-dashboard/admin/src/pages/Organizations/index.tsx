import {
  Button,
  EmptyStateLayout,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Typography,
} from "@strapi/design-system";
import { Plus } from "@strapi/icons";
import { Layouts, Page } from "@strapi/strapi/admin";
import { useState } from "react";
import { useIntl } from "react-intl";
import { useQuery } from "react-query";
import { client } from "../../client";
import { CreateOrganizationDialog } from "./CreateOrganizationDialog";

const PLUGIN_ID = "better-auth-dashboard";

interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  logo?: string | null;
  memberCount: number;
}

export const OrganizationsPage = () => {
  const { formatMessage } = useIntl();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data, isLoading, error } = useQuery(
    [PLUGIN_ID, "organizations"],
    async () => client.dash.listOrganizations({ query: {} }),
  );

  if (isLoading) return <Page.Loading />;
  if (error) return <Page.Error />;

  const organizations = data?.data?.organizations ?? [];

  return (
    <Page.Main>
      <Page.Title>
        {formatMessage({
          id: `${PLUGIN_ID}.Settings.organizations`,
          defaultMessage: "Settings - Organizations",
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
          { total: data?.data?.total ?? 0 },
        )}
        primaryAction={
          <Button
            startIcon={<Plus />}
            onClick={() => setShowCreateDialog(true)}
            size="S"
          >
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
                    ID
                  </Typography>
                </Th>
                <Th>
                  <Typography variant="sigma" textColor="neutral600">
                    {formatMessage({
                      id: "global.name",
                      defaultMessage: "Name",
                    })}
                  </Typography>
                </Th>
                <Th>
                  <Typography variant="sigma" textColor="neutral600">
                    Slug
                  </Typography>
                </Th>
                <Th>
                  <Typography variant="sigma" textColor="neutral600">
                    Members
                  </Typography>
                </Th>
                <Th>
                  <Typography variant="sigma" textColor="neutral600">
                    {formatMessage({
                      id: "app.components.ListViewTable.createdAt",
                      defaultMessage: "Created At",
                    })}
                  </Typography>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {organizations.map((org) => (
                <Tr key={org.id}>
                  <Td>
                    <Typography textColor="neutral800">{org.id}</Typography>
                  </Td>
                  <Td>
                    <Typography textColor="neutral800" fontWeight="semiBold">
                      {org.name}
                    </Typography>
                  </Td>
                  <Td>
                    <Typography textColor="neutral800">{org.slug}</Typography>
                  </Td>
                  <Td>
                    <Typography textColor="neutral800">
                      {org.memberCount}
                    </Typography>
                  </Td>
                  <Td>
                    <Typography textColor="neutral800">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </Typography>
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
    </Page.Main>
  );
};

export default OrganizationsPage;
