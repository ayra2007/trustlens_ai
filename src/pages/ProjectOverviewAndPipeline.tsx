import React, { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  FileText,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  Activity,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  Sparkles,
  Code2,
  ChevronDown,
  ChevronUp,
  Database,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  StatusBadge,
  SourceChip,
  ClaimChip,
  MetricChip,
  RiskChip,
  Breadcrumbs,
  SyntheticOriginTag,
} from '../components/ui/primitives';
import { ColorfulProjectName } from '../components/layout/GlobalSearchModal';

/**
 * 1. PROJECT OVERVIEW (/app/project/:projectId)
 * - Header card with company, ticker, sector, period, status badge, data-origin badge, action buttons
 * - Module cards linking to Pipeline, Financial Analysis, Verification, Risks, Report, Audit Log
 * - Run Timeline showing each agent's status and duration
 * - "Data Origin" panel (counts of uploaded / retrieved / synthetic / external sources)
 * - Source Register Table (title, type, origin, date, staleness badge, pages, claims linked; row click -> Source Drawer)
 */
export const ProjectOverviewPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    projects,
    activeProject,
    triggerPipelineRun,
    openSourceDrawer,
    isPipelineRunning,
  } = useAppStore();
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === projectId) || activeProject;
  const pid = project.id;

  const verifiedClaims = project.claims.filter((c) => c.status === 'Verified').length;
  const partialClaims = project.claims.filter((c) => c.status === 'Partially Supported').length;
  const contradictedClaims = project.claims.filter((c) => c.status === 'Contradicted').length;
  const unsupportedClaims = project.claims.filter((c) => c.status === 'Unsupported').length;
  const staleSources = project.sources.filter((s) => s.isStale).length;

  // Compute Data Origin counts from project.sources
  const originCounts = useMemo(() => {
    let synthetic = 0;
    let uploaded = 0;
    let retrieved = 0;
    let external = 0;
    project.sources.forEach((s) => {
      if (s.originLabel === 'SYNTHETIC — FICTIONAL') synthetic++;
      if (s.originLabel === 'UPLOADED BY USER' || s.type === 'Analyst Note') uploaded++;
      if (s.type === 'Annual Report' || s.type === 'Quarterly Report' || s.type === 'Earnings Release') {
        retrieved++;
      }
      if (s.type === 'Market Report' || s.type === 'Analyst Note' || s.type === 'Test Document') {
        external++;
      }
    });
    return { synthetic, uploaded, retrieved, external };
  }, [project.sources]);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo="/app/dashboard"
        items={[
          { label: 'Projects', to: '/app/dashboard' },
          { label: `${project.companyName} (${project.ticker})` },
        ]}
      />

      {/* Header Card */}
      <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] p-6 md:p-8 border border-[#8A6BC2] shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <SyntheticOriginTag origin={project.dataOrigin} />
              <StatusBadge status={project.status} />
              <span className="px-3 py-1 rounded-full bg-[#8A6BC2]/40 border border-[#B9A0DA] text-xs font-mono text-[#F3EBFA] inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4FF3F]" />
                <span>Injection guard: {project.injectionAttemptsBlocked ?? 1} attempt(s) blocked</span>
              </span>
            </div>
            <div>
              <ColorfulProjectName
                companyName={project.companyName}
                ticker={project.ticker}
                theme="dark"
                size="lg"
              />
            </div>
            <p className="text-sm text-[#CBB3E8]">
              Sector: <span className="text-[#F3EBFA] font-medium">{project.sector}</span> · Fiscal
              Year End: <span className="text-[#F3EBFA] font-mono">{project.fiscalYearEnd}</span> ·
              Periods Analysed:{' '}
              <span className="text-[#D4FF3F] font-mono">{project.periods.join(', ')}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isPipelineRunning}
              onClick={() => triggerPipelineRun(pid)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] disabled:opacity-60 text-[#2A1F45] text-xs font-bold transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>{isPipelineRunning ? 'Pipeline Running...' : 'Re-Run 5-Agent Pipeline'}</span>
            </button>
            <Link
              to={`/app/project/${pid}/pipeline`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#8A6BC2]/30 hover:bg-[#8A6BC2]/50 text-[#F3EBFA] text-xs font-semibold border-[1.5px] border-[#CBB3E8] transition-colors"
            >
              <Activity className="w-4 h-4 text-[#D4FF3F]" />
              <span>Open Pipeline</span>
            </Link>
            <Link
              to={`/app/project/${pid}/report`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#8A6BC2]/30 hover:bg-[#8A6BC2]/50 text-[#F3EBFA] text-xs font-semibold border-[1.5px] border-[#CBB3E8] transition-colors"
            >
              <FileText className="w-4 h-4 text-[#D4FF3F]" />
              <span>Open Dossier Report</span>
            </Link>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-[#8A6BC2]/50">
          <button
            type="button"
            onClick={() => navigate(`/app/project/${pid}/analysis/metric/M-REV-2024`)}
            className="text-left rounded-2xl bg-[#8A6BC2]/25 hover:bg-[#8A6BC2]/40 border border-[#B9A0DA]/50 p-3.5 transition-colors cursor-pointer"
          >
            <div className="text-[11px] font-mono uppercase text-[#CBB3E8]">Audited Revenue</div>
            <div className="font-mono text-xl font-bold text-[#D4FF3F] mt-0.5 tabular-nums">$540.0M</div>
            <div className="text-[11px] text-[#F3EBFA] mt-0.5">+15.4% YoY (S1 p.31)</div>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/app/project/${pid}/analysis/ratio/RAT-NM`)}
            className="text-left rounded-2xl bg-[#8A6BC2]/25 hover:bg-[#8A6BC2]/40 border border-[#B9A0DA]/50 p-3.5 transition-colors cursor-pointer"
          >
            <div className="text-[11px] font-mono uppercase text-[#CBB3E8]">Net Profit Margin</div>
            <div className="font-mono text-xl font-bold text-[#D4FF3F] mt-0.5 tabular-nums">11.0%</div>
            <div className="text-[11px] text-[#F3EBFA] mt-0.5">+0.8pp vs FY2023</div>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/app/project/${pid}/verification?status=Verified`)}
            className="text-left rounded-2xl bg-[#8A6BC2]/25 hover:bg-[#8A6BC2]/40 border border-[#B9A0DA]/50 p-3.5 transition-colors cursor-pointer"
          >
            <div className="text-[11px] font-mono uppercase text-[#CBB3E8]">Verified Claims</div>
            <div className="font-mono text-xl font-bold text-[#D4FF3F] mt-0.5 tabular-nums">
              {verifiedClaims} / {project.claims.length}
            </div>
            <div className="text-[11px] text-[#F3EBFA] mt-0.5">{partialClaims} Partially Supported</div>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/app/project/${pid}/verification?status=Contradicted`)}
            className="text-left rounded-2xl bg-[#E34234]/25 hover:bg-[#E34234]/40 border border-[#E34234] p-3.5 transition-colors cursor-pointer"
          >
            <div className="text-[11px] font-mono uppercase text-[#F3EBFA]">Contradictions</div>
            <div className="font-mono text-xl font-bold text-[#F3EBFA] mt-0.5 tabular-nums">
              {contradictedClaims} Flagged
            </div>
            <div className="text-[11px] text-[#F3EBFA] mt-0.5">+ {unsupportedClaims} Unsupported</div>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/app/project/${pid}/risks`)}
            className="text-left rounded-2xl bg-[#8A6BC2]/25 hover:bg-[#8A6BC2]/40 border border-[#B9A0DA]/50 p-3.5 transition-colors cursor-pointer"
          >
            <div className="text-[11px] font-mono uppercase text-[#CBB3E8]">Risk Register</div>
            <div className="font-mono text-xl font-bold text-[#F3EBFA] mt-0.5 tabular-nums">
              {project.risks.length} Items
            </div>
            <div className="text-[11px] text-[#D4FF3F] mt-0.5">5 Evidence · 1 Hypothesis</div>
          </button>

          <button
            type="button"
            onClick={() => openSourceDrawer('S5', pid, 19, 'S5-P1')}
            className="text-left rounded-2xl bg-[#8A6BC2]/25 hover:bg-[#8A6BC2]/40 border border-[#B9A0DA]/50 p-3.5 transition-colors cursor-pointer"
          >
            <div className="text-[11px] font-mono uppercase text-[#CBB3E8]">Source Register</div>
            <div className="font-mono text-xl font-bold text-[#F3EBFA] mt-0.5 tabular-nums">
              {project.sources.length} Docs
            </div>
            <div className="text-[11px] text-[#D4FF3F] mt-0.5">{staleSources} Stale · 1 Undated</div>
          </button>
        </div>
      </div>

      {/* 6 Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            title: 'Research Pipeline',
            desc: '5-agent state machine + Reconciliation Gate, live event log, and JSON handoffs.',
            to: `/app/project/${pid}/pipeline`,
            badge: `${project.agents.filter((a) => a.status === 'Completed').length}/5 Completed`,
            icon: Activity,
          },
          {
            title: 'Financial Analysis',
            desc: 'Deterministic ratios, annual/quarterly Recharts, missing Q4 OCF gap, and step-by-step math.',
            to: `/app/project/${pid}/analysis`,
            badge: `${project.metrics.length} Metrics · ${project.ratios.length} Ratios`,
            icon: BarChart3,
          },
          {
            title: 'Verification Center',
            desc: '0.1% numeric tolerance rules, C1–C9 claim matrix, and S1 vs S2 conflict comparison.',
            to: `/app/project/${pid}/verification`,
            badge: `${verifiedClaims} Verified · ${contradictedClaims} Contradicted`,
            icon: ShieldCheck,
          },
          {
            title: 'Risk & Uncertainty Center',
            desc: 'Evidence-backed risks vs Hypotheses (R5), Severity × Evidence matrix, and NIST controls.',
            to: `/app/project/${pid}/risks`,
            badge: `${project.risks.length} Risks Mapped`,
            icon: AlertTriangle,
          },
          {
            title: 'Research Dossier Report',
            desc: 'Traceable executive briefing with inline citations and mandatory human review sign-off.',
            to: `/app/project/${pid}/report`,
            badge: project.report.reviewStatus,
            icon: FileText,
          },
          {
            title: 'Governance & Audit Log',
            desc: 'Immutable timestamped record of every agent transition, analyst override, and citation click.',
            to: `/app/audit`,
            badge: 'Full Provenance Trail',
            icon: Layers,
          },
        ].map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.title}
              to={mod.to}
              className="group rounded-2xl bg-[#F3EBFA] hover:bg-[#E9DDF6] border border-[#B9A0DA] hover:border-[#2A1F45] p-5 transition-all flex flex-col justify-between gap-4 shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#2A1F45] text-[#D4FF3F] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#E9DDF6] border border-[#B9A0DA] font-mono text-[11px] font-bold text-[#2A1F45]">
                    {mod.badge}
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold text-[#2A1F45] group-hover:text-[#8A6BC2] transition-colors">
                  {mod.title}
                </h2>
                <p className="text-xs text-[#6B5B86] leading-relaxed">{mod.desc}</p>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-[#2A1F45]">
                <span>Open Module</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Run Timeline & Data Origin Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Run Timeline */}
        <div className="lg:col-span-2 rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold text-[#2A1F45]">
                Multi-Agent Run Timeline
              </h2>
              <p className="text-xs text-[#6B5B86]">
                Click any stage to inspect its typed JSON input/output, findings, and execution logs.
              </p>
            </div>
            <Link
              to={`/app/project/${pid}/pipeline`}
              className="px-3.5 py-1.5 rounded-full bg-[#E9DDF6] hover:bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45] transition-colors"
            >
              Full Pipeline View
            </Link>
          </div>

          <div className="space-y-2.5">
            {project.agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => navigate(`/app/project/${pid}/pipeline/agent/${agent.id}`)}
                className="rounded-xl bg-[#E9DDF6] hover:bg-[#CBB3E8]/50 border border-[#B9A0DA] p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold flex items-center justify-center">
                    {agent.stepNumber}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-[#2A1F45]">{agent.name}</div>
                    <div className="text-xs text-[#6B5B86]">{agent.auroraExample}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#6B5B86] inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#8A6BC2]" />
                    <span>{agent.durationMs ? `${(agent.durationMs / 1000).toFixed(2)}s` : '—'}</span>
                  </span>
                  <StatusBadge status={agent.status} size="sm" />
                  <ChevronRight className="w-4 h-4 text-[#6B5B86]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Origin Breakdown Panel */}
        <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-[#2A1F45]">Data Origin Panel</h2>
              <Database className="w-5 h-5 text-[#8A6BC2]" />
            </div>
            <p className="text-xs text-[#6B5B86] leading-relaxed">
              Provenance classification across all {project.sources.length} registered documents in
              this research workspace.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3.5">
                <div className="text-[11px] font-mono uppercase text-[#6B5B86]">
                  Synthetic / Seed
                </div>
                <div className="font-mono text-2xl font-bold text-[#2A1F45] mt-1 tabular-nums">
                  {originCounts.synthetic}
                </div>
                <div className="text-[11px] text-[#6B5B86]">Labelled fictional</div>
              </div>

              <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3.5">
                <div className="text-[11px] font-mono uppercase text-[#6B5B86]">
                  Retrieved Filings
                </div>
                <div className="font-mono text-2xl font-bold text-[#2A1F45] mt-1 tabular-nums">
                  {originCounts.retrieved}
                </div>
                <div className="text-[11px] text-[#6B5B86]">S1, S2, S3, S4</div>
              </div>

              <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3.5">
                <div className="text-[11px] font-mono uppercase text-[#6B5B86]">
                  Uploaded Drafts
                </div>
                <div className="font-mono text-2xl font-bold text-[#2A1F45] mt-1 tabular-nums">
                  {originCounts.uploaded}
                </div>
                <div className="text-[11px] text-[#6B5B86]">S6 Analyst Note</div>
              </div>

              <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3.5">
                <div className="text-[11px] font-mono uppercase text-[#6B5B86]">
                  External / Probe
                </div>
                <div className="font-mono text-2xl font-bold text-[#2A1F45] mt-1 tabular-nums">
                  {originCounts.external}
                </div>
                <div className="text-[11px] text-[#6B5B86]">S5, S6, S7</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[#EAF7A8] border border-[#2A1F45] p-3.5 text-xs text-[#2A1F45] space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Untrusted Document Hygiene</span>
            </div>
            <p>
              All document text is sanitized by the Injection Guard before agent ingestion. S7 p.1
              override payload was neutralized.
            </p>
          </div>
        </div>
      </div>

      {/* Source Register Table */}
      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-[#2A1F45]">
              Source Register ({project.sources.length} Documents)
            </h2>
            <p className="text-xs text-[#6B5B86]">
              Click any row to open the Source Provenance Drawer, or click "Full Viewer" for deep-link
              passage inspection.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#B9A0DA] text-[11px] font-mono uppercase text-[#6B5B86]">
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Title</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Origin</th>
                <th className="py-3 px-3">Pub Date</th>
                <th className="py-3 px-3">Freshness / Hygiene</th>
                <th className="py-3 px-3">Pages</th>
                <th className="py-3 px-3">Linked Claims</th>
                <th className="py-3 px-3 text-right">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9A0DA]/60 text-xs">
              {project.sources.map((src) => {
                const linkedClaims = project.claims.filter(
                  (c) =>
                    c.originSourceId === src.id ||
                    c.verification.supportingSourceIds.includes(src.id) ||
                    c.verification.contradictingSourceIds.includes(src.id)
                );
                const firstPage = src.pages[0]?.pageNumber || 1;
                const firstPassage = src.pages[0]?.passages[0]?.id;

                return (
                  <tr
                    key={src.id}
                    onClick={() => openSourceDrawer(src.id, pid, firstPage, firstPassage)}
                    className="hover:bg-[#E9DDF6] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-[#2A1F45]">{src.id}</td>
                    <td className="py-3 px-3 font-semibold text-[#2A1F45]">{src.title}</td>
                    <td className="py-3 px-3 text-[#6B5B86]">{src.type}</td>
                    <td className="py-3 px-3">
                      <SyntheticOriginTag origin={src.originLabel} />
                    </td>
                    <td className="py-3 px-3 font-mono text-[#2A1F45]">
                      {src.publicationDate || 'MISSING (Undated)'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {src.isStale && <StatusBadge status="Stale" size="sm" />}
                        {src.missingDateFlag && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E34234] text-[#F3EBFA] text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Undated</span>
                          </span>
                        )}
                        {src.promptInjectionFlag && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E34234] text-[#F3EBFA] text-[11px] font-bold">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Injection Blocked</span>
                          </span>
                        )}
                        {!src.isStale && !src.missingDateFlag && !src.promptInjectionFlag && (
                          <StatusBadge status="Verified" size="sm" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#2A1F45] tabular-nums">
                      {src.pageCount}p
                    </td>
                    <td
                      className="py-3 px-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-wrap gap-1">
                        {linkedClaims.map((c) => (
                          <ClaimChip key={c.id} claimId={c.id} projectId={pid} showStatement={false} />
                        ))}
                      </div>
                    </td>
                    <td
                      className="py-3 px-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        to={`/app/project/${pid}/sources/${src.id}?page=${firstPage}${
                          firstPassage ? `&highlight=${firstPassage}` : ''
                        }`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E9DDF6] hover:bg-[#D4FF3F] text-[#2A1F45] font-bold border border-[#2A1F45]"
                      >
                        <span>Full Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. RESEARCH PIPELINE (/app/project/:projectId/pipeline)
 * - Horizontal flow diagram of the 5 agents + orchestrator + reconciliation with animated status
 *   (glowing chartreuse for processing, tomato for failed; click node -> /pipeline/agent/:agentId)
 * - Live event log (timestamp, agent, message, level) with filters and search
 * - Retrieved source register and extracted metrics table (metric row -> /analysis/metric/:id)
 * - Toggle: "Simulate Risk Agent failure" -> sets Risk agent to Failed, blocks report from showing "Verified", enables "Retry agent" button
 * - Buttons: Re-run pipeline, Re-run single agent, Download run log (JSON)
 */
export const PipelinePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    projects,
    activeProject,
    triggerPipelineRun,
    runSingleAgent,
    toggleSimulateRiskFailure,
    openSourceDrawer,
    isPipelineRunning,
    addToast,
  } = useAppStore();
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === projectId) || activeProject;
  const pid = project.id;

  const [eventSearch, setEventSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [selectedAgentToRerun, setSelectedAgentToRerun] = useState<string>(
    project.agents[0]?.id || 'agent-retrieve'
  );

  const riskAgent = project.agents.find((a) => a.role === 'Assess Risk');
  const isRiskFailed = riskAgent?.status === 'Failed' || Boolean(project.simulateRiskFailure);

  const events = useMemo(() => {
    const raw = project.pipelineEvents || [];
    return raw.filter((e) => {
      if (levelFilter !== 'all' && e.level !== levelFilter) return false;
      if (
        eventSearch.trim() &&
        !`${e.agentName} ${e.message}`.toLowerCase().includes(eventSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [project.pipelineEvents, levelFilter, eventSearch]);

  const handleDownloadRunLog = () => {
    const payload = {
      projectId: project.id,
      companyName: project.companyName,
      ticker: project.ticker,
      overallStatus: project.status,
      injectionAttemptsBlocked: project.injectionAttemptsBlocked ?? 1,
      fallbackUsed: project.fallbackUsed ?? true,
      simulateRiskFailure: Boolean(project.simulateRiskFailure),
      exportedAt: new Date().toISOString(),
      agents: project.agents,
      pipelineEvents: project.pipelineEvents || [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustlens-run-log-${project.ticker.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Run Log Exported', 'Downloaded structured JSON pipeline run log.', 'verified');
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo={`/app/project/${pid}`}
        items={[
          { label: 'Projects', to: '/app/dashboard' },
          { label: project.ticker, to: `/app/project/${pid}` },
          { label: 'Research Pipeline & Orchestrator' },
        ]}
      />

      {/* Top Controls & Security Counters */}
      <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] p-6 border border-[#8A6BC2] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <SyntheticOriginTag origin={project.dataOrigin} />
              <StatusBadge status={project.status} />
              <span className="px-3 py-1 rounded-full bg-[#D4FF3F] text-[#2A1F45] font-mono text-xs font-bold inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Injection guard: {project.injectionAttemptsBlocked ?? 1} attempts blocked</span>
              </span>
              {(project.fallbackUsed ?? true) && (
                <span className="px-3 py-1 rounded-full bg-[#E9DDF6] text-[#2A1F45] font-mono text-xs font-bold inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8A6BC2]" />
                  <span>Fallback used: Verified C1–C9 Seed Claims Active</span>
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#F3EBFA]">
              Multi-Agent Research & Verification Pipeline
            </h1>
            <p className="text-xs text-[#CBB3E8] max-w-3xl">
              State Machine Order: Research → Financial Analysis → Evidence Verification → Risk &
              Uncertainty → Reconciliation → Report Generation. Never marks a run Verified if any
              agent failed or if any claim is Contradicted/Unsupported.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isPipelineRunning}
              onClick={() => triggerPipelineRun(pid, 3600)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] disabled:opacity-60 text-[#2A1F45] text-xs font-bold transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>{isPipelineRunning ? 'Running (~20s)...' : 'Re-run pipeline'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadRunLog}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#8A6BC2]/30 hover:bg-[#8A6BC2]/50 text-[#F3EBFA] text-xs font-bold border-[1.5px] border-[#CBB3E8] cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#D4FF3F]" />
              <span>Download run log (JSON)</span>
            </button>
          </div>
        </div>

        {/* Single-Agent Re-run & Simulate Risk Failure Bar */}
        <div className="pt-4 border-t border-[#8A6BC2]/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-mono text-[#CBB3E8]">Single Agent Target:</label>
            <select
              value={selectedAgentToRerun}
              onChange={(e) => setSelectedAgentToRerun(e.target.value)}
              className="rounded-full bg-[#F3EBFA] text-[#2A1F45] px-3.5 py-1.5 text-xs font-semibold border border-[#B9A0DA]"
            >
              {project.agents.map((a) => (
                <option key={a.id} value={a.id}>
                  Step {a.stepNumber}: {a.name} ({a.status})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isPipelineRunning}
              onClick={() => runSingleAgent(pid, selectedAgentToRerun)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#E9DDF6] hover:bg-[#D4FF3F] disabled:opacity-60 text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-run single agent</span>
            </button>
          </div>

          {/* Toggle: Simulate Risk Agent failure */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none bg-[#8A6BC2]/25 px-4 py-2 rounded-full border border-[#B9A0DA]">
              <input
                type="checkbox"
                checked={Boolean(project.simulateRiskFailure)}
                onChange={() => toggleSimulateRiskFailure(pid)}
                className="accent-[#E34234] w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-bold text-[#F3EBFA]">
                Simulate Risk Agent failure
              </span>
            </label>

            {isRiskFailed && riskAgent && (
              <button
                type="button"
                disabled={isPipelineRunning}
                onClick={() => runSingleAgent(pid, riskAgent.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E34234] hover:bg-[#B8301F] text-[#F3EBFA] text-xs font-bold border-[1.5px] border-[#F3EBFA] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry agent (Risk Agent)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Flow Diagram of Orchestrator + 5 Agents + Reconciliation */}
      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-[#2A1F45]">
              Orchestrator State Machine Flow Diagram
            </h2>
            <p className="text-xs text-[#6B5B86]">
              Click any agent node to inspect its input/output JSON, duration, findings, and logs.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-[#2A1F45]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#D4FF3F] border border-[#2A1F45]" />
              <span>Completed / Active</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#CBB3E8] border border-[#2A1F45]" />
              <span>Needs Review / Reconciliation</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#E34234]" />
              <span>Failed</span>
            </span>
          </div>
        </div>

        {/* Horizontal Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-stretch pt-2">
          {/* Orchestrator Node */}
          <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] p-4 border-2 border-[#8A6BC2] flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#8A6BC2] text-[#F3EBFA]">
                  Controller
                </span>
                <Activity className="w-4 h-4 text-[#D4FF3F]" />
              </div>
              <div className="font-display text-sm font-bold text-[#D4FF3F]">
                Orchestrator Engine
              </div>
              <p className="text-[11px] text-[#CBB3E8]">
                Passes typed JSON, retries once on failure, gates final status.
              </p>
            </div>
            <div className="pt-3 mt-2 border-t border-[#8A6BC2]/40">
              <StatusBadge status={project.status} size="sm" />
            </div>
          </div>

          {/* Agents 1 to 4 */}
          {project.agents.slice(0, 4).map((agent) => {
            const isProcessing = agent.status === 'Processing';
            const isFailed = agent.status === 'Failed';
            return (
              <div
                key={agent.id}
                onClick={() => navigate(`/app/project/${pid}/pipeline/agent/${agent.id}`)}
                className={`rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isProcessing
                    ? 'bg-[#D4FF3F] text-[#2A1F45] border-[#2A1F45] shadow-lg animate-pulse'
                    : isFailed
                    ? 'bg-[#E34234] text-[#F3EBFA] border-[#B8301F] shadow-md'
                    : 'bg-[#E9DDF6] hover:bg-[#CBB3E8]/70 text-[#2A1F45] border-[#B9A0DA] hover:border-[#2A1F45]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isFailed
                          ? 'bg-[#2A1F45] text-[#F3EBFA]'
                          : 'bg-[#2A1F45] text-[#D4FF3F]'
                      }`}
                    >
                      Stage {agent.stepNumber}
                    </span>
                    <span className="font-mono text-[11px]">
                      {agent.durationMs ? `${(agent.durationMs / 1000).toFixed(1)}s` : ''}
                    </span>
                  </div>
                  <div className="font-display text-sm font-bold leading-snug">{agent.name}</div>
                  <p
                    className={`text-[11px] line-clamp-2 ${
                      isFailed ? 'text-[#F3EBFA]' : 'text-[#6B5B86]'
                    }`}
                  >
                    {agent.auroraExample}
                  </p>
                </div>
                <div className="pt-3 mt-2 border-t border-[#B9A0DA]/60 flex items-center justify-between">
                  <StatusBadge status={agent.status} size="sm" />
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}

          {/* Reconciliation Node */}
          <div
            onClick={() => navigate(`/app/project/${pid}/verification`)}
            className="rounded-2xl bg-[#E9DDF6] hover:bg-[#CBB3E8]/70 text-[#2A1F45] p-4 border-2 border-[#8A6BC2] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8A6BC2] text-[#F3EBFA]">
                  Gate
                </span>
                <ShieldCheck className="w-4 h-4 text-[#2A1F45]" />
              </div>
              <div className="font-display text-sm font-bold">Cross-Agent Reconciliation</div>
              <p className="text-[11px] text-[#6B5B86]">
                Blocks Verified badge if any agent failed or claim contradicted.
              </p>
            </div>
            <div className="pt-3 mt-2 border-t border-[#B9A0DA] flex items-center justify-between">
              <StatusBadge status={isRiskFailed ? 'Failed' : 'Needs Review'} size="sm" />
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Agent 5: Report Generation */}
          {project.agents.slice(4, 5).map((agent) => {
            const isProcessing = agent.status === 'Processing';
            return (
              <div
                key={agent.id}
                onClick={() => navigate(`/app/project/${pid}/pipeline/agent/${agent.id}`)}
                className={`rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isProcessing
                    ? 'bg-[#D4FF3F] text-[#2A1F45] border-[#2A1F45] shadow-lg animate-pulse'
                    : 'bg-[#E9DDF6] hover:bg-[#CBB3E8]/70 text-[#2A1F45] border-[#B9A0DA] hover:border-[#2A1F45]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2A1F45] text-[#D4FF3F]">
                      Stage {agent.stepNumber}
                    </span>
                    <span className="font-mono text-[11px]">
                      {agent.durationMs ? `${(agent.durationMs / 1000).toFixed(1)}s` : ''}
                    </span>
                  </div>
                  <div className="font-display text-sm font-bold leading-snug">{agent.name}</div>
                  <p className="text-[11px] text-[#6B5B86] line-clamp-2">{agent.auroraExample}</p>
                </div>
                <div className="pt-3 mt-2 border-t border-[#B9A0DA]/60 flex items-center justify-between">
                  <StatusBadge
                    status={isRiskFailed ? 'Needs Review' : agent.status}
                    size="sm"
                  />
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Event Log with Filters & Search */}
      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[#2A1F45]">
              Live Orchestrator Event Log ({events.length} Events)
            </h2>
            <p className="text-xs text-[#6B5B86]">
              Timestamped telemetry of state transitions, injection quarantine, and reconciliation
              checks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B5B86] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Search agent or message..."
                className="pl-8 pr-3 py-1.5 rounded-full bg-[#E9DDF6] text-[#2A1F45] placeholder-[#6B5B86] text-xs border border-[#B9A0DA]"
              />
            </div>

            {(['all', 'info', 'warn', 'error'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase font-mono transition-colors cursor-pointer ${
                  levelFilter === lvl
                    ? 'bg-[#D4FF3F] text-[#2A1F45] border-[1.5px] border-[#2A1F45]'
                    : 'bg-[#E9DDF6] text-[#6B5B86] border border-[#B9A0DA]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-xl bg-[#2A1F45] text-[#F3EBFA] p-4 font-mono text-xs space-y-2 border border-[#8A6BC2]">
          {events.length === 0 ? (
            <div className="text-[#CBB3E8] py-4 text-center">
              No pipeline events match your current filter.
            </div>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className="flex flex-wrap items-start gap-2.5 py-1.5 border-b border-[#8A6BC2]/30 last:border-0"
              >
                <span className="text-[#CBB3E8] shrink-0">
                  [{new Date(evt.timestamp).toLocaleTimeString()}]
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                    evt.level === 'error'
                      ? 'bg-[#E34234] text-[#F3EBFA]'
                      : evt.level === 'warn'
                      ? 'bg-[#CBB3E8] text-[#2A1F45]'
                      : 'bg-[#D4FF3F] text-[#2A1F45]'
                  }`}
                >
                  {evt.level}
                </span>
                <span className="font-bold text-[#D4FF3F] shrink-0">{evt.agentName}:</span>
                <span className="text-[#F3EBFA] break-words">{evt.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Retrieved Source Register & Extracted Metrics Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retrieved Source Register */}
        <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">
              Retrieved Source Register ({project.sources.length})
            </h2>
            <span className="text-xs font-mono text-[#6B5B86]">Click row → Source Drawer</span>
          </div>
          <div className="space-y-2">
            {project.sources.map((s) => (
              <div
                key={s.id}
                onClick={() =>
                  openSourceDrawer(
                    s.id,
                    pid,
                    s.pages[0]?.pageNumber || 1,
                    s.pages[0]?.passages[0]?.id
                  )
                }
                className="rounded-xl bg-[#E9DDF6] hover:bg-[#CBB3E8]/60 border border-[#B9A0DA] p-3 flex items-center justify-between gap-2 cursor-pointer transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#2A1F45]">
                    <span className="font-mono text-[#8A6BC2] mr-1.5">{s.id}</span>
                    {s.title}
                  </div>
                  <div className="text-[11px] text-[#6B5B86] font-mono">
                    {s.type} · Date: {s.publicationDate || 'Undated'} · {s.pageCount} pages
                  </div>
                </div>
                <div className="shrink-0">
                  {s.isStale ? (
                    <StatusBadge status="Stale" size="sm" />
                  ) : s.promptInjectionFlag ? (
                    <StatusBadge status="Contradicted" size="sm" />
                  ) : (
                    <StatusBadge status="Verified" size="sm" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Extracted Metrics Table (row -> /analysis/metric/:id) */}
        <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">
              Extracted Financial Metrics ({project.metrics.length})
            </h2>
            <span className="text-xs font-mono text-[#6B5B86]">Click row → Metric Detail</span>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#B9A0DA] font-mono text-[11px] uppercase text-[#6B5B86]">
                  <th className="py-2 px-2">Metric</th>
                  <th className="py-2 px-2">Period</th>
                  <th className="py-2 px-2">Value</th>
                  <th className="py-2 px-2">Source</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9A0DA]/50">
                {project.metrics.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => navigate(`/app/project/${pid}/analysis/metric/${m.id}`)}
                    className="hover:bg-[#E9DDF6] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-2 font-bold text-[#2A1F45]">{m.name}</td>
                    <td className="py-2.5 px-2 font-mono text-[#6B5B86]">{m.period}</td>
                    <td className="py-2.5 px-2 font-mono font-bold text-[#2A1F45] tabular-nums">
                      {m.value !== null ? `$${m.value.toFixed(1)}M` : 'MISSING (Null)'}
                    </td>
                    <td
                      className="py-2.5 px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SourceChip
                        sourceId={m.sourceId}
                        projectId={pid}
                        highlightPassageId={m.passageId}
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <StatusBadge status={m.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 3. AGENT DETAIL (/app/project/:projectId/pipeline/agent/:agentId)
 * - Role description, input JSON and output JSON (collapsible, pretty-printed), duration, status history
 * - Findings with clickable evidence links (claims, sources, metrics), warnings
 * - Prev/next agent navigation, single-agent re-run button
 */
export const AgentDetailPage: React.FC = () => {
  const { projectId, agentId } = useParams<{ projectId: string; agentId: string }>();
  const { projects, activeProject, runSingleAgent, isPipelineRunning } = useAppStore();

  const project = projects.find((p) => p.id === projectId) || activeProject;
  const pid = project.id;

  const idx = project.agents.findIndex((a) => a.id === agentId);
  const agent = idx >= 0 ? project.agents[idx] : project.agents[0];
  const prevAgent = idx > 0 ? project.agents[idx - 1] : null;
  const nextAgent =
    idx >= 0 && idx < project.agents.length - 1 ? project.agents[idx + 1] : null;

  const [showInputJson, setShowInputJson] = useState(true);
  const [showOutputJson, setShowOutputJson] = useState(true);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo={`/app/project/${pid}/pipeline`}
        items={[
          { label: 'Projects', to: '/app/dashboard' },
          { label: project.ticker, to: `/app/project/${pid}` },
          { label: 'Pipeline', to: `/app/project/${pid}/pipeline` },
          { label: `Stage ${agent.stepNumber}: ${agent.name}` },
        ]}
      />

      {/* Agent Header */}
      <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] p-6 border border-[#8A6BC2] space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#D4FF3F] text-[#2A1F45] font-mono text-xs font-bold">
                Stage {agent.stepNumber} of {project.agents.length} · {agent.role}
              </span>
              <StatusBadge status={agent.status} />
              <span className="px-3 py-1 rounded-full bg-[#8A6BC2]/40 text-[#F3EBFA] font-mono text-xs">
                Duration: {agent.durationMs ? `${agent.durationMs}ms` : 'N/A'}
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#F3EBFA]">
              {agent.name}
            </h1>
            <p className="text-sm text-[#CBB3E8] max-w-3xl">{agent.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isPipelineRunning}
              onClick={() => runSingleAgent(pid, agent.id)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] disabled:opacity-60 text-[#2A1F45] text-xs font-bold cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isPipelineRunning ? 'Running...' : 'Re-Run This Agent'}</span>
            </button>

            {prevAgent && (
              <Link
                to={`/app/project/${pid}/pipeline/agent/${prevAgent.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#8A6BC2]/30 hover:bg-[#8A6BC2]/50 text-[#F3EBFA] text-xs font-bold border-[1.5px] border-[#CBB3E8]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev: {prevAgent.role}</span>
              </Link>
            )}
            {nextAgent && (
              <Link
                to={`/app/project/${pid}/pipeline/agent/${nextAgent.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#8A6BC2]/30 hover:bg-[#8A6BC2]/50 text-[#F3EBFA] text-xs font-bold border-[1.5px] border-[#CBB3E8]"
              >
                <span>Next: {nextAgent.role}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Input JSON & Output JSON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input JSON */}
        <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-5 space-y-3">
          <button
            type="button"
            onClick={() => setShowInputJson(!showInputJson)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#8A6BC2]" />
              <h2 className="font-display text-lg font-bold text-[#2A1F45]">
                Typed Input JSON Payload
              </h2>
            </div>
            {showInputJson ? (
              <ChevronUp className="w-4 h-4 text-[#2A1F45]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#2A1F45]" />
            )}
          </button>
          {showInputJson && (
            <pre className="rounded-xl bg-[#2A1F45] text-[#D4FF3F] p-4 font-mono text-xs overflow-x-auto border border-[#8A6BC2]">
              {agent.inputJson ||
                JSON.stringify({ inputs: agent.inputs, role: agent.role }, null, 2)}
            </pre>
          )}
        </div>

        {/* Output JSON */}
        <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-5 space-y-3">
          <button
            type="button"
            onClick={() => setShowOutputJson(!showOutputJson)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#8A6BC2]" />
              <h2 className="font-display text-lg font-bold text-[#2A1F45]">
                Typed Output JSON Payload
              </h2>
            </div>
            {showOutputJson ? (
              <ChevronUp className="w-4 h-4 text-[#2A1F45]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#2A1F45]" />
            )}
          </button>
          {showOutputJson && (
            <pre className="rounded-xl bg-[#2A1F45] text-[#F3EBFA] p-4 font-mono text-xs overflow-x-auto border border-[#8A6BC2]">
              {agent.outputJson ||
                JSON.stringify({ outputs: agent.outputs, status: agent.status }, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* Findings with Clickable Evidence Links */}
      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-[#2A1F45]">
          Structured Agent Findings & Linked Evidence
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(agent.findings || []).map((f) => (
            <div
              key={f.id}
              className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-4 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-[#8A6BC2]">{f.id}</span>
                  <StatusBadge
                    status={
                      f.severity === 'error'
                        ? 'Contradicted'
                        : f.severity === 'warn'
                        ? 'Partially Supported'
                        : 'Verified'
                    }
                    size="sm"
                  />
                </div>
                <h3 className="font-display text-base font-bold text-[#2A1F45]">{f.title}</h3>
                <p className="text-xs text-[#6B5B86] leading-relaxed">{f.detail}</p>
              </div>

              <div className="pt-2 border-t border-[#B9A0DA] flex flex-wrap gap-1.5">
                {(f.linkedSourceIds || []).map((sid) => (
                  <SourceChip key={sid} sourceId={sid} projectId={pid} />
                ))}
                {(f.linkedClaimIds || []).map((cid) => (
                  <ClaimChip key={cid} claimId={cid} projectId={pid} showStatement={false} />
                ))}
                {(f.linkedMetricIds || []).map((mid) => (
                  <MetricChip key={mid} metricId={mid} projectId={pid} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings & Status History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warnings */}
        <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#2A1F45] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#E34234]" />
            <span>Stage Warnings & Guardrails</span>
          </h2>
          <div className="space-y-2">
            {(agent.warnings || []).map((w, i) => (
              <div
                key={i}
                className="rounded-xl bg-[#E9DDF6] border border-[#E34234] p-3 text-xs text-[#2A1F45] flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-[#E34234] shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status History & Execution Logs */}
        <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#2A1F45]">
            Status History & Execution Trace
          </h2>
          <div className="space-y-2">
            {(agent.statusHistory || []).map((sh, idx2) => (
              <div
                key={idx2}
                className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] px-3.5 py-2 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <StatusBadge status={sh.status} size="sm" />
                  <span className="text-[#2A1F45] font-medium">{sh.note}</span>
                </div>
                <span className="font-mono text-[11px] text-[#6B5B86]">
                  {new Date(sh.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-[#2A1F45] text-[#F3EBFA] p-3.5 font-mono text-xs space-y-1.5 mt-3">
            {agent.logs.map((log, i) => (
              <div key={i} className="text-[#CBB3E8]">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
