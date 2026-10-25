import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  CheckSquare,
  FileText,
  BarChart3,
  AlertOctagon,
  Compass,
  ArrowRight,
  CornerDownLeft,
  Sparkles,
  Link2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { StatusBadge } from '../ui/primitives';

export type SearchCategory = 'all' | 'claims' | 'sources' | 'metrics' | 'risks' | 'pages';

export interface SearchResultItem {
  uid: string;
  id: string;
  category: Exclude<SearchCategory, 'all'>;
  projectId: string;
  projectTicker: string;
  title: string;
  subtitle: string;
  snippet: string;
  status?: string;
  route: string;
  crossRefs: {
    label: string;
    type: 'source' | 'claim' | 'metric' | 'risk' | 'agent';
    route: string;
  }[];
  searchText: string;
}

/**
 * Colorful & Attractive Brand Wordmark ("TrustLens") and Project Name Display
 * Uses strictly the 11-color palette:
 * #CBB3E8, #D4FF3F, #E34234, #8A6BC2, #2A1F45, #E9DDF6, #F3EBFA, #B8301F, #EAF7A8, #6B5B86, #B9A0DA
 */
export const BrandWordmark: React.FC<{
  theme?: 'dark' | 'light';
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ theme = 'dark', collapsed = false, size = 'md' }) => {
  const textSize =
    size === 'lg' ? 'text-2xl md:text-3xl' : size === 'sm' ? 'text-lg' : 'text-xl md:text-2xl';
  const badgeSize = size === 'lg' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs';

  return (
    <div className="inline-flex items-center gap-2.5 select-none group">
      {/* Multi-layered colorful 3D emblem */}
      <div
        className={`relative ${badgeSize} rounded-full bg-[#2A1F45] border-2 border-[#D4FF3F] flex items-center justify-center font-sans font-extrabold tracking-tighter shrink-0 shadow-sm overflow-hidden`}
      >
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#E34234] opacity-90"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full bg-[#8A6BC2] opacity-85"
        />
        <span className="relative z-10 text-[#D4FF3F] group-hover:text-[#EAF7A8] transition-colors">
          TL
        </span>
      </div>

      {!collapsed && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <div className={`font-display font-extrabold tracking-tight ${textSize} leading-none flex items-center`}>
              <span
                className={
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-[#F3EBFA] via-[#EAF7A8] to-[#D4FF3F] bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-[#2A1F45] via-[#8A6BC2] to-[#B8301F] bg-clip-text text-transparent'
                }
              >
                Trust
              </span>
              <span
                className={
                  theme === 'dark'
                    ? 'italic bg-gradient-to-r from-[#D4FF3F] via-[#EAF7A8] to-[#E34234] bg-clip-text text-transparent ml-0.5'
                    : 'italic bg-gradient-to-r from-[#E34234] via-[#B8301F] to-[#8A6BC2] bg-clip-text text-transparent ml-0.5'
                }
              >
                Lens
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border ${
                theme === 'dark'
                  ? 'bg-[#E34234] text-[#F3EBFA] border-[#D4FF3F]'
                  : 'bg-[#2A1F45] text-[#D4FF3F] border-[#E34234]'
              }`}
            >
              PRO
            </span>
          </div>
          <span
            className={`font-mono text-[10px] font-bold tracking-wider uppercase mt-0.5 ${
              theme === 'dark' ? 'text-[#EAF7A8]' : 'text-[#B8301F]'
            }`}
          >
            {size === 'lg'
              ? 'Every Claim Backed by Proof · Zero Hallucinated Math'
              : 'Every Claim Backed by Proof'}
          </span>
        </div>
      )}
    </div>
  );
};

export const ColorfulProjectName: React.FC<{
  companyName: string;
  ticker: string;
  theme?: 'dark' | 'light' | 'header';
  size?: 'sm' | 'md' | 'lg';
}> = ({ companyName, ticker, theme = 'dark', size = 'md' }) => {
  const words = companyName.trim().split(' ');
  const firstWord = words[0] || companyName;
  const restWords = words.slice(1).join(' ');

  const textClass =
    size === 'lg'
      ? 'text-3xl md:text-4xl'
      : size === 'sm'
      ? 'text-base md:text-lg'
      : 'text-xl md:text-2xl';

  return (
    <span className="inline-flex flex-wrap items-center gap-2.5">
      <span
        className={`font-display font-extrabold tracking-tight ${textClass} inline-flex flex-wrap items-baseline gap-1.5`}
      >
        <span
          className={
            theme === 'light'
              ? 'bg-gradient-to-r from-[#2A1F45] via-[#8A6BC2] to-[#B8301F] bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-[#D4FF3F] via-[#EAF7A8] to-[#F3EBFA] bg-clip-text text-transparent'
          }
        >
          {firstWord}
        </span>
        {restWords && (
          <span
            className={
              theme === 'light'
                ? 'italic bg-gradient-to-r from-[#E34234] via-[#B8301F] to-[#2A1F45] bg-clip-text text-transparent'
                : 'italic bg-gradient-to-r from-[#F3EBFA] via-[#CBB3E8] to-[#D4FF3F] bg-clip-text text-transparent'
            }
          >
            {restWords}
          </span>
        )}
      </span>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs font-extrabold border-[1.5px] shrink-0 ${
          theme === 'light'
            ? 'bg-[#2A1F45] text-[#D4FF3F] border-[#E34234]'
            : 'bg-[#D4FF3F] text-[#2A1F45] border-[#E34234]'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-[#E34234]" />
        <span>{ticker}</span>
      </span>
    </span>
  );
};

export const GlobalSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { projects, activeProject, user, loginAsAnalyst } = useAppStore();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
    }
  }, [isOpen]);

  // Build comprehensive, cross-referenced search index across Claims, Sources, Metrics/Ratios, Risks, and Pages
  const allIndexedItems = useMemo<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [];
    const orderedProjects = [
      activeProject,
      ...projects.filter((p) => p.id !== activeProject.id),
    ];

    for (const proj of orderedProjects) {
      const pid = proj.id;

      // 1. CLAIMS (cross-referenced with Sources, Metrics, Ratios, Risks)
      for (const claim of proj.claims) {
        const linkedRisks = proj.risks.filter(
          (r) => r.relatedClaimIds.includes(claim.id) || claim.relatedRiskIds.includes(r.id)
        );
        const allSources = Array.from(
          new Set([
            claim.originSourceId,
            ...claim.verification.supportingSourceIds,
            ...claim.verification.contradictingSourceIds,
          ])
        ).filter(Boolean);

        const allMetricAndRatioIds = Array.from(
          new Set([...claim.relatedMetricIds, ...claim.relatedRatioIds])
        );

        const crossRefs: SearchResultItem['crossRefs'] = [
          ...allSources.map((sid) => ({
            label: `Source ${sid}`,
            type: 'source' as const,
            route: `/app/project/${pid}/sources/${sid}`,
          })),
          ...allMetricAndRatioIds.map((mid) => {
            const isRatio = mid.startsWith('RAT-');
            return {
              label: mid,
              type: 'metric' as const,
              route: isRatio
                ? `/app/project/${pid}/analysis/ratio/${mid}`
                : `/app/project/${pid}/analysis/metric/${mid}`,
            };
          }),
          ...linkedRisks.map((rk) => ({
            label: `Risk ${rk.id}`,
            type: 'risk' as const,
            route: `/app/project/${pid}/risks/${rk.id}`,
          })),
        ];

        const snippetText =
          claim.verification.discrepancyNote ||
          claim.verification.deterministicCheck ||
          claim.confidenceNote;

        items.push({
          uid: `${pid}-claim-${claim.id}`,
          id: claim.id,
          category: 'claims',
          projectId: pid,
          projectTicker: proj.ticker,
          title: `${claim.id}: ${claim.statement}`,
          subtitle: `${proj.companyName} (${proj.ticker}) · ${claim.category} · ${
            claim.period || 'FY2024'
          }`,
          snippet: snippetText,
          status: claim.status,
          route: `/app/project/${pid}/verification/claim/${claim.id}`,
          crossRefs,
          searchText: [
            claim.id,
            claim.statement,
            claim.category,
            claim.status,
            claim.period || '',
            snippetText,
            claim.plainEnglishWhy || '',
            ...allSources,
            ...allMetricAndRatioIds,
            ...linkedRisks.map((r) => r.id),
            proj.companyName,
            proj.ticker,
          ]
            .join(' ')
            .toLowerCase(),
        });
      }

      // 2. SOURCES & PASSAGES (cross-referenced with Claims, Metrics, Risks)
      for (const source of proj.sources) {
        const linkedClaims = proj.claims.filter(
          (c) =>
            c.originSourceId === source.id ||
            c.verification.supportingSourceIds.includes(source.id) ||
            c.verification.contradictingSourceIds.includes(source.id)
        );
        const linkedMetrics = proj.metrics.filter((m) => m.sourceId === source.id);
        const linkedRisks = proj.risks.filter((r) => r.sourceIds.includes(source.id));

        const firstPage = source.pages[0]?.pageNumber || 1;
        const firstPassage = source.pages[0]?.passages[0]?.id || '';
        const passageSummary = source.pages
          .flatMap((pg) => pg.passages.map((pas) => `${pas.id} (p.${pg.pageNumber}): ${pas.text}`))
          .join(' · ');

        const crossRefs: SearchResultItem['crossRefs'] = [
          ...linkedClaims.slice(0, 4).map((c) => ({
            label: `Claim ${c.id}`,
            type: 'claim' as const,
            route: `/app/project/${pid}/verification/claim/${c.id}`,
          })),
          ...linkedRisks.slice(0, 3).map((r) => ({
            label: `Risk ${r.id}`,
            type: 'risk' as const,
            route: `/app/project/${pid}/risks/${r.id}`,
          })),
          ...linkedMetrics.slice(0, 3).map((m) => ({
            label: m.id,
            type: 'metric' as const,
            route: `/app/project/${pid}/analysis/metric/${m.id}`,
          })),
        ];

        items.push({
          uid: `${pid}-source-${source.id}`,
          id: source.id,
          category: 'sources',
          projectId: pid,
          projectTicker: proj.ticker,
          title: `${source.id}: ${source.title}`,
          subtitle: `${proj.companyName} (${proj.ticker}) · ${source.type} · ${
            source.publicationDate || 'Undated Flagged'
          }`,
          snippet:
            passageSummary.slice(0, 220) + (passageSummary.length > 220 ? '...' : ''),
          status:
            source.promptInjectionFlag || source.missingDateFlag
              ? 'Contradicted'
              : source.isStale
              ? 'Partially Supported'
              : 'Verified',
          route: `/app/project/${pid}/sources/${source.id}?page=${firstPage}&highlight=${firstPassage}`,
          crossRefs,
          searchText: [
            source.id,
            source.title,
            source.type,
            source.originLabel,
            source.publicationDate || 'undated missing date',
            source.stalenessReason || '',
            source.isStale ? 'stale' : '',
            source.promptInjectionFlag ? 'prompt injection security quarantine' : '',
            passageSummary,
            ...linkedClaims.map((c) => c.id),
            ...linkedRisks.map((r) => r.id),
            proj.companyName,
            proj.ticker,
          ]
            .join(' ')
            .toLowerCase(),
        });
      }

      // 3. METRICS & RATIOS (cross-referenced with Sources & Claims)
      for (const metric of proj.metrics) {
        const linkedClaims = proj.claims.filter((c) =>
          c.relatedMetricIds.includes(metric.id)
        );
        const formattedVal =
          metric.value === null || metric.value === undefined
            ? 'NULL (Missing in source)'
            : `$${metric.value}M (${metric.unit})`;

        const crossRefs: SearchResultItem['crossRefs'] = [
          {
            label: `Source ${metric.sourceId}`,
            type: 'source' as const,
            route: `/app/project/${pid}/sources/${metric.sourceId}`,
          },
          ...linkedClaims.map((c) => ({
            label: `Claim ${c.id}`,
            type: 'claim' as const,
            route: `/app/project/${pid}/verification/claim/${c.id}`,
          })),
        ];

        items.push({
          uid: `${pid}-metric-${metric.id}`,
          id: metric.id,
          category: 'metrics',
          projectId: pid,
          projectTicker: proj.ticker,
          title: `${metric.id}: ${metric.name} — ${formattedVal}`,
          subtitle: `${proj.companyName} (${proj.ticker}) · ${metric.period} (${metric.periodType}) · Source ${metric.sourceId}`,
          snippet: `${metric.explanation} (${metric.changeNote})`,
          status: metric.value === null ? 'Needs Review' : metric.status,
          route: `/app/project/${pid}/analysis/metric/${metric.id}`,
          crossRefs,
          searchText: [
            metric.id,
            metric.name,
            metric.key,
            metric.period,
            metric.unit,
            metric.explanation,
            metric.changeNote,
            formattedVal,
            metric.sourceId,
            ...linkedClaims.map((c) => c.id),
            proj.companyName,
            proj.ticker,
          ]
            .join(' ')
            .toLowerCase(),
        });
      }

      for (const ratio of proj.ratios) {
        const linkedClaims = proj.claims.filter(
          (c) =>
            c.relatedRatioIds.includes(ratio.id) ||
            (ratio.linkedClaimIds && ratio.linkedClaimIds.includes(c.id))
        );

        const crossRefs: SearchResultItem['crossRefs'] = [
          ...ratio.sourceIds.map((sid) => ({
            label: `Source ${sid}`,
            type: 'source' as const,
            route: `/app/project/${pid}/sources/${sid}`,
          })),
          ...ratio.metricIds.map((mid) => ({
            label: mid,
            type: 'metric' as const,
            route: `/app/project/${pid}/analysis/metric/${mid}`,
          })),
          ...linkedClaims.map((c) => ({
            label: `Claim ${c.id}`,
            type: 'claim' as const,
            route: `/app/project/${pid}/verification/claim/${c.id}`,
          })),
        ];

        items.push({
          uid: `${pid}-ratio-${ratio.id}`,
          id: ratio.id,
          category: 'metrics',
          projectId: pid,
          projectTicker: proj.ticker,
          title: `${ratio.id}: ${ratio.name} (${ratio.formattedValue})`,
          subtitle: `${proj.companyName} (${proj.ticker}) · ${
            ratio.category || 'Financial'
          } Ratio · Formula: ${ratio.formula}`,
          snippet: `${ratio.interpretation} (${ratio.deltaFormatted})`,
          status: ratio.status,
          route: `/app/project/${pid}/analysis/ratio/${ratio.id}`,
          crossRefs,
          searchText: [
            ratio.id,
            ratio.name,
            ratio.category || '',
            ratio.formula,
            ratio.interpretation,
            ratio.deltaFormatted,
            ratio.formattedValue,
            ...ratio.sourceIds,
            ...ratio.metricIds,
            ...linkedClaims.map((c) => c.id),
            proj.companyName,
            proj.ticker,
          ]
            .join(' ')
            .toLowerCase(),
        });
      }

      // 4. RISKS (cross-referenced with Sources & Claims)
      for (const risk of proj.risks) {
        const crossRefs: SearchResultItem['crossRefs'] = [
          ...risk.sourceIds.map((sid) => ({
            label: `Source ${sid}`,
            type: 'source' as const,
            route: `/app/project/${pid}/sources/${sid}`,
          })),
          ...risk.relatedClaimIds.map((cid) => ({
            label: `Claim ${cid}`,
            type: 'claim' as const,
            route: `/app/project/${pid}/verification/claim/${cid}`,
          })),
        ];

        items.push({
          uid: `${pid}-risk-${risk.id}`,
          id: risk.id,
          category: 'risks',
          projectId: pid,
          projectTicker: proj.ticker,
          title: `${risk.id}: ${risk.title}`,
          subtitle: `${proj.companyName} (${proj.ticker}) · ${risk.severity} Severity · ${risk.riskType} · ${risk.category}`,
          snippet: `${risk.summary} ${risk.mitigationQuestions.join(' ')}`,
          status:
            risk.severity === 'High'
              ? 'Contradicted'
              : risk.riskType === 'Hypothesis'
              ? 'Partially Supported'
              : 'Verified',
          route: `/app/project/${pid}/risks/${risk.id}`,
          crossRefs,
          searchText: [
            risk.id,
            risk.title,
            risk.category,
            risk.severity,
            risk.riskType,
            risk.summary,
            risk.detailedAnalysis,
            ...risk.mitigationQuestions,
            ...risk.sourceIds,
            ...risk.relatedClaimIds,
            proj.companyName,
            proj.ticker,
          ]
            .join(' ')
            .toLowerCase(),
        });
      }

      // 5. AGENTS (linked to Agent Detail Pages)
      for (const agent of proj.agents) {
        items.push({
          uid: `${pid}-agent-${agent.id}`,
          id: agent.id,
          category: 'pages',
          projectId: pid,
          projectTicker: proj.ticker,
          title: `Agent Step ${agent.stepNumber}: ${agent.name}`,
          subtitle: `${proj.companyName} (${proj.ticker}) · Pipeline Agent Detail · Duration: ${
            agent.durationMs ?? 0
          }ms`,
          snippet: `${agent.description} · ${agent.auroraExample}`,
          status: agent.status,
          route: `/app/project/${pid}/pipeline/agent/${agent.id}`,
          crossRefs: [
            {
              label: 'Pipeline Orchestrator',
              type: 'agent',
              route: `/app/project/${pid}/pipeline`,
            },
          ],
          searchText: [
            agent.id,
            agent.name,
            agent.role,
            agent.description,
            ...agent.inputs,
            ...agent.outputs,
            agent.auroraExample,
            proj.companyName,
            proj.ticker,
            'agent pipeline step',
          ]
            .join(' ')
            .toLowerCase(),
        });
      }
    }

    // 6. WORKSPACE PAGES & MODULES
    const pid = activeProject.id;
    const workspacePages: Omit<SearchResultItem, 'uid' | 'projectId' | 'projectTicker'>[] = [
      {
        id: 'PAGE-DASH',
        category: 'pages',
        title: 'Research Workspace Dashboard',
        subtitle: 'Workspace Page · KPIs, Health Snapshot, Verification Donut & Dossiers',
        snippet: 'Overview of all active research dossiers, verification rates, open risk flags, and 6 deterministic ratios.',
        route: '/app/dashboard',
        crossRefs: [
          { label: `${activeProject.ticker} Overview`, type: 'agent', route: `/app/project/${pid}` },
        ],
        searchText: 'dashboard home kpi snapshot dossiers overview workspace page',
      },
      {
        id: 'PAGE-OVERVIEW',
        category: 'pages',
        title: `${activeProject.companyName} (${activeProject.ticker}) — Project Overview`,
        subtitle: 'Project Module · Source Register, Data Origin & Run Timeline',
        snippet: `Inspect ${activeProject.sources.length} indexed filings, provenance flags, and module entry points for ${activeProject.companyName}.`,
        route: `/app/project/${pid}`,
        crossRefs: [
          { label: 'Source S1', type: 'source', route: `/app/project/${pid}/sources/S1` },
          { label: 'Claim C2', type: 'claim', route: `/app/project/${pid}/verification/claim/C2` },
        ],
        searchText: `project overview ${activeProject.companyName} ${activeProject.ticker} source register provenance`,
      },
      {
        id: 'PAGE-PIPELINE',
        category: 'pages',
        title: 'Multi-Agent Verification Pipeline',
        subtitle: 'Project Module · 5-Step Orchestrator, Event Logs & Failure Simulation',
        snippet: 'Inspect Document Retrieval, Financial Analysis, Evidence Verification, Risk & Governance, and Report Synthesis agents.',
        route: `/app/project/${pid}/pipeline`,
        crossRefs: [
          { label: 'Agent 1 Retrieve', type: 'agent', route: `/app/project/${pid}/pipeline/agent/agent-retrieve` },
          { label: 'Agent 3 Verify', type: 'agent', route: `/app/project/${pid}/pipeline/agent/agent-verify` },
        ],
        searchText: 'pipeline multi-agent orchestrator retrieve analyze verify risk report logs',
      },
      {
        id: 'PAGE-ANALYSIS',
        category: 'pages',
        title: 'Deterministic Financial Analysis & Statements',
        subtitle: 'Project Module · 3-Year Statements, Quarterly Series & 8 Ratios',
        snippet: 'Inspect Income Statement, Balance Sheet, Cash Flow (including Q4 NULL OCF), and pure TypeScript ratio formulas.',
        route: `/app/project/${pid}/analysis`,
        crossRefs: [
          { label: 'RAT-GM (40.0%)', type: 'metric', route: `/app/project/${pid}/analysis/ratio/RAT-GM` },
          { label: 'M-OCF-Q4 (NULL)', type: 'metric', route: `/app/project/${pid}/analysis/metric/M-OCF-Q4` },
        ],
        searchText: 'financial analysis statements ratios gross margin net margin current ratio cash flow',
      },
      {
        id: 'PAGE-VERIFY',
        category: 'pages',
        title: 'Evidence Verification Matrix & Claims Ledger',
        subtitle: 'Project Module · Cross-Source Claim Checking (C1–C10)',
        snippet: 'Filter claims by Verified, Partially Supported, Contradicted ($552M vs $540M), and Unsupported.',
        route: `/app/project/${pid}/verification`,
        crossRefs: [
          { label: 'Claim C2 Conflict', type: 'claim', route: `/app/project/${pid}/verification/claim/C2` },
          { label: 'Claim C5 Unsupported', type: 'claim', route: `/app/project/${pid}/verification/claim/C5` },
        ],
        searchText: 'evidence verification claims matrix contradicted unsupported verified c1 c2 c3 c5',
      },
      {
        id: 'PAGE-RISKS',
        category: 'pages',
        title: 'Risk & Governance Center (NIST AI RMF)',
        subtitle: 'Project Module · Evidence-Backed Risks vs. Analyst Hypotheses',
        snippet: 'Inspect supplier concentration (R1: 38%), revenue discrepancy (R2), prompt-injection quarantine (R6), and NIST AI RMF controls.',
        route: `/app/project/${pid}/risks`,
        crossRefs: [
          { label: 'Risk R1 (38%)', type: 'risk', route: `/app/project/${pid}/risks/R1` },
          { label: 'Risk R5 Hypothesis', type: 'risk', route: `/app/project/${pid}/risks/R5` },
        ],
        searchText: 'risk center governance nist ai rmf hypothesis supplier concentration r1 r2 r5 r6',
      },
      {
        id: 'PAGE-REPORT',
        category: 'pages',
        title: '12-Section Executive Research Report & Human Review Gate',
        subtitle: 'Project Module · Traceable Dossier, Version Diff (v1/v2) & Attestation',
        snippet: 'Read the full 12-section investment research report with inline citation chips and human reviewer sign-off.',
        route: `/app/project/${pid}/report`,
        crossRefs: [
          { label: 'Claim C2', type: 'claim', route: `/app/project/${pid}/verification/claim/C2` },
          { label: 'Source S1', type: 'source', route: `/app/project/${pid}/sources/S1` },
        ],
        searchText: 'research report final dossier 12 sections human review approval sign-off export',
      },
      {
        id: 'PAGE-AUDIT',
        category: 'pages',
        title: 'Immutable Audit Trail & Before/After Ledger',
        subtitle: 'Governance Page · Timestamped Reviewer Decisions & Corrections',
        snippet: 'Inspect every human review decision, claim correction, prompt-injection block, and report version publication.',
        route: '/app/audit',
        crossRefs: [],
        searchText: 'audit log trail history governance reviewer attestation corrections csv',
      },
      {
        id: 'PAGE-WATCHLIST',
        category: 'pages',
        title: 'Watchlist & Automated Discrepancy Alerts',
        subtitle: 'Governance Page · Threshold Triggers & Cross-Filing Alerts',
        snippet: 'Monitor tracked companies for margin shifts, contradicted claims, and stale source warnings.',
        route: '/app/watchlist',
        crossRefs: [],
        searchText: 'watchlist alerts monitoring threshold triggers notifications',
      },
      {
        id: 'PAGE-COMPARE',
        category: 'pages',
        title: 'Multi-Period & Cross-Entity Comparison Mode',
        subtitle: 'Governance Page · Side-by-Side Benchmarking & Origin Guard',
        snippet: 'Compare FY2022, FY2023, and FY2024 ratios or benchmark across research dossiers.',
        route: '/app/compare',
        crossRefs: [],
        searchText: 'compare comparison mode side by side benchmark periods entities',
      },
      {
        id: 'PAGE-EVAL',
        category: 'pages',
        title: 'FinQA Numerical Benchmark & System Trust Tests',
        subtitle: 'Governance Page · 10/10 Deterministic Math Suite & Provenance Checks',
        snippet: 'Run the 10-question FinQA deterministic arithmetic benchmark and verify end-to-end provenance assertions.',
        route: '/app/evaluation',
        crossRefs: [],
        searchText: 'evaluation finqa benchmark numerical math tests accuracy trust tests',
      },
      {
        id: 'PAGE-RESOURCES',
        category: 'pages',
        title: 'Trust Standards, SEC EDGAR & NIST AI RMF Resources',
        subtitle: 'Governance Page · Methodology & Verification Checklist',
        snippet: 'Explore SEC EDGAR filing hierarchy, FinQA deterministic execution, and NIST AI RMF 1.0 governance mappings.',
        route: '/app/resources',
        crossRefs: [],
        searchText: 'resources standards sec edgar finqa nist ai rmf compliance',
      },
      {
        id: 'PAGE-WALKTHROUGH',
        category: 'pages',
        title: 'Guided Verification Walkthrough',
        subtitle: 'Governance Page · End-to-End Checkpoints',
        snippet: 'Step-by-step walkthrough of contradiction detection, deterministic ratios, injection quarantine, and human sign-off.',
        route: '/app/walkthrough',
        crossRefs: [],
        searchText: 'walkthrough guided tour steps checkpoints',
      },
      {
        id: 'PAGE-NEW',
        category: 'pages',
        title: 'New Research Wizard (Create Dossier)',
        subtitle: 'Workspace Page · 4-Step Project & Source Ingestion Wizard',
        snippet: 'Configure company profile, periods, source ingestion, and launch the 5-agent verification pipeline.',
        route: '/app/new',
        crossRefs: [],
        searchText: 'new research wizard create project upload sources',
      },
      {
        id: 'PAGE-SETTINGS',
        category: 'pages',
        title: 'Workspace & Cloud Database Settings',
        subtitle: 'Governance Page · Role Switcher, Cloud Firestore Sync & Reset',
        snippet: 'Manage active Analyst/Reviewer role, Cloud Firestore synchronization, and baseline dataset restoration.',
        route: '/app/settings',
        crossRefs: [],
        searchText: 'settings role analyst reviewer cloud database firestore reset',
      },
    ];

    for (const pg of workspacePages) {
      items.push({
        ...pg,
        uid: `page-${pg.id}`,
        projectId: pid,
        projectTicker: activeProject.ticker,
      });
    }

    return items;
  }, [projects, activeProject]);

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);

    return allIndexedItems.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (tokens.length === 0) {
        // Show active project items and top pages by default
        return item.projectId === activeProject.id;
      }
      return tokens.every((tk) => item.searchText.includes(tk));
    });
  }, [allIndexedItems, query, category, activeProject.id]);

  // Reset selectedIndex when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, category]);

  const handleNavigate = (route: string) => {
    if (!user && route.startsWith('/app')) {
      loginAsAnalyst('Analyst');
    }
    onClose();
    navigate(route);
  };

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredResults.length > 0 ? (prev + 1) % Math.min(filteredResults.length, 40) : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredResults.length > 0
            ? (prev - 1 + Math.min(filteredResults.length, 40)) %
              Math.min(filteredResults.length, 40)
            : 0
        );
      } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
        e.preventDefault();
        handleNavigate(filteredResults[selectedIndex].route);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, filteredResults, selectedIndex]);

  if (!isOpen) return null;

  const categoryTabs: { key: SearchCategory; label: string; count: number }[] = [
    { key: 'all', label: 'All Indexed', count: allIndexedItems.length },
    {
      key: 'claims',
      label: 'Claims',
      count: allIndexedItems.filter((i) => i.category === 'claims').length,
    },
    {
      key: 'sources',
      label: 'Sources & Passages',
      count: allIndexedItems.filter((i) => i.category === 'sources').length,
    },
    {
      key: 'metrics',
      label: 'Metrics & Ratios',
      count: allIndexedItems.filter((i) => i.category === 'metrics').length,
    },
    {
      key: 'risks',
      label: 'Risks',
      count: allIndexedItems.filter((i) => i.category === 'risks').length,
    },
    {
      key: 'pages',
      label: 'Pages & Agents',
      count: allIndexedItems.filter((i) => i.category === 'pages').length,
    },
  ];

  const getCategoryIcon = (cat: SearchResultItem['category']) => {
    switch (cat) {
      case 'claims':
        return <CheckSquare className="w-4 h-4 text-[#D4FF3F]" />;
      case 'sources':
        return <FileText className="w-4 h-4 text-[#D4FF3F]" />;
      case 'metrics':
        return <BarChart3 className="w-4 h-4 text-[#D4FF3F]" />;
      case 'risks':
        return <AlertOctagon className="w-4 h-4 text-[#E34234]" />;
      case 'pages':
        return <Compass className="w-4 h-4 text-[#CBB3E8]" />;
    }
  };

  const getCategoryLabel = (cat: SearchResultItem['category']) => {
    switch (cat) {
      case 'claims':
        return 'CLAIM';
      case 'sources':
        return 'SOURCE';
      case 'metrics':
        return 'METRIC / RATIO';
      case 'risks':
        return 'RISK';
      case 'pages':
        return 'PAGE / AGENT';
    }
  };

  const visibleResults = filteredResults.slice(0, 40);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Cross-Referenced Search (Ctrl+K)"
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 md:pt-16 px-4 bg-[#2A1F45]/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-[#F3EBFA] border-2 border-[#2A1F45] shadow-2xl overflow-hidden flex flex-col max-h-[82vh]">
        {/* Top Search Input Bar */}
        <div className="bg-[#2A1F45] text-[#F3EBFA] p-4 border-b border-[#8A6BC2] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#D4FF3F] text-[#2A1F45] flex items-center justify-center shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search claims (C2, $552M), sources (S1, S7), metrics (RAT-GM, OCF), risks (R1, 38%), or pages..."
              className="flex-1 bg-transparent text-[#F3EBFA] placeholder-[#CBB3E8] text-sm md:text-base font-medium focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="px-2.5 py-1 rounded-full bg-[#8A6BC2]/40 hover:bg-[#8A6BC2] text-xs font-mono text-[#F3EBFA] cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close global search"
              className="p-1.5 rounded-full bg-[#8A6BC2]/30 hover:bg-[#E34234] text-[#F3EBFA] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-mono text-[#CBB3E8] flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-[#D4FF3F]" />
              <span>Quick Jumps:</span>
            </span>
            {[
              { label: 'C2 ($552M Conflict)', q: 'C2' },
              { label: 'S1 Audited 10-K', q: 'S1' },
              { label: 'S7 Injection Quarantine', q: 'S7' },
              { label: 'M-OCF-Q4 (NULL)', q: 'M-OCF-Q4' },
              { label: 'R1 Supplier 38%', q: 'R1' },
              { label: 'RAT-NM (11.0%)', q: 'RAT-NM' },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setQuery(chip.q)}
                className="px-2.5 py-0.5 rounded-full bg-[#8A6BC2]/35 hover:bg-[#D4FF3F] text-[#F3EBFA] hover:text-[#2A1F45] font-mono transition-colors cursor-pointer border border-[#8A6BC2]"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {categoryTabs.map((tab) => {
              const active = category === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setCategory(tab.key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#D4FF3F] text-[#2A1F45] font-bold'
                      : 'bg-[#8A6BC2]/30 text-[#E9DDF6] hover:bg-[#8A6BC2]/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                      active ? 'bg-[#2A1F45] text-[#D4FF3F]' : 'bg-[#2A1F45]/60 text-[#CBB3E8]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {visibleResults.length === 0 ? (
            <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-8 text-center space-y-2">
              <div className="font-display text-lg font-bold text-[#2A1F45]">
                No indexed matches for “{query}”
              </div>
              <p className="text-xs text-[#6B5B86]">
                Try searching for claim IDs (C1–C10), source IDs (S1–S7), metrics (M-REV, RAT-GM), or risks (R1–R6).
              </p>
            </div>
          ) : (
            visibleResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.uid}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleNavigate(item.route)}
                  className={`rounded-2xl p-3.5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#E9DDF6] border-[#2A1F45] shadow-sm'
                      : 'bg-[#F3EBFA] border-[#B9A0DA] hover:bg-[#E9DDF6]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-[#2A1F45] flex items-center justify-center shrink-0 mt-0.5">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono text-[10px] font-bold">
                            {getCategoryLabel(item.category)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#CBB3E8] text-[#2A1F45] font-mono text-[10px] font-bold">
                            {item.projectTicker}
                          </span>
                          <span className="font-display font-bold text-sm text-[#2A1F45] leading-snug">
                            {item.title}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[#6B5B86]">{item.subtitle}</div>
                        <p className="text-xs text-[#2A1F45] line-clamp-2 leading-relaxed">
                          {item.snippet}
                        </p>

                        {/* Cross-Referenced Entities Linking Directly to Their Detail Pages */}
                        {item.crossRefs.length > 0 && (
                          <div
                            className="flex flex-wrap items-center gap-1.5 pt-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#6B5B86]">
                              <Link2 className="w-3 h-3 text-[#8A6BC2]" />
                              <span>Cross-Refs:</span>
                            </span>
                            {item.crossRefs.map((ref) => (
                              <button
                                key={`${item.uid}-${ref.label}`}
                                type="button"
                                onClick={() => handleNavigate(ref.route)}
                                className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border border-[#2A1F45] transition-colors cursor-pointer inline-flex items-center gap-1 ${
                                  ref.type === 'risk'
                                    ? 'bg-[#E34234] text-[#F3EBFA] hover:bg-[#B8301F]'
                                    : ref.type === 'claim'
                                    ? 'bg-[#D4FF3F] text-[#2A1F45] hover:bg-[#EAF7A8]'
                                    : 'bg-[#EAF7A8] text-[#2A1F45] hover:bg-[#D4FF3F]'
                                }`}
                              >
                                <span>{ref.label}</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status && <StatusBadge status={item.status} />}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4FF3F] text-[#2A1F45] border border-[#2A1F45] text-[11px] font-bold">
                        <span>Open</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Keyboard Legend */}
        <div className="bg-[#E9DDF6] border-t border-[#B9A0DA] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#6B5B86]">
          <div className="flex items-center gap-4">
            <span>
              <strong className="text-[#2A1F45]">↑↓</strong> Navigate
            </span>
            <span>
              <strong className="text-[#2A1F45]">Enter</strong> Open Detail Page
            </span>
            <span>
              <strong className="text-[#2A1F45]">Esc</strong> Close
            </span>
          </div>
          <div>
            Showing <strong className="text-[#2A1F45]">{visibleResults.length}</strong> cross-referenced records
          </div>
        </div>
      </div>
    </div>
  );
};
