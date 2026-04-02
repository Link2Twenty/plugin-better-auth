import {
  Alert,
  Box,
  Button,
  Flex,
  Loader,
  Typography,
} from "@strapi/design-system";
import React from "react";
import { useQuery } from "react-query";
import { client } from "../client";
import { hasPlugin, useDashConfig } from "../hooks/useDashConfig";
import { OrganizationsPage } from "./Organizations";
import { OverviewPage } from "./Overview";
import { SessionsPage } from "./Sessions";
import { UsersPage } from "./Users";

type TabId = "overview" | "users" | "organizations" | "sessions";

function NavItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="S"
      onClick={onClick}
      style={{ fontWeight: active ? 600 : 400 }}
    >
      {children}
    </Button>
  );
}

export function App() {
  const [activeTab, setActiveTab] = React.useState<TabId>("overview");
  const { data: config, isLoading, isError, error } = useDashConfig();

  // Check if org plugin is enabled and fetch org options for teams
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
    <Box background="neutral100" minHeight="100vh">
      {/* Header */}
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
          paddingBottom={2}
        >
          <Typography variant="beta" textColor="neutral800">
            Better Auth Dashboard
          </Typography>
          <Typography variant="pi" textColor="neutral500">
            {config.basePath}
          </Typography>
        </Flex>

        <Flex gap={1} paddingTop={2}>
          <NavItem
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </NavItem>
          <NavItem
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          >
            Users
          </NavItem>
          {orgEnabled && (
            <NavItem
              active={activeTab === "organizations"}
              onClick={() => setActiveTab("organizations")}
            >
              Organizations
            </NavItem>
          )}
          <NavItem
            active={activeTab === "sessions"}
            onClick={() => setActiveTab("sessions")}
          >
            Sessions
          </NavItem>
        </Flex>
      </Box>

      {/* Content */}
      <Box>
        {activeTab === "overview" && <OverviewPage />}
        {activeTab === "users" && <UsersPage config={config} />}
        {activeTab === "organizations" && orgEnabled && (
          <OrganizationsPage teamsEnabled={teamsEnabled} />
        )}
        {activeTab === "sessions" && <SessionsPage />}
      </Box>
    </Box>
  );
}
