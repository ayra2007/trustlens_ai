import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import {
  PlusCircle,
  FolderOpen,
  Columns,
  ArrowUpRight,
  Copy,
  Trash2,
  TrendingUp,
  Info,
  Bell,
  History,
  Play,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  StatusBadge,
  SyntheticOriginTag,
  RiskChip,
  Modal,
} from '../components/ui/primitives';
import { DEFAULT_PROJECT_ID } from '../data/seed';
import { ColorfulProjectName } from '../components/layout/GlobalSearchModal';

export const DashboardPage: React.FC = () => {
  const {
    user,
    projects,
    activeProject,
    setActiveProjectId,
    duplicateProject,
    deleteProject,
    auditEntries,
    watchlist,
    triggerPipelineRun,
  } = useAppStore();
  const navigate = useNavigate();
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [hoveredRatioId, setHoveredRatioId] = useState<string | null>(null);

  const pid = activeProject.id;

  const totalProjects = projects.length;
  const allClaims = projects.flatMap((p) => p.claims);
  const verifiedClaimsCount = allClaims.filter((c) => c.status === 'Verified').length;
  const verifiedPct =
    allClaims.length > 0 ? Math.round((verifiedClaimsCount / allClaims.length) * 100) : 0;

  const openFlagsCount = projects.reduce(
    (acc, p) =>
      acc +
      p.claims.filter((c) => c.status === 'Contradicted' || c.status === 'Unsupported').length +
      p.risks.filter((r) => r.severity === 'High').length,
    0
  );

  const pendingReviewsCount = projects.reduce(
    (acc, p) =>
      acc +
      p.claims.filter((c) => !c.reviewerDecision || c.reviewerDecision === 'Needs Revision').length +
      p.risks.filter((r) => r.status === 'Needs Review').length,
    0
  );

  // Verification Donut Data using only the allowed palette
  const verificationBreakdown = [
    {
      name: 'Verified',
      value: activeProject.claims.filter((c) => c.status === 'Verified').length,
      color: '#D4FF3F',
    },
    {
      name: 'Partially Supported',
      value: activeProject.claims.filter((c) => c.status === 'Partially Supported').length,
      color: '#CBB3E8',
    },
    {
      name: 'Contradicted',
      value: activeProject.claims.filter((c) => c.status === 'Contradicted').length,
      color: '#E34234',
    },
    {
      name: 'Unsupported',
      value: activeProject.claims.filter((c) => c.status === 'Unsupported').length,
      color: '#8A6BC2',
    },
  ];

  // Risk Severity Bar Data
  const riskSeverityData = [
    {
      severity: 'High',
      count: activeProject.risks.filter((r) => r.severity === 'High').length,
      color: '#E34234',
    },
    {
      severity: 'Medium',
      count: activeProject.risks.filter((r) => r.severity === 'Medium').length,
      color: '#8A6BC2',
    },
    {
      severity: 'Low',
      count: activeProject.risks.filter((r) => r.severity === 'Low').length,
      color: '#CBB3E8',
    },
  ];

  const snapshotRatioIds = [
    'RAT-GM',
    'RAT-NM',
    'RAT-CR',
    'RAT-DE',
    'RAT-ROA',
    'RAT-REV-YOY',
  ];
  const snapshotRatios = snapshotRatioIds
    .map((id) => activeProject.ratios.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  return (
    <div className="space-y-8">
      {/* Greeting & Quick Actions */}
      <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] p-6 md:p-8 border border-[#8A6BC2] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <SyntheticOriginTag origin={activeProject.dataOrigin} />
            <span className="text-xs font-mono text-[#CBB3E8]">
              Active Role: {user?.role || 'Analyst'} · {user?.name || 'Marcus Vance'}
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#F3EBFA]">
            Welcome back, {user?.name.split(',')[0] || 'Analyst'}
          </h1>
          <div className="text-sm text-[#E9DDF6] max-w-2xl flex flex-wrap items-center gap-2">
            <span>Inspecting</span>
            <ColorfulProjectName
              companyName={activeProject.companyName}
              ticker={activeProject.ticker}
              theme="dark"
              size="sm"
            />
            <span>
              across {activeProject.periods.length} periods and {activeProject.sources.length} indexed source filings.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/app/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] text-[#2A1F45] text-xs font-bold transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Research</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setActiveProjectId(DEFAULT_PROJECT_ID);
              navigate(`/app/project/${DEFAULT_PROJECT_ID}`);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-transparent hover:bg-[#8A6BC2] text-[#F3EBFA] border-[1.5px] border-[#CBB3E8] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open Primary Dossier</span>
          </button>
          <Link
            to="/app/compare"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-transparent hover:bg-[#8A6BC2] text-[#F3EBFA] border-[1.5px] border-[#CBB3E8] text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Columns className="w-4 h-4" />
            <span>Compare</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to={`/app/project/${pid}`}
          className="rounded-2xl bg-[#F3EBFA] hover:bg-[#EAF7A8] border border-[#B9A0DA] hover:border-[#2A1F45] p-5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B5B86]">
            <span>Active Research Projects</span>
            <ArrowUpRight className="w-4 h-4 text-[#8A6BC2]" />
          </div>
          <div className="my-2 font-mono text-3xl font-bold text-[#2A1F45] tabular-nums">
            {totalProjects}
          </div>
          <div className="text-xs text-[#6B5B86]">
            {activeProject.sources.length} sources · {activeProject.metrics.length} metrics indexed
          </div>
        </Link>

        <Link
          to={`/app/project/${pid}/verification?status=Verified`}
          className="rounded-2xl bg-[#F3EBFA] hover:bg-[#EAF7A8] border border-[#B9A0DA] hover:border-[#2A1F45] p-5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B5B86]">
            <span>Claims Verified Rate</span>
            <ArrowUpRight className="w-4 h-4 text-[#8A6BC2]" />
          </div>
          <div className="my-2 font-mono text-3xl font-bold text-[#2A1F45] tabular-nums">
            {verifiedPct}%
          </div>
          <div className="text-xs text-[#6B5B86]">
            {verifiedClaimsCount} of {allClaims.length} claims deterministically verified
          </div>
        </Link>

        <Link
          to={`/app/project/${pid}/verification?status=Contradicted`}
          className="rounded-2xl bg-[#F3EBFA] hover:bg-[#E9DDF6] border border-[#E34234] p-5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#B8301F]">
            <span>Open Contradiction & High Flags</span>
            <ArrowUpRight className="w-4 h-4 text-[#B8301F]" />
          </div>
          <div className="my-2 font-mono text-3xl font-bold text-[#B8301F] tabular-nums">
            {openFlagsCount}
          </div>
          <div className="text-xs text-[#6B5B86]">
            Includes S1 vs S2 ($540M vs $552M) conflict & R1
          </div>
        </Link>

        <Link
          to={`/app/project/${pid}/risks?status=Needs Review`}
          className="rounded-2xl bg-[#F3EBFA] hover:bg-[#EAF7A8] border border-[#B9A0DA] hover:border-[#2A1F45] p-5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B5B86]">
            <span>Pending Human Reviews</span>
            <ArrowUpRight className="w-4 h-4 text-[#8A6BC2]" />
          </div>
          <div className="my-2 font-mono text-3xl font-bold text-[#2A1F45] tabular-nums">
            {pendingReviewsCount}
          </div>
          <div className="text-xs text-[#6B5B86]">
            Awaiting Analyst / Reviewer sign-off
          </div>
        </Link>
      </div>

      {/* Recent Projects Table + Workflow Progress Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#2A1F45]">Research Projects</h2>
              <p className="text-xs text-[#6B5B86]">
                Click any row to open project overview, or duplicate/delete.
              </p>
            </div>
            <Link
              to="/app/new"
              className="px-3.5 py-1.5 rounded-full border-[1.5px] border-[#2A1F45] text-xs font-bold text-[#2A1F45] hover:bg-[#D4FF3F]"
            >
              + New Project
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#B9A0DA] text-[#6B5B86]">
                  <th className="py-2.5 px-3 font-semibold">Company</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Periods</th>
                  <th className="py-2.5 px-3 font-semibold">Reviewer Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9A0DA]">
                {projects.map((proj) => (
                  <tr
                    key={proj.id}
                    onClick={() => {
                      setActiveProjectId(proj.id);
                      navigate(`/app/project/${proj.id}`);
                    }}
                    className="hover:bg-[#E9DDF6] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3">
                      <div className="mb-1">
                        <ColorfulProjectName
                          companyName={proj.companyName}
                          ticker={proj.ticker}
                          theme="light"
                          size="sm"
                        />
                      </div>
                      <div className="text-[11px] font-mono text-[#8A6BC2]">
                        {proj.dataOrigin}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={proj.status} />
                    </td>
                    <td className="py-3 px-3 font-mono text-[#2A1F45]">
                      {proj.periods.slice(0, 3).join(', ')}
                      {proj.periods.length > 3 ? ` +${proj.periods.length - 3}` : ''}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={proj.reviewerStatus} />
                    </td>
                    <td
                      className="py-3 px-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/app/project/${proj.id}`}
                          className="px-3 py-1 rounded-full bg-[#D4FF3F] text-[#2A1F45] border border-[#2A1F45] font-bold hover:bg-[#EAF7A8]"
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => duplicateProject(proj.id)}
                          title="Duplicate Project"
                          className="p-1.5 rounded-full bg-[#E9DDF6] hover:bg-[#CBB3E8] text-[#2A1F45] border border-[#2A1F45] cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setProjectToDelete(proj.id)}
                          title="Delete Project"
                          className="p-1.5 rounded-full bg-[#E34234] hover:bg-[#B8301F] text-[#F3EBFA] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workflow Progress Widget */}
        <div className="lg:col-span-5 rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#2A1F45]">5-Agent Workflow</h2>
              <p className="text-xs text-[#6B5B86]">
                Click any agent card to inspect its inputs, logs, and outputs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => triggerPipelineRun(pid)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] text-[#2A1F45] border-[1.5px] border-[#2A1F45] text-xs font-bold cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Re-Run</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {activeProject.agents.map((agent) => (
              <Link
                key={agent.id}
                to={`/app/project/${pid}/pipeline/agent/${agent.id}`}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#E9DDF6] hover:bg-[#CBB3E8] border border-[#B9A0DA] transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#8A6BC2]">
                      0{agent.stepNumber}
                    </span>
                    <span className="text-xs font-bold text-[#2A1F45] truncate">
                      {agent.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#6B5B86] truncate mt-0.5">
                    {agent.outputs[0]}
                  </div>
                </div>
                <StatusBadge status={agent.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Verification Donut Chart + Risk Summary Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#2A1F45]">
                Claim Verification ({activeProject.claims.length} Claims)
              </h2>
              <p className="text-xs text-[#6B5B86]">
                Click any slice or status row to open filtered claims.
              </p>
            </div>
            <Link
              to={`/app/project/${pid}/verification`}
              className="text-xs font-bold text-[#8A6BC2] hover:text-[#2A1F45]"
            >
              View All Claims →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verificationBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={3}
                    onClick={(entry) => {
                      if (entry?.name) {
                        navigate(
                          `/app/project/${pid}/verification?status=${encodeURIComponent(entry.name)}`
                        );
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {verificationBreakdown.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        stroke="#2A1F45"
                        strokeWidth={1.5}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {verificationBreakdown.map((item) => (
                <Link
                  key={item.name}
                  to={`/app/project/${pid}/verification?status=${encodeURIComponent(item.name)}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#E9DDF6] hover:bg-[#CBB3E8] border border-[#B9A0DA] text-xs transition-colors"
                >
                  <StatusBadge status={item.name} />
                  <span className="font-mono font-bold text-sm text-[#2A1F45] tabular-nums">
                    {item.value} claims
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Summary Bars by Severity */}
        <div className="lg:col-span-6 rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#2A1F45]">
                Risk Register by Severity ({activeProject.risks.length} Risks)
              </h2>
              <p className="text-xs text-[#6B5B86]">
                Click any bar or severity chip to filter risks in Risk Center.
              </p>
            </div>
            <Link
              to={`/app/project/${pid}/risks`}
              className="text-xs font-bold text-[#8A6BC2] hover:text-[#2A1F45]"
            >
              Open Risk Center →
            </Link>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={riskSeverityData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <XAxis type="number" allowDecimals={false} stroke="#6B5B86" fontSize={12} />
                <YAxis type="category" dataKey="severity" stroke="#2A1F45" fontSize={12} width={70} />
                <RechartsTooltip />
                <Bar
                  dataKey="count"
                  radius={[0, 8, 8, 0]}
                  className="cursor-pointer"
                  onClick={(entry: unknown) => {
                    const item = entry as { severity?: string };
                    if (item?.severity) {
                      navigate(`/app/project/${pid}/risks?severity=${item.severity}`);
                    }
                  }}
                >
                  {riskSeverityData.map((entry) => (
                    <Cell key={entry.severity} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {activeProject.risks.slice(0, 4).map((r) => (
              <RiskChip key={r.id} riskId={r.id} projectId={pid} />
            ))}
          </div>
        </div>
      </div>

      {/* Financial Health Snapshot (Aurora): 6 Indicator Tiles */}
      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h2 className="font-display text-2xl font-bold text-[#2A1F45]">
                Financial Health Snapshot — {activeProject.companyName} ({activeProject.ticker})
              </h2>
              <SyntheticOriginTag origin={activeProject.dataOrigin} />
            </div>
            <p className="text-xs text-[#6B5B86]">
              Computed deterministically from audited FY2024 & FY2023 statements. Click any tile to inspect its formula breakdown.
            </p>
          </div>

          <div className="px-4 py-2 rounded-full bg-[#2A1F45] text-[#D4FF3F] text-xs font-mono font-bold border border-[#8A6BC2]">
            No investment rating is provided
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {snapshotRatios.map((ratio) => {
            const isHovered = hoveredRatioId === ratio.id;
            return (
              <div
                key={ratio.id}
                onMouseEnter={() => setHoveredRatioId(ratio.id)}
                onMouseLeave={() => setHoveredRatioId(null)}
                onClick={() => navigate(`/app/project/${pid}/analysis/ratio/${ratio.id}`)}
                className="relative rounded-2xl bg-[#E9DDF6] hover:bg-[#EAF7A8] border border-[#B9A0DA] hover:border-[#2A1F45] p-4 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 text-xs font-semibold text-[#6B5B86]">
                    <span className="truncate">{ratio.name}</span>
                    <Info className="w-3.5 h-3.5 text-[#8A6BC2] shrink-0" />
                  </div>
                  <div className="my-2 font-mono text-2xl font-bold text-[#2A1F45] tabular-nums">
                    {ratio.formattedValue}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-mono font-semibold text-[#2A1F45]">
                  <TrendingUp className="w-3.5 h-3.5 text-[#8A6BC2] shrink-0" />
                  <span>{ratio.deltaFormatted}</span>
                </div>

                {isHovered && (
                  <div className="mt-2 pt-2 border-t border-[#B9A0DA] text-[11px] text-[#2A1F45] space-y-1">
                    <div className="font-mono font-semibold text-[#8A6BC2]">{ratio.formula}</div>
                    <div>{ratio.interpretation}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Watchlist Alerts Panel + Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#8A6BC2]" />
              <h2 className="font-display text-xl font-bold text-[#2A1F45]">Watchlist Alerts</h2>
            </div>
            <Link
              to="/app/watchlist"
              className="text-xs font-bold text-[#8A6BC2] hover:text-[#2A1F45]"
            >
              Manage Watchlist →
            </Link>
          </div>

          <div className="space-y-3">
            {watchlist.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(item.targetRoute)}
                className="rounded-xl bg-[#E9DDF6] hover:bg-[#EAF7A8] border border-[#B9A0DA] p-4 space-y-1.5 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#8A6BC2]">
                    {item.ticker} · {item.severity}
                  </span>
                  <Link
                    to="/app/watchlist"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[11px] font-semibold text-[#2A1F45] underline"
                  >
                    Open Watchlist
                  </Link>
                </div>
                <div className="text-sm font-bold text-[#2A1F45]">{item.alertHeadline}</div>
                <p className="text-xs text-[#6B5B86]">{item.alertDetail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#8A6BC2]" />
              <h2 className="font-display text-xl font-bold text-[#2A1F45]">Recent Audit Trail Activity</h2>
            </div>
            <Link
              to="/app/audit"
              className="text-xs font-bold text-[#8A6BC2] hover:text-[#2A1F45]"
            >
              Full Audit Log ({auditEntries.length}) →
            </Link>
          </div>

          <div className="space-y-2.5">
            {auditEntries.slice(0, 6).map((entry) => (
              <Link
                key={entry.id}
                to={entry.targetRoute}
                className="flex items-start justify-between gap-4 p-3 rounded-xl bg-[#E9DDF6] hover:bg-[#CBB3E8] border border-[#B9A0DA] transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-[#2A1F45]">{entry.action}</span>
                    <span className="font-mono text-[11px] text-[#8A6BC2]">
                      by {entry.actor} ({entry.actorRole})
                    </span>
                  </div>
                  <p className="text-xs text-[#6B5B86] truncate">{entry.details}</p>
                </div>
                <span className="font-mono text-[11px] text-[#6B5B86] whitespace-nowrap shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Project Confirmation Modal */}
      <Modal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        title="Confirm Project Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#2A1F45]">
            Are you sure you want to remove this research project from your local workspace? This action will be recorded in the Audit Trail.
          </p>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setProjectToDelete(null)}
              className="px-4 py-2 rounded-full border-[1.5px] border-[#2A1F45] bg-[#E9DDF6] text-[#2A1F45] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (projectToDelete) {
                  deleteProject(projectToDelete);
                  setProjectToDelete(null);
                }
              }}
              className="px-4 py-2 rounded-full bg-[#E34234] hover:bg-[#B8301F] text-[#F3EBFA] text-xs font-bold cursor-pointer"
            >
              Delete Project
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
