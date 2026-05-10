import {
  Box,
  Flex,
  Loader,
  SingleSelect,
  SingleSelectOption,
  Typography,
} from "@strapi/design-system";
import { useState } from "react";
import { useQuery } from "react-query";
import styled, { keyframes } from "styled-components";
import { client } from "../../client";
import { Avatar } from "../../components/Avatar";

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── Layout ───────────────────────────────────────────────────────────────────

const Wrap = styled.div`
  padding: 28px 32px;
  background: #f6f6f9;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const StatRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  @media (max-width: 1200px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 768px)  { grid-template-columns: repeat(2, 1fr); }
`;

const MainRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 12px;
  @media (max-width: 960px) { grid-template-columns: 1fr; }
`;

const ActiveRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

// ─── Card ────────────────────────────────────────────────────────────────────

const Card = styled.div<{ $delay?: number; $accent?: string }>`
  background: #ffffff;
  border: 1px solid #eaeaef;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  animation: ${fadeUp} 360ms ease both;
  animation-delay: ${(p) => (p.$delay ?? 0) * 55}ms;
  transition: border-color 180ms ease, box-shadow 180ms ease;

  ${(p) =>
    p.$accent &&
    `
    &::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: ${p.$accent};
      z-index: 1;
    }
  `}

  &:hover {
    border-color: #c0bfff;
    box-shadow: 0 2px 16px rgba(73,69,255,0.08);
  }
`;

// ─── Stat card internals ─────────────────────────────────────────────────────

const StatTop = styled.div`
  padding: 18px 18px 10px;
`;

const StatLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8e8ea9;
  margin-bottom: 8px;
`;

const StatValue = styled.div`
  font-size: 30px;
  font-weight: 800;
  color: #32324d;
  line-height: 1;
  letter-spacing: -0.05em;
  font-variant-numeric: tabular-nums;
  margin-bottom: 10px;
`;

