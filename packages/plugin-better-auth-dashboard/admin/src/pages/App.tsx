import {
  Alert,
  Box,
  Flex,
  Loader,
  Tabs,
  Typography,
} from "@strapi/design-system";
import { useQuery } from "react-query";
import styled from "styled-components";
import { client } from "../client";
import { hasPlugin, useDashConfig } from "../hooks/useDashConfig";
import { OrganizationsPage } from "./Organizations";
import { OverviewPage } from "./Overview";
import { SessionsPage } from "./Sessions";
import { UsersPage } from "./Users";

const Accent = styled.div`
  height: 3px;
  background: linear-gradient(90deg, #4945ff 0%, #7b79ff 55%, #9593ff 100%);
  flex-shrink: 0;
`;

const BrandIcon = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: linear-gradient(135deg, #4945ff 0%, #7b79ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 900;
  flex-shrink: 0;
  letter-spacing: -0.06em;
  user-select: none;
`;

const PathTag = styled.code`
  padding: 2px 8px;
  background: #f0f0ff;
  border: 1px solid #d9d8ff;
  border-radius: 4px;
  font-size: 11px;
  color: #4945ff;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-weight: 500;
`;

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
          style={{ overflow: "hidden" }}
        >
          <Accent />
          <Box
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
              <Flex gap={2} alignItems="center">
                <BrandIcon>BA</BrandIcon>
                <Box>
                  <Typography variant="beta" textColor="neutral800">
                    Better Auth
                  </Typography>
                  <Box paddingTop="2px">
                    <Typography variant="pi" textColor="neutral500">
                      Authentication Dashboard
                    </Typography>
                  </Box>
                </Box>
              </Flex>
              <PathTag>{config.basePath}</PathTag>
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
