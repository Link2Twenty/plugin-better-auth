import {
  Alert,
  Box,
  Flex,
  Loader,
  Tabs,
  Typography,
} from "@strapi/design-system";
import { useQuery } from "react-query";
import { client } from "../client";
import { hasPlugin, useDashConfig } from "../hooks/useDashConfig";
import { OrganizationsPage } from "./Organizations";
import { OverviewPage } from "./Overview";
import { SessionsPage } from "./Sessions";
import { UsersPage } from "./Users";

export function App() {
  const { data: config, isLoading, isError, error } = useDashConfig();

  const orgEnabled = hasPlugin(config, "organization");

  const orgOptionsQuery = useQuery({
    queryKey: ["dash-org-options"],
    queryFn: async () => {
      const result = await client.dash.organization.options();
      if (result.error) return { teamsEnabled: false };
      return result.data ?? { teamsEnabled: false };
    },
    enabled: orgEnabled,
  });

  const teamsEnabled = orgEnabled
    ? (orgOptionsQuery.data?.teamsEnabled ?? false)
    : false;

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" padding={12}>
        <Loader>Loading Better Auth dashboard…</Loader>
      </Flex>
    );
  }

  if (isError) {
    return (
      <Box padding={6}>
        <Alert
          closeLabel="Close"
          title="Error loading configuration"
          variant="danger"
        >
          {(error as Error)?.message}
        </Alert>
      </Box>
    );
  }

  if (!config) return null;

  return (
    <Box background="neutral100" minHeight="100vh" data-testid="dashboard-root">
      <Tabs.Root defaultValue="overview">
        <Box
          background="neutral0"
          borderColor="neutral150"
          borderStyle="solid"
          borderWidth="1px"
          paddingLeft={6}
          paddingRight={6}
          paddingTop={4}
          paddingBottom={0}
        >
          <Flex
            justifyContent="space-between"
            alignItems="center"
            paddingBottom={4}
          >
            <Typography variant="beta" textColor="neutral800">
              Better Auth Dashboard
            </Typography>
            <Typography variant="pi" textColor="neutral500">
              {config.basePath}
            </Typography>
          </Flex>
          <Tabs.List aria-label="Dashboard navigation" data-testid="main-nav">
            <Tabs.Trigger value="overview" data-testid="nav-overview">
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger value="users" data-testid="nav-users">
              Users
            </Tabs.Trigger>
            {orgEnabled && (
              <Tabs.Trigger
                value="organizations"
                data-testid="nav-organizations"
              >
                Organizations
              </Tabs.Trigger>
            )}
            <Tabs.Trigger value="sessions" data-testid="nav-sessions">
              Sessions
            </Tabs.Trigger>
          </Tabs.List>
        </Box>

        <Tabs.Content value="overview" data-testid="tab-overview">
          <OverviewPage />
        </Tabs.Content>
        <Tabs.Content value="users" data-testid="tab-users">
          <UsersPage config={config} />
        </Tabs.Content>
        {orgEnabled && (
          <Tabs.Content value="organizations" data-testid="tab-organizations">
            <OrganizationsPage teamsEnabled={teamsEnabled} />
          </Tabs.Content>
        )}
        <Tabs.Content value="sessions" data-testid="tab-sessions">
          <SessionsPage />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