const TrendBadge = styled.span<{ $pos: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 7px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  background: ${(p) => (p.$pos ? "#eafbe7" : "#fcecea")};
  color: ${(p) => (p.$pos ? "#5cb176" : "#d02b20")};
`;

const SparkWrap = styled.div`
  height: 48px;
`;

// ─── Chart card ──────────────────────────────────────────────────────────────

const ChartCard = styled(Card)`
  padding: 20px 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const ChartTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #32324d;
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: #8e8ea9;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const LegendDot = styled.span<{ $c: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.$c};
  display: inline-block;
  flex-shrink: 0;
`;

const HoverInfo = styled.div`
  font-size: 11px;
  color: #8e8ea9;
  font-variant-numeric: tabular-nums;
  min-height: 16px;
`;

// ─── Activity / Sessions feed ────────────────────────────────────────────────

const FeedCard = styled(Card)`
  display: flex;
  flex-direction: column;
  max-height: 380px;
`;

const FeedHeader = styled.div`
  padding: 16px 18px 12px;
  border-bottom: 1px solid #f0f0f7;
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8e8ea9;
`;

const FeedList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #d9d8ff; border-radius: 2px; }
`;

const FeedItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 18px;
  &:hover { background: #fafafe; }
`;

const FeedContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const FeedName = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #32324d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FeedSub = styled.div`
  font-size: 10px;
  color: #8e8ea9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
`;

const FeedTime = styled.div`
  font-size: 10px;
  color: #b8b8c7;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  margin-top: 1px;
`;

// ─── Recent users table ──────────────────────────────────────────────────────

const UsersCard = styled(Card)``;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TH = styled.th`
  text-align: left;
  padding: 10px 14px;
  font-size: 10px;
  font-weight: 700;
  color: #8e8ea9;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid #eaeaef;
  background: #fafafa;
  white-space: nowrap;
  &:first-child { padding-left: 20px; }
  &:last-child  { padding-right: 20px; }
`;

const TR = styled.tr`
  &:hover td { background: #fafafe; }
  &:last-child td { border-bottom: none; }
`;

const TD = styled.td`
  padding: 10px 14px;
  font-size: 12px;
  color: #32324d;
  border-bottom: 1px solid #f5f5f9;
  vertical-align: middle;
  &:first-child { padding-left: 20px; }
  &:last-child  { padding-right: 20px; }
`;

const StatusChip = styled.span<{ $verified: boolean; $banned?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  background: ${(p) => (p.$banned ? "#fcecea" : p.$verified ? "#eafbe7" : "#f0f0ff")};
  color: ${(p) => (p.$banned ? "#d02b20" : p.$verified ? "#5cb176" : "#8e8ea9")};

  &::before {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${(p) => (p.$banned ? "#d02b20" : p.$verified ? "#5cb176" : "#b8b8c7")};
  }
`;

// ─── Section divider ─────────────────────────────────────────────────────────

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: -8px;
`;

const DivLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #b8b8c7;
  white-space: nowrap;
`;

const DivLine = styled.div`
  flex: 1;
  height: 1px;
  background: #eaeaef;
`;

// ─── Empty ───────────────────────────────────────────────────────────────────

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: #8e8ea9;
  font-size: 12px;
  gap: 6px;
`;

// ─── SVG: Sparkline ──────────────────────────────────────────────────────────

function Sparkline({
  data,
  color,
  id,
}: {
  data: number[];
  color: string;
  id: string;
}) {
  const W = 300;
  const H = 48;

  if (data.length < 2) return <svg width="100%" height={H} />;

  const min = Math.min(...data);
  const max = Math.max(...data, min + 1);
  const range = max - min;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - 4 - ((v - min) / range) * (H - 10),
  }));

  const line = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const pr = pts[i - 1];
    const cx = (pr.x + p.x) / 2;
    return `${acc} C ${cx} ${pr.y} ${cx} ${p.y} ${p.x} ${p.y}`;
  }, "");

  const area = `${line} L ${pts[pts.length - 1].x} ${H} L 0 ${H} Z`;
  const gid = `spk-${id}`;

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── SVG: Area chart ─────────────────────────────────────────────────────────

type GraphRow = {
  label: string;
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
};

const SERIES = [
  { key: "totalUsers" as const, color: "#4945FF", label: "Total" },
  { key: "newUsers" as const, color: "#5CB176", label: "New" },
  { key: "activeUsers" as const, color: "#E57553", label: "Active" },
];

function AreaChart({
  data,
  hovered,
  onHover,
}: {
  data: GraphRow[];
  hovered: number | null;
  onHover: (i: number | null) => void;
}) {
  const W = 600;
  const H = 220;
  const PL = 44;
  const PR = 12;
  const PT = 12;
  const PB = 28;
  const CW = W - PL - PR;
  const CH = H - PT - PB;

  if (data.length === 0) {
    return (
      <Empty>
        <div style={{ fontSize: 24 }}>📊</div>
        <div>No growth data for this period</div>
      </Empty>
    );
  }

  const allVals = data.flatMap((d) => SERIES.map((s) => d[s.key]));
  const maxV = Math.max(...allVals, 10);
  const yMax = Math.ceil(maxV * 1.15);

  const xp = (i: number) => PL + (i / Math.max(data.length - 1, 1)) * CW;
  const yp = (v: number) => PT + (1 - v / yMax) * CH;

  const smooth = (vals: number[]) => {
    const pts = vals.map((v, i) => ({ x: xp(i), y: yp(v) }));
    const path = pts.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const pr = pts[i - 1];
      const cx = (pr.x + p.x) / 2;
      return `${acc} C ${cx} ${pr.y} ${cx} ${p.y} ${p.x} ${p.y}`;
    }, "");
    const area = `${path} L ${pts[pts.length - 1].x} ${PT + CH} L ${pts[0].x} ${PT + CH} Z`;
    return { pts, path, area };
  };

  const lines = SERIES.map((s) => ({
    ...s,
    ...smooth(data.map((d) => d[s.key])),
  }));

  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const v = (yMax * (4 - i)) / 4;
    return { v: Math.round(v), y: yp(v) };
  });

  const step = Math.max(1, Math.ceil(data.length / 8));
  const segW = CW / Math.max(data.length - 1, 1);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
      aria-label="User growth chart"
      role="img"
    >
      <defs>
        {lines.map((s) => (
          <linearGradient
            key={s.color}
            id={`ag-${s.color.replace("#", "")}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={s.color} stopOpacity="0.13" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {/* Y grid */}
      {yTicks.map((t) => (
        <g key={t.v}>
          <line
            x1={PL}
            y1={t.y}
            x2={W - PR}
            y2={t.y}
            stroke="#eaeaef"
            strokeWidth="1"
          />
          <text
            x={PL - 6}
            y={t.y + 4}
            textAnchor="end"
            fill="#b8b8c7"
            fontSize="9"
          >
            {t.v >= 1000 ? `${(t.v / 1000).toFixed(1)}k` : t.v}
          </text>
        </g>
      ))}

      <line
        x1={PL}
        y1={PT + CH}
        x2={W - PR}
        y2={PT + CH}
        stroke="#eaeaef"
        strokeWidth="1"
      />

      {/* Areas + lines */}
      {lines.map((s) => (
        <path
          key={`a-${s.color}`}
          d={s.area}
          fill={`url(#ag-${s.color.replace("#", "")})`}
        />
      ))}
      {lines.map((s) => (
        <path
          key={`l-${s.color}`}
          d={s.path}
          stroke={s.color}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* X labels */}
      {data.map((d, i) => {
        if (i % step !== 0 && i !== data.length - 1) return null;
        return (
          <text
            key={i}
            x={xp(i)}
            y={H - 6}
            textAnchor="middle"
            fill="#b8b8c7"
            fontSize="9"
          >
            {d.label}
          </text>
        );
      })}

      {/* Hover layer + dots */}
      {data.map((d, i) => {
        const isHov = hovered === i;
        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: SVG chart hover hit area
          <g
            key={i}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: "crosshair" }}
          >
            <rect
              x={xp(i) - segW / 2}
              y={PT}
              width={segW}
              height={CH}
              fill="transparent"
            />
            {isHov && (
              <line
                x1={xp(i)}
                y1={PT}
                x2={xp(i)}
                y2={PT + CH}
                stroke="#32324d"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.35"
              />
            )}
            {lines.map((s) => (
              <circle
                key={s.color}
                cx={xp(i)}
                cy={yp(d[s.key])}
                r={isHov ? 4 : 2.5}
                fill={s.color}
                stroke="white"
                strokeWidth={isHov ? 2 : 1}
                opacity={isHov ? 1 : 0.45}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function relTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(date: string | Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── StatCardItem ────────────────────────────────────────────────────────────

function StatCardItem({
  id,
  label,
  value,
  pct,
  sparkline,
  color,
  delay = 0,
}: {
  id: string;
  label: string;
  value: number | string;
  pct?: number;
  sparkline?: number[];
  color: string;
  delay?: number;
}) {
  const isPos = pct === undefined || pct >= 0;
  return (
    <Card $delay={delay} $accent={color}>
      <StatTop>
        <StatLabel>{label}</StatLabel>
        <StatValue>
          {typeof value === "number" ? value.toLocaleString() : value}
        </StatValue>
        {pct !== undefined && (
          <TrendBadge $pos={isPos}>
            {isPos ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
          </TrendBadge>
        )}
      </StatTop>
      {sparkline && sparkline.length > 1 && (
        <SparkWrap>
          <Sparkline data={sparkline} color={color} id={id} />
        </SparkWrap>
      )}
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Session = {
  id: string;
  createdAt: string;
  user?: { name?: string; email?: string; image?: string };
};
type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified: boolean;
  banned?: boolean;
  createdAt: string;
};

export function OverviewPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">(
    "weekly",
  );
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  const statsQuery = useQuery({
    queryKey: ["dash-user-stats"],
    queryFn: async () => {
      const r = await client.dash.userStats();
      if (r.error) throw new Error(r.error.message ?? "Failed");
      return r.data;
    },
  });

  const graphQuery = useQuery({
    queryKey: ["dash-user-graph", period],
    queryFn: async () => {
      const r = await client.dash.userGraphData({ query: { period } });
      if (r.error) throw new Error(r.error.message ?? "Failed");
      return r.data;
    },
  });

  const sessionsQuery = useQuery({
    queryKey: ["dash-recent-sessions"],
    queryFn: async () => {
      const r = await (client.dash as any).listAllSessions({
        query: { page: 1, limit: 10 },
      });
      if (r.error) throw new Error(r.error.message ?? "Failed");
      return r.data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ["dash-recent-users"],
    queryFn: async () => {
      const r = await (client.dash as any).listUsers({
        query: { page: 1, limit: 8, search: "" },
      });
      if (r.error) throw new Error(r.error.message ?? "Failed");
      return r.data;
    },
  });

  const orgsQuery = useQuery({
    queryKey: ["dash-orgs-count"],
    queryFn: async () => {
      const r = await (client.dash as any).listOrganizations({
        query: { page: 1, limit: 1 },
      });
      if (r.error) throw new Error(r.error.message ?? "Failed");
      return r.data;
    },
  });

  if (statsQuery.isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" padding={12}>
        <Loader>Loading…</Loader>
      </Flex>
    );
  }

  const stats = statsQuery.data;
  if (!stats) return null;

  const graphData = (graphQuery.data?.data ?? []) as GraphRow[];
  const sessions = ((sessionsQuery.data as any)?.sessions ?? []) as Session[];
  const recentUsers = ((usersQuery.data as any)?.users ?? []) as User[];
  const orgCount: number = (orgsQuery.data as any)?.total ?? 0;

  const totalSpark = graphData.map((d) => d.totalUsers);
  const newSpark = graphData.map((d) => d.newUsers);
  const activeSpark = graphData.map((d) => d.activeUsers);

  const hovRow = hovIdx !== null ? graphData[hovIdx] : null;

  return (
    <Wrap data-testid="overview-page">
      {/* Header */}
      <Flex justifyContent="space-between" alignItems="flex-end">
        <Box>
          <Typography variant="alpha" textColor="neutral800">
            Overview
          </Typography>
          <Box paddingTop={1}>
            <Typography variant="pi" textColor="neutral500">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography>
          </Box>
        </Box>
        <Box width="150px">
          <SingleSelect
            value={period}
            onChange={(v: string | number) =>
              setPeriod(v as "daily" | "weekly" | "monthly")
            }
            size="S"
            aria-label="Select period"
          >
            <SingleSelectOption value="daily">Daily</SingleSelectOption>
            <SingleSelectOption value="weekly">Weekly</SingleSelectOption>
            <SingleSelectOption value="monthly">Monthly</SingleSelectOption>
          </SingleSelect>
        </Box>
      </Flex>

      {/* Sign-ups section */}
      <Divider>
        <DivLabel>Sign-ups</DivLabel>
        <DivLine />
      </Divider>

      <StatRow>
        <StatCardItem
          id="total"
          label="Total Users"
          value={stats.total ?? 0}
          sparkline={totalSpark}
          color="#4945FF"
          delay={0}
        />
        <StatCardItem
          id="d-sig"
          label="Daily Sign-ups"
          value={stats.daily.signUps ?? 0}
          pct={stats.daily.percentage ?? undefined}
          sparkline={newSpark}
          color="#5CB176"
          delay={1}
        />
        <StatCardItem
          id="w-sig"
          label="Weekly Sign-ups"
          value={stats.weekly.signUps ?? 0}
          pct={stats.weekly.percentage ?? undefined}
          sparkline={newSpark}
          color="#5CB176"
          delay={2}
        />
        <StatCardItem
          id="m-sig"
          label="Monthly Sign-ups"
          value={stats.monthly.signUps ?? 0}
          pct={stats.monthly.percentage ?? undefined}
          sparkline={newSpark}
          color="#5CB176"
          delay={3}
        />
        <StatCardItem
          id="orgs"
          label="Organizations"
          value={orgCount}
          color="#9E6BF9"
          delay={4}
        />
      </StatRow>

      {/* Main chart + sessions */}
      <MainRow>
        <ChartCard $delay={5}>
          <ChartHeader>
            <ChartTitle>User Growth</ChartTitle>
            <LegendRow>
              {SERIES.map((s) => (
                <LegendItem key={s.color}>
                  <LegendDot $c={s.color} />
                  {s.label}
                </LegendItem>
              ))}
            </LegendRow>
          </ChartHeader>

          <HoverInfo>
            {hovRow
              ? `${hovRow.label}  ·  ${hovRow.totalUsers.toLocaleString()} total  ·  +${hovRow.newUsers.toLocaleString()} new  ·  ${hovRow.activeUsers.toLocaleString()} active`
              : "Hover the chart to inspect a data point"}
          </HoverInfo>

          {graphQuery.isLoading ? (
            <Flex
              justifyContent="center"
              alignItems="center"
              style={{ flex: 1, minHeight: 180 }}
            >
              <Loader>Loading…</Loader>
            </Flex>
          ) : (
            <AreaChart data={graphData} hovered={hovIdx} onHover={setHovIdx} />
          )}
        </ChartCard>

        <FeedCard $delay={6}>
          <FeedHeader>Recent Sessions</FeedHeader>
          <FeedList>
            {sessionsQuery.isLoading ? (
              <Empty>
                <Loader>Loading…</Loader>
              </Empty>
            ) : sessions.length === 0 ? (
              <Empty>No recent sessions</Empty>
            ) : (
              sessions.map((s) => (
                <FeedItem key={s.id}>
                  <Avatar
                    name={s.user?.name ?? "?"}
                    src={s.user?.image}
                    size={28}
                  />
                  <FeedContent>
                    <FeedName>{s.user?.name ?? "Unknown"}</FeedName>
                    <FeedSub>{s.user?.email ?? ""}</FeedSub>
                    <FeedTime>{relTime(s.createdAt)}</FeedTime>
                  </FeedContent>
                </FeedItem>
              ))
            )}
          </FeedList>
        </FeedCard>
      </MainRow>

      {/* Active users */}
      <Divider>
        <DivLabel>Active Users</DivLabel>
        <DivLine />
      </Divider>

      <ActiveRow>
        <StatCardItem
          id="d-act"
          label="Daily Active"
          value={stats.activeUsers.daily.active ?? 0}
          pct={stats.activeUsers.daily.percentage ?? undefined}
          sparkline={activeSpark}
          color="#E57553"
          delay={7}
        />
        <StatCardItem
          id="w-act"
          label="Weekly Active"
          value={stats.activeUsers.weekly.active ?? 0}
          pct={stats.activeUsers.weekly.percentage ?? undefined}
          sparkline={activeSpark}
          color="#E57553"
          delay={8}
        />
        <StatCardItem
          id="m-act"
          label="Monthly Active"
          value={stats.activeUsers.monthly.active ?? 0}
          pct={stats.activeUsers.monthly.percentage ?? undefined}
          sparkline={activeSpark}
          color="#E57553"
          delay={9}
        />
      </ActiveRow>

      {/* Recent users table */}
      <Divider>
        <DivLabel>Recent Users</DivLabel>
        <DivLine />
      </Divider>

      <UsersCard $delay={10}>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                {["User", "Email", "Joined", "Status"].map((h) => (
                  <TH key={h}>{h}</TH>
                ))}
              </tr>
            </thead>
            <tbody>
              {usersQuery.isLoading ? (
                <tr>
                  <TD colSpan={4} style={{ textAlign: "center", padding: 28 }}>
                    <Loader>Loading users…</Loader>
                  </TD>
                </tr>
              ) : recentUsers.length === 0 ? (
                <tr>
                  <TD
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      padding: 28,
                      color: "#8e8ea9",
                    }}
                  >
                    No users yet
                  </TD>
                </tr>
              ) : (
                recentUsers.map((u) => (
                  <TR key={u.id}>
                    <TD>
                      <Flex alignItems="center" gap={2}>
                        <Avatar name={u.name} src={u.image} size={26} />
                        <span style={{ fontWeight: 600, fontSize: 12 }}>
                          {u.name}
                        </span>
                      </Flex>
                    </TD>
                    <TD
                      style={{
                        color: "#8e8ea9",
                        fontFamily: "monospace",
                        fontSize: 11,
                      }}
                    >
                      {u.email}
                    </TD>
                    <TD
                      style={{
                        color: "#8e8ea9",
                        fontSize: 11,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtDate(u.createdAt)}
                    </TD>
                    <TD>
                      <StatusChip
                        $verified={u.emailVerified}
                        $banned={u.banned}
                      >
                        {u.banned
                          ? "Banned"
                          : u.emailVerified
                            ? "Verified"
                            : "Unverified"}
                      </StatusChip>
                    </TD>
                  </TR>
                ))
              )}
            </tbody>
          </Table>
        </TableWrap>
      </UsersCard>
    </Wrap>
  );
}
