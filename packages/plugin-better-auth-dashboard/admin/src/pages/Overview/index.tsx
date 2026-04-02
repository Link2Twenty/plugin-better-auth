import { Box, Flex, Typography } from "@strapi/design-system";
import { Layouts, Page } from "@strapi/strapi/admin";
import { useIntl } from "react-intl";
import { useQuery } from "react-query";
import { client } from "../../client";

const PLUGIN_ID = "better-auth-dashboard";

function StatCard({ label, value, subtitle }: { label: string; value: number; subtitle?: string }) {
  return (
    <Box
      background="neutral0"
      shadow="filterShadow"
      padding={6}
      borderRadius="4px"
      style={{ flex: "1 1 200px", minWidth: 160 }}
    >
      <Typography variant="omega" textColor="neutral600">
        {label}
      </Typography>
      <Box marginTop={2}>
        <Typography variant="alpha" textColor="neutral800" fontWeight="bold">
          {value.toLocaleString()}
        </Typography>
      </Box>
      {subtitle && (
        <Box marginTop={1}>
          <Typography variant="pi" textColor="neutral500">
            {subtitle}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function UserBarChart({
  data,
}: {
  data: { label: string; newUsers: number; totalUsers: number }[];
}) {
  const maxValue = Math.max(...data.map((d) => d.newUsers), 1);
  const barCount = data.length;
  const chartWidth = 560;
  const chartHeight = 160;
  const barSlot = chartWidth / barCount;
  const barWidth = barSlot * 0.6;
  const barGap = barSlot * 0.4;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`}
      style={{ width: "100%", overflow: "visible" }}
      aria-label="New users per day"
    >
      {data.map((point, i) => {
        const barHeight = Math.max((point.newUsers / maxValue) * chartHeight, 2);
        const x = i * barSlot + barGap / 2;
        const y = chartHeight - barHeight;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barHeight} fill="#4945FF" rx={3} />
            <text
              x={x + barWidth / 2}
              y={chartHeight + 18}
              textAnchor="middle"
              fontSize={9}
              fill="#666879"
            >
              {point.label}
            </text>
            {point.newUsers > 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={9}
                fill="#4945FF"
              >
                {point.newUsers}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export const OverviewPage = () => {
  const { formatMessage } = useIntl();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery(
    [PLUGIN_ID, "user-stats"],
    async () => {
      const result = await client.dash.userStats();
      if (result.error) throw new Error(result.error.message ?? "Failed to load stats");
      return result.data;
    },
  );

  const { data: graphData } = useQuery(
    [PLUGIN_ID, "user-graph-data"],
    async () => {
      const result = await client.dash.userGraphData({ query: { period: "daily" } });
      if (result.error) throw new Error(result.error.message ?? "Failed to load graph data");
      return result.data;
    },
  );

  if (statsLoading) return <Page.Loading />;
  if (statsError) return <Page.Error />;

  return (
    <Page.Main>
      <Page.Title>
        {formatMessage({
          id: `${PLUGIN_ID}.Settings.overview`,
          defaultMessage: "Overview - Better Auth",
        })}
      </Page.Title>
      <Layouts.Header
        title={formatMessage({
          id: `${PLUGIN_ID}.Settings.overview`,
          defaultMessage: "Overview",
        })}
        subtitle={formatMessage({
          id: `${PLUGIN_ID}.overview.subtitle`,
          defaultMessage: "User statistics and activity",
        })}
      />
      <Layouts.Content>
        <Flex gap={4} wrap="wrap" marginBottom={8}>
          <StatCard
            label={formatMessage({ id: `${PLUGIN_ID}.overview.totalUsers`, defaultMessage: "Total Users" })}
            value={stats?.total ?? 0}
          />
          <StatCard
            label={formatMessage({ id: `${PLUGIN_ID}.overview.dailySignups`, defaultMessage: "New Today" })}
            value={stats?.daily.signUps ?? 0}
            subtitle={`${stats?.daily.percentage ?? 0}% vs previous`}
          />
          <StatCard
            label={formatMessage({ id: `${PLUGIN_ID}.overview.weeklySignups`, defaultMessage: "New This Week" })}
            value={stats?.weekly.signUps ?? 0}
            subtitle={`${stats?.weekly.percentage ?? 0}% vs previous`}
          />
          <StatCard
            label={formatMessage({ id: `${PLUGIN_ID}.overview.monthlySignups`, defaultMessage: "New This Month" })}
            value={stats?.monthly.signUps ?? 0}
            subtitle={`${stats?.monthly.percentage ?? 0}% vs previous`}
          />
          <StatCard
            label={formatMessage({ id: `${PLUGIN_ID}.overview.dailyActive`, defaultMessage: "Daily Active" })}
            value={stats?.activeUsers.daily.active ?? 0}
            subtitle={`${stats?.activeUsers.daily.percentage ?? 0}% of total`}
          />
          <StatCard
            label={formatMessage({ id: `${PLUGIN_ID}.overview.monthlyActive`, defaultMessage: "Monthly Active" })}
            value={stats?.activeUsers.monthly.active ?? 0}
            subtitle={`${stats?.activeUsers.monthly.percentage ?? 0}% of total`}
          />
        </Flex>

        {graphData && graphData.data.length > 0 && (
          <Box background="neutral0" shadow="filterShadow" padding={6} borderRadius="4px">
            <Box marginBottom={4}>
              <Typography variant="delta" textColor="neutral800">
                {formatMessage({
                  id: `${PLUGIN_ID}.overview.newUsersChart`,
                  defaultMessage: "New Users (Daily)",
                })}
              </Typography>
            </Box>
            <UserBarChart data={graphData.data} />
          </Box>
        )}
      </Layouts.Content>
    </Page.Main>
  );
};

export default OverviewPage;
