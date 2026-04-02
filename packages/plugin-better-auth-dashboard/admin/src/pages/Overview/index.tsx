import {
  Alert,
  Box,
  Field,
  Flex,
  Grid,
  Loader,
  SingleSelect,
  SingleSelectOption,
  Typography,
} from "@strapi/design-system";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { client } from "../../client";

function StatCard({
  title,
  value,
  sub,
  positive,
}: {
  title: string;
  value: string | number;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <Box
      background="neutral0"
      shadow="filterShadow"
      padding={6}
      hasRadius
      borderColor="neutral150"
      borderStyle="solid"
      borderWidth="1px"
    >
      <Typography variant="sigma" textColor="neutral600">
        {title}
      </Typography>
      <Box paddingTop={2} paddingBottom={1}>
        <Typography variant="alpha" textColor="neutral800">
          {value}
        </Typography>
      </Box>
      {sub !== undefined && (
        <Typography
          variant="pi"
          textColor={positive ? "success600" : "danger600"}
        >
          {sub}
        </Typography>
      )}
    </Box>
  );
}

function formatPct(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}% vs previous period`;
}

export function OverviewPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">(
    "weekly",
  );

  const statsQuery = useQuery({
    queryKey: ["dash-user-stats"],
    queryFn: async () => {
      const result = await client.dash.userStats();
      if (result.error)
        throw new Error(result.error.message ?? "Failed to load stats");
      return result.data;
    },
  });

  const graphQuery = useQuery({
    queryKey: ["dash-user-graph", period],
    queryFn: async () => {
      const result = await client.dash.userGraphData({ query: { period } });
      if (result.error)
        throw new Error(result.error.message ?? "Failed to load graph data");
      return result.data;
    },
  });

  if (statsQuery.isLoading) {
    return (
      <Flex justifyContent="center" padding={8}>
        <Loader>Loading stats…</Loader>
      </Flex>
    );
  }

  if (statsQuery.isError) {
    return (
      <Alert closeLabel="Close" title="Error" variant="danger">
        {statsQuery.error instanceof Error
          ? statsQuery.error.message
          : "An error occurred"}
      </Alert>
    );
  }

  const stats = statsQuery.data;
  if (!stats) return null;

  const graphData = graphQuery.data?.data ?? [];

  return (
    <Box padding={6}>
      <Box paddingBottom={6}>
        <Typography variant="beta" textColor="neutral800">
          Overview
        </Typography>
      </Box>

      <Grid.Root gap={4}>
        <Grid.Item col={3} s={6} xs={12}>
          <StatCard title="Total Users" value={stats.total} />
        </Grid.Item>
        <Grid.Item col={3} s={6} xs={12}>
          <StatCard
            title="Daily Sign-ups"
            value={stats.daily.signUps}
            sub={formatPct(stats.daily.percentage)}
            positive={stats.daily.percentage >= 0}
          />
        </Grid.Item>
        <Grid.Item col={3} s={6} xs={12}>
          <StatCard
            title="Weekly Sign-ups"
            value={stats.weekly.signUps}
            sub={formatPct(stats.weekly.percentage)}
            positive={stats.weekly.percentage >= 0}
          />
        </Grid.Item>
        <Grid.Item col={3} s={6} xs={12}>
          <StatCard
            title="Monthly Sign-ups"
            value={stats.monthly.signUps}
            sub={formatPct(stats.monthly.percentage)}
            positive={stats.monthly.percentage >= 0}
          />
        </Grid.Item>

        <Grid.Item col={3} s={6} xs={12}>
          <StatCard
            title="Daily Active"
            value={stats.activeUsers.daily.active}
            sub={formatPct(stats.activeUsers.daily.percentage)}
            positive={stats.activeUsers.daily.percentage >= 0}
          />
        </Grid.Item>
        <Grid.Item col={3} s={6} xs={12}>
          <StatCard
            title="Weekly Active"
            value={stats.activeUsers.weekly.active}
            sub={formatPct(stats.activeUsers.weekly.percentage)}
            positive={stats.activeUsers.weekly.percentage >= 0}
          />
        </Grid.Item>
        <Grid.Item col={3} s={6} xs={12}>
          <StatCard
            title="Monthly Active"
            value={stats.activeUsers.monthly.active}
            sub={formatPct(stats.activeUsers.monthly.percentage)}
            positive={stats.activeUsers.monthly.percentage >= 0}
          />
        </Grid.Item>
      </Grid.Root>

      <Box paddingTop={8}>
        <Flex
          justifyContent="space-between"
          alignItems="center"
          paddingBottom={4}
        >
          <Typography variant="delta" textColor="neutral800">
            User Growth
          </Typography>
          <Box width="160px">
            <Field.Root>
              <Field.Label>Period</Field.Label>
              <SingleSelect
                value={period}
                onChange={(val) =>
                  setPeriod(val as "daily" | "weekly" | "monthly")
                }
                size="S"
              >
                <SingleSelectOption value="daily">Daily</SingleSelectOption>
                <SingleSelectOption value="weekly">Weekly</SingleSelectOption>
                <SingleSelectOption value="monthly">Monthly</SingleSelectOption>
              </SingleSelect>
            </Field.Root>
          </Box>
        </Flex>

        {graphQuery.isLoading ? (
          <Flex justifyContent="center" padding={4}>
            <Loader>Loading…</Loader>
          </Flex>
        ) : (
          <Box
            background="neutral0"
            shadow="filterShadow"
            padding={4}
            hasRadius
            borderColor="neutral150"
            borderStyle="solid"
            borderWidth="1px"
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Period", "Total Users", "New Users", "Active Users"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          borderBottom: "1px solid #dcdce4",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#666687",
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {graphData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign: "center",
                        padding: "24px",
                        color: "#666687",
                      }}
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  graphData.map((row, i) => (
                    <tr
                      key={i}
                      style={{
                        background: i % 2 === 0 ? "#f6f6f9" : "#ffffff",
                      }}
                    >
                      <td style={{ padding: "8px 12px", fontSize: "14px" }}>
                        {row.label}
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: "14px" }}>
                        {row.totalUsers}
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: "14px" }}>
                        {row.newUsers}
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: "14px" }}>
                        {row.activeUsers}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Box>
        )}
      </Box>
    </Box>
  );
}
