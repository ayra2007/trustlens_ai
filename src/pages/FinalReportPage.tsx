import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldCheck,
  Printer,
  Download,
  Copy,
  Share2,
  GitCompare,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BookOpen,
  FileText,
  HelpCircle,
  Sparkles,
  CheckSquare,
  Square,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import {
  StatusBadge,
  SourceChip,
  ClaimChip,
  MetricChip,
  RatioChip,
  RiskChip,
  Breadcrumbs,
  SyntheticOriginTag,
} from '../components/ui/primitives';

const TOC_SECTIONS = [
  { id: 'rep-sec-1', num: '01', title: 'Company Profile & Scope' },
  { id: 'rep-sec-2', num: '02', title: 'Executive Summary (Verified Only)' },
  { id: 'rep-sec-3', num: '03', title: 'Key Financial Metrics & Periods' },
  { id: 'rep-sec-4', num: '04', title: 'Financial Ratios & Formulas' },
  { id: 'rep-sec-5', num: '05', title: 'Period Comparisons & Trends' },
  { id: 'rep-sec-6', num: '06', title: 'Findings Linked to Evidence' },
  { id: 'rep-sec-7', num: '07', title: 'Verification & Flagged Claims' },
  { id: 'rep-sec-8', num: '08', title: 'Financial & Business Risks' },
  { id: 'rep-sec-9', num: '09', title: 'Missing Info & Uncertainties' },
  { id: 'rep-sec-10', num: '10', title: 'Suggested Follow-Up Questions' },
  { id: 'rep-sec-11', num: '11', title: 'Source Register & Audit Appendix' },
  { id: 'rep-sec-12', num: '12', title: 'Analyst Review & Approval Controls' },
];

export const FinalReportPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    projects,
    activeProject,
    auditEntries,
    isPipelineRunning,
    signOffReport,
    requestReportRevision,
    openSourceDrawer,
    addToast,
  } = useAppStore();

  const project = projects.find((p) => p.id === projectId) || activeProject;
  const pid = project.id;

  const versions = project.report.versions || [
    {
      versionNumber: project.report.versionNumber || 1,
      createdAt: project.report.generatedAt,
      status: project.report.reviewStatus,
      author: 'Report Generation Agent',
      changeSummary: 'Initial 12-section research dossier compiled from verified findings.',
      reverifiedClaimIds: project.claims.map((c) => c.id),
      executiveSummarySnapshot: project.report.executiveSummary,
      unresolvedClaimIdsSnapshot: ['C2', 'C3', 'C5', 'C7', 'C8'],
    },
  ];

  const latestVersionNum = project.report.versionNumber || versions[0]?.versionNumber || 1;
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(latestVersionNum);
  const [activeTocId, setActiveTocId] = useState<string>('rep-sec-1');
  const [expandedFindingIds, setExpandedFindingIds] = useState<string[]>(['C1', 'C4', 'C6', 'C10']);
  const [showCompareVersionsModal, setShowCompareVersionsModal] = useState<boolean>(false);

  // Review Panel States
  const [ackUnresolved, setAckUnresolved] = useState<boolean>(false);
  const [reviewComment, setReviewComment] = useState<string>(
    'Verified audited S1 figures ($540.0M revenue, 11.0% net margin, 1.67x current ratio) and attested to exclusion of S2 $552.0M contradiction from verified conclusions.'
  );
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);
  const [showRevisionPanel, setShowRevisionPanel] = useState<boolean>(false);
  const [revisionComment, setRevisionComment] = useState<string>(
    'Re-verify revenue reconciliation between S1 p.31 ($540.0M) and S2 p.1 ($552.0M) and check Q4 cash flow footnote.'
  );
  const [selectedClaimsForRevision, setSelectedClaimsForRevision] = useState<string[]>([
    'C2',
    'C3',
    'C7',
  ]);

  useEffect(() => {
    setSelectedVersionNum(project.report.versionNumber || 1);
  }, [project.report.versionNumber]);

  // Scroll-spy for left sticky TOC
  useEffect(() => {
    const handleScroll = () => {
      const offset = 180;
      let current = TOC_SECTIONS[0].id;
      for (const sec of TOC_SECTIONS) {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= offset) {
            current = sec.id;
          }
        }
      }
      setActiveTocId(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const anyAgentFailed =
    Boolean(project.simulateRiskFailure) || project.agents.some((a) => a.status === 'Failed');

  // Unresolved claims (C2, C3, C5, C7, C8 or any non-Verified claim not marked Corrected)
  const unresolvedClaims = project.claims.filter(
    (c) => c.status !== 'Verified' && c.analystStatus !== 'Corrected'
  );
  const verifiedClaims = project.claims.filter(
    (c) => c.status === 'Verified' || c.analystStatus === 'Corrected'
  );

  const selectedVersionObj =
    versions.find((v) => v.versionNumber === selectedVersionNum) || versions[0];

  const annualFinancials = project.financials.filter((f) => f.periodType === 'Annual');
  const quarterlyFinancials = project.financials.filter((f) => f.periodType === 'Quarterly');

  const trendChartData = annualFinancials.map((f) => ({
    period: f.period,
    Revenue: f.revenue,
    COGS: f.cogs,
    NetIncome: f.netIncome,
    OperatingCashFlow: f.operatingCashFlow,
  }));

  const quarterlyChartData = quarterlyFinancials.map((q) => ({
    period: q.period.replace(' FY2024', ''),
    Revenue: q.revenue,
    NetIncome: q.netIncome,
    OCF: q.operatingCashFlow ?? 0,
  }));

  const scrollToSection = (id: string) => {
    setActiveTocId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleExportPdf = () => {
    addToast(
      'Preparing Print / PDF Dossier',
      'Opening browser print dialog with palette-preserving stylesheet...',
      'verified'
    );
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportCsv = () => {
    const rows: string[][] = [
      ['Section', 'ID', 'Name / Statement', 'Period', 'Value / Status', 'Source', 'Details'],
    ];
    project.metrics.forEach((m) => {
      rows.push([
        'Metric',
        m.id,
        m.name,
        m.period,
        m.value !== null ? `$${m.value.toFixed(1)}M` : 'NULL (Missing)',
        m.sourceId,
        m.changeNote,
      ]);
    });
    project.ratios.forEach((r) => {
      rows.push([
        'Ratio',
        r.id,
        r.name,
        r.period,
        r.formattedValue,
        r.sourceIds.join(';'),
        `${r.formula} | Delta: ${r.deltaFormatted}`,
      ]);
    });
    project.claims.forEach((c) => {
      rows.push([
        'Claim',
        c.id,
        c.statement,
        c.period || 'FY2024',
        `${c.status}${c.analystStatus === 'Corrected' ? ` (Corrected: ${c.correctedValue})` : ''}`,
        c.originSourceId,
        c.confidenceNote,
      ]);
    });

    const csvString = rows
      .map((r) => r.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.ticker}_Research_Report_v${selectedVersionNum}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported CSV Dossier', `Downloaded ${rows.length - 1} metrics, ratios, and claims.`, 'verified');
  };

  const handleCopySummary = () => {
    const summaryText = `TrustLens Research Report (${project.ticker} — v${selectedVersionNum})\nOrigin: ${project.dataOrigin}\nDisclaimer: Decision support only, not financial advice.\n\nExecutive Summary:\n${selectedVersionObj.executiveSummarySnapshot}\n\nUnresolved Issues Excluded from Verified Conclusions: ${unresolvedClaims.map((c) => `${c.id} (${c.status})`).join(', ')}`;
    navigator.clipboard?.writeText(summaryText);
    addToast('Summary Copied', 'Copied verified executive summary and provenance notice.', 'verified');
  };

  const handleShareLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    addToast('Local Share Link Copied', url, 'verified');
  };

  const toggleFindingExpand = (id: string) => {
    setExpandedFindingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleClaimForRevision = (cid: string) => {
    setSelectedClaimsForRevision((prev) =>
      prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]
    );
  };

  const getSourcePassageText = (sourceId: string, passageId: string) => {
    const src = project.sources.find((s) => s.id === sourceId);
    if (!src) return 'Source passage available in provenance drawer.';
    for (const pg of src.pages) {
      const p = pg.passages.find((pas) => pas.id === passageId);
      if (p) return p.text;
    }
    return src.pages[0]?.content || 'Source passage available in provenance drawer.';
  };

  // Executive summary sentences strictly from Verified findings, each with an evidence chip
  const verifiedExecutiveSentences = [
    {
      id: 'exec-1',
      text: `Audited consolidated FY2024 revenue for ${project.companyName} (${project.ticker}) reached $540.0M, representing +15.4% year-over-year expansion from $468.0M in FY2023 and $410.0M in FY2022, verified by the exact sum of Q1 ($120.0M), Q2 ($128.0M), Q3 ($137.0M), and Q4 ($155.0M).`,
      claimId: 'C1',
      sourceId: 'S1',
      passageId: 'S1-P1',
      metricId: 'M-REV-2024',
    },
    {
      id: 'exec-2',
      text: 'Consolidated net income rose +24.3% YoY to $59.4M in FY2024 (up from $47.8M in FY2023), driving a deterministically verified Net Profit Margin of 11.0% (+0.8pp YoY) and Gross Margin of 40.0% (+1.8pp YoY).',
      claimId: 'C4',
      sourceId: 'S1',
      passageId: 'S1-P1',
      ratioId: 'RAT-NM',
    },
    {
      id: 'exec-3',
      text: 'Year-end liquidity remains solid with Current Assets of $275.0M against Current Liabilities of $165.0M, yielding a verified Current Ratio of 1.67x (compared to 1.60x in FY2023) and Debt-to-Equity of 1.25x ($371.0M Total Liabilities / $297.0M Equity).',
      claimId: 'C6',
      sourceId: 'S1',
      passageId: 'S1-P2',
      ratioId: 'RAT-CR',
    },
    {
      id: 'exec-4',
      text: 'Operational risk disclosures confirm single-source supplier concentration of approximately 38% of precision silicon-carbide power modules procured from Helios MicroSystems GmbH, exposing shipments to 12–18 week fabrication lead-time risk.',
      claimId: 'C10',
      sourceId: 'S1',
      passageId: 'S1-P3',
      riskId: 'R1',
    },
  ];

  const projectAudits = auditEntries
    .filter((a) => !a.projectId || a.projectId === pid)
    .slice(0, 8);

  return (
    <div className="space-y-6 pb-20">
      <div className="no-print">
        <Breadcrumbs
          backTo={`/app/project/${pid}`}
          items={[
            { label: 'Projects', to: '/app/dashboard' },
            { label: `${project.companyName} (${project.ticker})`, to: `/app/project/${pid}` },
            { label: `Final Research Report (v${selectedVersionNum})` },
          ]}
        />
      </div>

      {/* Persistent Governance Gate if any agent is Failed */}
      {anyAgentFailed && (
        <div className="rounded-2xl bg-[#E34234] text-[#F3EBFA] p-5 border-2 border-[#2A1F45] flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 text-[#D4FF3F]" />
            <div className="space-y-1">
              <div className="font-display text-lg font-bold">
                Orchestrator Governance Gate: Approval Blocked While Agent Is Failed
              </div>
              <p className="text-xs text-[#F3EBFA]">
                One or more pipeline agents (Risk & Uncertainty Agent) are currently in a{' '}
                <strong>Failed</strong> state. Return to the Agent Pipeline and click "Retry agent"
                before approving this dossier.
              </p>
            </div>
          </div>
          <Link
            to={`/app/project/${pid}/pipeline`}
            className="px-4 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45]"
          >
            Go to Pipeline & Retry Agent →
          </Link>
        </div>
      )}

      {/* Magazine-Style Report Header Banner with Tomato Red, Chartreuse & Lavender 3D Accents */}
      <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] border-2 border-[#E34234] p-6 md:p-8 relative overflow-hidden shadow-lg">
        {/* Decorative 3D Glossy Ribbon & Sphere SVG in Header */}
        <svg
          className="absolute right-0 top-0 w-72 h-72 opacity-30 pointer-events-none"
          viewBox="0 0 240 240"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="repTomatoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E34234" />
              <stop offset="100%" stopColor="#B8301F" />
            </linearGradient>
            <linearGradient id="repLavGrad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#CBB3E8" />
              <stop offset="100%" stopColor="#8A6BC2" />
            </linearGradient>
          </defs>
          <circle cx="180" cy="60" r="70" stroke="url(#repTomatoGrad)" strokeWidth="22" />
          <circle cx="140" cy="110" r="55" stroke="url(#repLavGrad)" strokeWidth="16" />
          <circle cx="195" cy="48" r="16" fill="#D4FF3F" />
        </svg>

        <div className="relative z-10 space-y-5">
          {/* Top Badges + Version Selector + Disclaimer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#8A6BC2] pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <SyntheticOriginTag origin={project.dataOrigin} />
              <StatusBadge
                status={anyAgentFailed ? 'Needs Review' : selectedVersionObj.status}
              />
              {/* Version Dropdown */}
              <div className="inline-flex items-center gap-1.5 bg-[#8A6BC2] text-[#F3EBFA] px-3 py-1 rounded-full border-[1.5px] border-[#D4FF3F] text-xs font-mono font-bold">
                <span>VERSION:</span>
                <select
                  aria-label="Select report version"
                  value={selectedVersionNum}
                  onChange={(e) => setSelectedVersionNum(Number(e.target.value))}
                  className="bg-[#8A6BC2] text-[#D4FF3F] font-mono font-bold focus:outline-none cursor-pointer"
                >
                  {versions.map((v) => (
                    <option key={v.versionNumber} value={v.versionNumber}>
                      v{v.versionNumber} ({v.status})
                    </option>
                  ))}
                </select>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#E34234] text-[#F3EBFA] border-[1.5px] border-[#F3EBFA] text-xs font-mono font-bold">
                {unresolvedClaims.length} Unresolved Issues Flagged
              </span>
            </div>

            <div className="px-3.5 py-1.5 rounded-full bg-[#B8301F] text-[#F3EBFA] border border-[#D4FF3F] text-xs font-mono font-bold tracking-wide">
              DISCLAIMER: Decision support only, not financial advice.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8 space-y-2">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4FF3F]">
                TRUSTLENS MULTI-AGENT RESEARCH DOSSIER • 12-SECTION TRACEABLE AUDIT
              </div>
              <h1 className="font-display text-2xl md:text-4xl font-bold text-[#F3EBFA] leading-tight">
                {project.report.title}
              </h1>
              <p className="text-xs text-[#CBB3E8] font-mono">
                Generated: {new Date(selectedVersionObj.createdAt).toLocaleString()} • Author:{' '}
                {selectedVersionObj.author} • Zero Investment Ratings Policy Active
              </p>
            </div>

            {/* Action Toolbar */}
            <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-2 no-print">
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45] hover:bg-[#EAF7A8] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-bold border-[1.5px] border-[#F3EBFA] hover:bg-[#B8301F] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#8A6BC2] text-[#F3EBFA] text-xs font-semibold border-[1.5px] border-[#CBB3E8] hover:bg-[#2A1F45] cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy summary</span>
              </button>
              <button
                type="button"
                onClick={handleShareLink}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#8A6BC2] text-[#F3EBFA] text-xs font-semibold border-[1.5px] border-[#CBB3E8] hover:bg-[#2A1F45] cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share link (local)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCompareVersionsModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F3EBFA] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#E34234] hover:bg-[#E9DDF6] cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5 text-[#E34234]" />
                <span>Compare with previous version</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compare Versions Modal / Drawer */}
      {showCompareVersionsModal && (
        <div className="rounded-2xl bg-[#F3EBFA] border-2 border-[#E34234] p-6 space-y-4 shadow-xl no-print">
          <div className="flex items-center justify-between border-b border-[#B9A0DA] pb-3">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-[#E34234]" />
              <h3 className="font-display text-xl font-bold text-[#2A1F45]">
                Report Version History & Diff Comparison ({versions.length} Version
                {versions.length > 1 ? 's' : ''})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowCompareVersionsModal(false)}
              className="px-3 py-1 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-bold cursor-pointer"
            >
              Close Diff
            </button>
          </div>
          {versions.length === 1 ? (
            <div className="rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-[#2A1F45]">
                  Currently on Initial Version v1 ({versions[0].status})
                </div>
                <p className="text-xs text-[#6B5B86]">
                  Use "Request Revision" in Section 12 below to select claims for re-verification and
                  automatically generate v2 for side-by-side comparison.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCompareVersionsModal(false);
                  setShowRevisionPanel(true);
                  scrollToSection('rep-sec-12');
                }}
                className="px-4 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border border-[#2A1F45] cursor-pointer"
              >
                Create v2 via Request Revision →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {versions.slice(0, 2).map((ver) => (
                <div
                  key={ver.versionNumber}
                  className="rounded-xl bg-[#E9DDF6] border-[1.5px] border-[#8A6BC2] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] text-xs font-mono font-bold">
                      Version v{ver.versionNumber}
                    </span>
                    <StatusBadge status={ver.status} />
                  </div>
                  <div className="text-xs font-mono text-[#6B5B86]">
                    {new Date(ver.createdAt).toLocaleString()} • {ver.author}
                  </div>
                  <p className="text-xs font-semibold text-[#2A1F45]">{ver.changeSummary}</p>
                  <div className="p-3 rounded-lg bg-[#F3EBFA] border border-[#B9A0DA] text-xs text-[#2A1F45]">
                    {ver.executiveSummarySnapshot}
                  </div>
                  <div className="text-xs font-mono text-[#B8301F] font-bold">
                    Re-verified Claims: {ver.reverifiedClaimIds.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main 2-Column Layout: Left Sticky TOC + Right 12-Section Reading Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sticky Table of Contents with Scroll-Spy */}
        <aside className="lg:col-span-3 lg:sticky lg:top-20 rounded-2xl bg-[#2A1F45] text-[#F3EBFA] border-2 border-[#8A6BC2] p-4 space-y-3 no-print">
          <div className="flex items-center justify-between border-b border-[#8A6BC2] pb-2.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#D4FF3F] font-bold">
              TABLE OF CONTENTS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-mono font-bold">
              12 Sections
            </span>
          </div>
          <nav className="space-y-1" aria-label="Report sections">
            {TOC_SECTIONS.map((sec) => {
              const isActive = activeTocId === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#D4FF3F] text-[#2A1F45] font-bold shadow-sm'
                      : 'text-[#E9DDF6] hover:bg-[#8A6BC2] hover:text-[#F3EBFA]'
                  }`}
                >
                  <span
                    className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-[#E34234] text-[#F3EBFA] font-bold'
                        : 'bg-[#8A6BC2] text-[#D4FF3F]'
                    }`}
                  >
                    {sec.num}
                  </span>
                  <span className="truncate">{sec.title}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[#8A6BC2] space-y-2">
            <div className="text-xs font-mono text-[#CBB3E8]">QUICK JUMP TO WORKSPACE</div>
            <div className="flex flex-wrap gap-1.5">
              <Link
                to={`/app/project/${pid}/verification`}
                className="px-2.5 py-1 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-bold"
              >
                Claims ({project.claims.length})
              </Link>
              <Link
                to={`/app/project/${pid}/analysis`}
                className="px-2.5 py-1 rounded-full bg-[#8A6BC2] text-[#F3EBFA] text-xs font-bold"
              >
                Analysis
              </Link>
              <Link
                to={`/app/project/${pid}/risks`}
                className="px-2.5 py-1 rounded-full bg-[#B8301F] text-[#F3EBFA] text-xs font-bold"
              >
                Risks ({project.risks.length})
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Reading Column on Light Lavender (#F3EBFA) Cards */}
        <div className="lg:col-span-9 space-y-6">
          {/* SECTION 1: Company profile and analysis scope */}
          <section
            id="rep-sec-1"
            className="rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] p-6 space-y-4 scroll-mt-24"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#B9A0DA] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-[#E34234] text-[#F3EBFA] font-mono text-xs font-bold">
                  SECTION 01
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-[#2A1F45]">
                  Company Profile & Analysis Scope
                </h2>
              </div>
              <Link
                to={`/app/project/${pid}`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full border-[1.5px] border-[#2A1F45] text-xs font-bold text-[#2A1F45] hover:bg-[#E9DDF6]"
              >
                <span>Project Overview</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3.5">
                <div className="text-xs font-mono text-[#6B5B86]">COMPANY & TICKER</div>
                <div className="font-display text-base font-bold text-[#2A1F45] mt-1">
                  {project.companyName} ({project.ticker})
                </div>
                <div className="text-xs text-[#8A6BC2] font-semibold mt-0.5">{project.sector}</div>
              </div>
              <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3.5">
                <div className="text-xs font-mono text-[#6B5B86]">DATA ORIGIN LABEL</div>
                <div className="mt-1.5">
                  <SyntheticOriginTag origin={project.dataOrigin} />
                </div>
              </div>
              <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3.5">
                <div className="text-xs font-mono text-[#6B5B86]">REPORTING PERIODS</div>
                <div className="text-xs font-mono font-bold text-[#2A1F45] mt-1">
                  {project.periods.join(', ')}
                </div>
                <div className="text-xs text-[#6B5B86] mt-0.5">Fiscal Year End: {project.fiscalYearEnd}</div>
              </div>
              <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3.5">
                <div className="text-xs font-mono text-[#6B5B86]">SOURCES INGESTED</div>
                <div className="font-display text-base font-bold text-[#E34234] mt-1">
                  {project.sources.length} Primary & Test Docs
                </div>
                <div className="text-xs text-[#2A1F45] mt-0.5">1 Stale (S5), 1 Undated (S6), 1 Injection (S7)</div>
              </div>
            </div>

            <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-[#2A1F45]">
                INGESTED SOURCE DOCUMENTS (CLICK ANY SOURCE TO OPEN PROVENANCE DRAWER):
              </div>
              <div className="flex flex-wrap gap-2">
                {project.sources.map((s) => (
                  <SourceChip
                    key={s.id}
                    sourceId={s.id}
                    projectId={pid}
                    label={`${s.id}: ${s.title.slice(0, 32)}...`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 2: Executive Summary (from Verified findings only; each sentence has an evidence chip) */}
          <section
            id="rep-sec-2"
            className="rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] p-6 space-y-4 scroll-mt-24"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#B9A0DA] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-[#D4FF3F] text-[#2A1F45] border border-[#2A1F45] font-mono text-xs font-bold">
                  SECTION 02
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-[#2A1F45]">
                  Executive Summary (Verified Findings Only)
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] text-xs font-mono font-bold">
                100% Evidence-Backed Sentences
              </span>
            </div>

            <div className="rounded-xl bg-[#EAF7A8] border-[1.5px] border-[#2A1F45] p-3.5 text-xs text-[#2A1F45] font-medium flex items-center justify-between gap-2">
              <span>
                <strong>Governance Rule:</strong> Only <strong>Verified</strong> (or analyst-corrected)
                claims are permitted in this executive summary. Unresolved claims (C2, C3, C5, C7,
                C8) are quarantined in Section 07.
              </span>
              <StatusBadge status="Verified" />
            </div>

            <div className="space-y-3">
              {verifiedExecutiveSentences.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-4 space-y-2.5"
                >
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold shrink-0 mt-0.5">
                      S2.{idx + 1}
                    </span>
                    <p className="text-sm text-[#2A1F45] leading-relaxed font-medium">{item.text}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-9">
                    <span className="text-xs font-mono text-[#6B5B86]">EVIDENCE CHIPS:</span>
                    <ClaimChip claimId={item.claimId} projectId={pid} />
                    <SourceChip
                      sourceId={item.sourceId}
                      projectId={pid}
                      highlightPassageId={item.passageId}
                    />
                    {item.metricId && <MetricChip metricId={item.metricId} projectId={pid} />}
                    {item.ratioId && <RatioChip ratioId={item.ratioId} projectId={pid} />}
                    {item.riskId && <RiskChip riskId={item.riskId} projectId={pid} />}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3: Key financial metrics and periods (click -> metric detail) */}
          <section
            id="rep-sec-3"
            className="rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] p-6 space-y-4 scroll-mt-24"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#B9A0DA] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-[#8A6BC2] text-[#F3EBFA] font-mono text-xs font-bold">
                  SECTION 03
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-[#2A1F45]">
                  Key Financial Metrics & Periods
                </h2>
              </div>
              <Link
                to={`/app/project/${pid}/analysis`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full border-[1.5px] border-[#2A1F45] text-xs font-bold text-[#2A1F45] hover:bg-[#E9DDF6]"
              >
                <span>Open Financial Analysis</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#B9A0DA]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#2A1F45] text-[#F3EBFA] font-mono">
                    <th className="p-3">Metric (Click for Detail)</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Audited Value</th>
                    <th className="p-3">Prior Period</th>
                    <th className="p-3">YoY / QoQ Change</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B9A0DA] bg-[#E9DDF6]">
                  {project.metrics.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => navigate(`/app/project/${pid}/analysis/metric/${m.id}`)}
                      className="hover:bg-[#CBB3E8] transition-colors cursor-pointer"
                    >
                      <td className="p-3 font-bold text-[#2A1F45] underline decoration-[#8A6BC2]">
                        {m.name} ({m.id})
                      </td>
                      <td className="p-3 font-mono text-[#2A1F45]">{m.period}</td>
                      <td className="p-3 font-mono font-bold text-[#2A1F45]">
                        {m.value !== null ? (
                          `$${m.value.toFixed(1)}M`
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-[#E34234] text-[#F3EBFA] font-bold">
                            NULL — Missing
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[#6B5B86]">
                        {m.priorValue !== null ? `$${m.priorValue.toFixed(1)}M` : '—'}
                      </td>
                      <td className="p-3 font-mono font-bold text-[#2A1F45]">{m.changeNote}</td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <SourceChip
                          sourceId={m.sourceId}
                          projectId={pid}
                          highlightPassageId={m.passageId}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 4: Financial ratios with formulas (click -> ratio detail) */}
          <section
            id="rep-sec-4"
            className="rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] p-6 space-y-4 scroll-mt-24"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#B9A0DA] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-[#E34234] text-[#F3EBFA] font-mono text-xs font-bold">
                  SECTION 04
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-[#2A1F45]">
                  Financial Ratios with Deterministic Formulas
                </h2>
              </div>
              <span className="text-xs font-mono text-[#6B5B86]">
                Computed via src/lib/calculations (Never LLM-estimated)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.ratios.map((r) => (
                <div
                  key={r.id}
                  onClick={() => navigate(`/app/project/${pid}/analysis/ratio/${r.id}`)}
                  className="rounded-xl bg-[#E9DDF6] border-[1.5px] border-[#8A6BC2] hover:border-[#E34234] p-4 space-y-2.5 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-base font-bold text-[#2A1F45] underline decoration-[#E34234]">
                      {r.name}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-bold text-[#2A1F45]">
                      {r.formattedValue}
                    </span>
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#D4FF3F] text-[#2A1F45] border border-[#2A1F45]">
                      {r.deltaFormatted}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#F3EBFA] border border-[#B9A0DA] font-mono text-xs text-[#2A1F45]">
                    <strong>Formula:</strong> {r.formula}
                  </div>
                  <p className="text-xs text-[#6B5B86]">{r.interpretation}</p>
                  {r.analystCorrectedNote && (
                    <div className="p-2 rounded bg-[#EAF7A8] border border-[#2A1F45] text-xs font-mono text-[#2A1F45]">
                      {r.analystCorrectedNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5: Period comparisons and trends (embedded charts) */}
          <section
            id="rep-sec-5"
            className="rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] p-6 space-y-4 scroll-mt-24"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#B9A0DA] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-[#D4FF3F] text-[#2A1F45] border border-[#2A1F45] font-mono text-xs font-bold">
                  SECTION 05
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-[#2A1F45]">
                  Period Comparisons & Multi-Year Trends
                </h2>
              </div>
              <Link
                to="/app/compare"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-bold"
              >
                <span>Open Full Comparison Mode</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-4 space-y-2">
                <div className="text-xs font-mono font-bold text-[#2A1F45]">
                  ANNUAL REVENUE, COGS & NET INCOME (FY2022–FY2024, $M)
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#B9A0DA" />
                      <XAxis dataKey="period" stroke="#2A1F45" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#2A1F45" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2A1F45',
                          borderColor: '#D4FF3F',
                          color: '#F3EBFA',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#8A6BC2" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="COGS" fill="#E34234" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="NetIncome" fill="#D4FF3F" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-4 space-y-2">
                <div className="text-xs font-mono font-bold text-[#2A1F45]">
                  FY2024 QUARTERLY PROGRESSION (Q1–Q4 SUM = $540.0M; Q4 OCF = NULL)
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={quarterlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#B9A0DA" />
                      <XAxis dataKey="period" stroke="#2A1F45" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#2A1F45" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2A1F45',
                          borderColor: '#E34234',
                          color: '#F3EBFA',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Revenue"
                        stroke="#8A6BC2"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#2A1F45' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="NetIncome"
                        stroke="#E34234"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#E34234' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 6: Findings linked to evidence (expandable cards: finding, claim chip, source chip, passage) */}
          <section
            id="rep-sec-6"
            className="rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] p-6 space-y-4 scroll-mt-24"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#B9A0DA] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-[#8A6BC2] text-[#F3EBFA] font-mono text-xs font-bold">
                  SECTION 06
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-[#2A1F45]">
                  Findings Linked to Primary Evidence
                </h2>
              </div>
              <span className="text-xs font-mono text-[#6B5B86]">
                Click any card to expand exact source passage
              </span>
            </div>

            <div className="space-y-3">
              {verifiedClaims.map((claim) => {
                const isExpanded = expandedFindingIds.includes(claim.id);
                const passageText = getSourcePassageText(
                  claim.originSourceId,
                  claim.originPassageId
                );
                return (
                  <div
                    key={claim.id}
                    className="rounded-xl bg-[#E9DDF6] border-[1.5px] border-[#8A6BC2] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFindingExpand(claim.id)}
                      className="w-full p-4 flex flex-wrap items-center justify-between gap-3 text-left hover:bg-[#CBB3E8] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#2A1F45]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#2A1F45]" />
                        )}
                        <span className="px-2.5 py-0.5 rounded bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold">
                          {claim.id}
                        </span>
                        <span className="text-sm font-bold text-[#2A1F45]">{claim.statement}</span>
                      </div>
                      <StatusBadge status={claim.status} />
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-[#B9A0DA] bg-[#F3EBFA] space-y-3">
                        <div className="pt-3 flex flex-wrap items-center gap-2">
                          <ClaimChip claimId={claim.id} projectId={pid} />
                          <SourceChip
                            sourceId={claim.originSourceId}
                            projectId={pid}
                            highlightPassageId={claim.originPassageId}
                          />
                          {claim.relatedMetricIds.map((mid) => (
                            <MetricChip key={mid} metricId={mid} projectId={pid} />
                          ))}
                          {claim.relatedRatioIds.map((rid) => (
                            <RatioChip key={rid} ratioId={rid} projectId={pid} />
                          ))}
                        </div>
                        <div className="p-3.5 rounded-xl bg-[#E9DDF6] border-l-4 border-[#8A6BC2] space-y-1">
                          <div className="text-xs font-mono font-bold text-[#6B5B86]">
                            VERBATIM SOURCE PASSAGE ({claim.originPassageId}):
                          </div>
                          <p className="text-xs text-[#2A1F45] italic leading-relaxed">
                            "{passageText}"
                          </p>
                        </div>
                        <div className="text-xs font-mono text-[#2A1F45]">
                          <strong>Deterministic Verification Check:</strong>{' '}
                          {claim.verification.deterministicCheck}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 7: Verification results & flagged claims ("Unresolved issues" box in Tomato Red: C2, C3, C5, C7, C8) */}
          <section
            id="rep-sec-7"
            className="rounded-2xl bg-[#F3EBFA] border-2 border-[#E34234] p-6 space-y-4 scroll-mt-24"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E34234] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-[#E34234] text-[#F3EBFA] font-mono text-xs font-bold">
                  SECTION 07
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-[#2A1F45]">
                  Verification Results & Flagged Claims
                </h2>
              </div>
              <Link
                to={`/app/project/${pid}/verification`}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-bold"
              >
                <span>Open Evidence Verification Matrix</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mandatory "Unresolved issues" Tomato Red Box */}
            <div className="rounded-2xl bg-[#E34234] text-[#F3EBFA] border-2 border-[#2A1F45] p-5 space-y-4 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#D4FF3F]" />
                  <h3 className="font-display text-lg font-bold text-[#F3EBFA]">
                    Unresolved Issues Quarantined from Verified Conclusions ({unresolvedClaims.length}{' '}
                    Flagged Claims)
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] text-xs font-mono font-bold">
                  Excluded from Executive Summary
                </span>
              </div>
              <p className="text-xs text-[#F3EBFA] leading-relaxed">
                Per TrustLens Reconciliation Gate rules, the following claims failed full verification
                (Contradicted, Unsupported, or Partially Supported) and are strictly isolated from
                verified findings until corrected or resolved by a human analyst:
              </p>

              <div className="space-y-2.5">
                {project.claims
                  .filter((c) => ['C2', 'C3', 'C5', 'C7', 'C8', 'C9'].includes(c.id))
                  .map((c) => (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/app/project/${pid}/verification/claim/${c.id}`)}
                      className="rounded-xl bg-[#F3EBFA] text-[#2A1F45] border-[1.5px] border-[#2A1F45] p-3.5 flex flex-wrap items-start justify-between gap-3 hover:bg-[#E9DDF6] cursor-pointer"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#B8301F] text-[#F3EBFA] font-mono text-xs font-bold">
                            {c.id}
                          </span>
                          <span className="text-xs font-bold text-[#2A1F45]">{c.statement}</span>
                          {c.analystStatus === 'Corrected' && (
                            <span className="px-2 py-0.5 rounded bg-[#D4FF3F] text-[#2A1F45] font-mono text-xs font-bold">
                              ANALYST-CORRECTED ({c.correctedValue})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#B8301F] font-medium">
                          <strong>Reason / Discrepancy:</strong>{' '}
                          {c.verification.discrepancyNote || c.confidenceNote}
                        </p>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <SourceChip sourceId={c.originSourceId} projectId={pid} />
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </section>

          {/* SECTION 8: Financial and business risks (evidence-backed vs hypotheses) */}
          <section
            id="rep-sec-8"
            className="rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] p-6 space-y-4 scroll-mt-24"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#B9A0DA] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-[#B8301F] text-[#F3EBFA] font-mono text-xs font-bold">
                  SECTION 08
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-[#2A1F45]">
                  Financial & Business Risks (Evidence-Backed vs. Hypotheses)
                </h2>
              </div>
              <Link
                to={`/app/project/${pid}/risks`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full border-[1.5px] border-[#2A1F45] text-xs font-bold text-[#2A1F45] hover:bg-[#E9DDF6]"
              >
                <span>Open Risk Register</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Evidence-Backed Risks */}
              <div className="rounded-xl bg-[#E9DDF6] border-2 border-[#E34234] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-mono font-bold">
                    EVIDENCE-BACKED RISKS
                  </span>
                  <span className="text-xs font-mono text-[#2A1F45] font-bold">
                    Corroborated by Filings
                  </span>
                </div>
                <div className="space-y-2.5">
                  {project.risks
                    .filter((r) => r.riskType !== 'Hypothesis')
                    .map((r) => (
                      <div
                        key={r.id}
                        onClick={() => navigate(`/app/project/${pid}/risks/${r.id}`)}
                        className="rounded-xl bg-[#F3EBFA] border border-[#B9A0DA] p-3 space-y-1.5 hover:border-[#E34234] cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#2A1F45]">
                            {r.id}: {r.title}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#E34234] text-[#F3EBFA] font-mono text-xs font-bold">
                            {r.severity}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B5B86]">{r.summary}</p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Risk Hypotheses */}
              <div className="rounded-xl bg-[#E9DDF6] border-2 border-[#8A6BC2] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] text-xs font-mono font-bold">
                    UNCORROBORATED RISK HYPOTHESES
                  </span>
                  <span className="text-xs font-mono text-[#6B5B86] font-bold">
                    Separated from Verified Risks
                  </span>
                </div>
                <div className="space-y-2.5">
                  {project.risks
                    .filter((r) => r.riskType === 'Hypothesis' || r.id === 'R5')
                    .map((r) => (
                      <div
                        key={r.id}
                        onClick={() => navigate(`/app/project/${pid}/risks/${r.id}`)}
                        className="rounded-xl bg-[#F3EBFA] border border-[#8A6BC2] p-3.5 space-y-2 hover:border-[#2A1F45] cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#2A1F45]">
                            {r.id}: {r.title}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#EAF7A8] text-[#2A1F45] border border-[#2A1F45] font-mono text-xs font-bold">
                            {r.riskType}
                          </span>
                        </div>
                        <p className="text-xs text-[#2A1F45]">{r.summary}</p>
                        <div className="text-xs font-mono text-[#8A6BC2]">
                          Click to inspect or convert to Evidence-Backed if new source is attached →
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 9: Missing information, uncertainties and limitations */}
          <section
            id="rep-sec-9"
            className="rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] p-6 space-y-4 scroll-mt-24"
          >
            <div className="flex items-center gap-2.5 border-b border-[#B9A0DA] pb-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#E34234] text-[#F3EBFA] font-mono text-xs font-bold">
                SECTION 09
              </span>
              <h2 className="font-display text-xl md:text-2xl font-bold text-[#2A1F45]">
                Missing Information, Uncertainties & Limitations
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-[#E9DDF6] border-l-4 border-[#E34234] p-4 space-y-2">
                <div className="text-xs font-mono font-bold text-[#B8301F]">
                  1. MISSING Q4 OPERATING CASH FLOW (NULL)
                </div>
                <p className="text-xs text-[#2A1F45] leading-relaxed">
                  Full-year FY2024 Operating Cash Flow is $70.2M (S1 p.31) and Q1–Q3 cumulative OCF is
                  $50.7M (S4 p.14), but standalone Q4 OCF reconciliation is omitted. TrustLens preserves
                  M-OCF-Q4 as explicit <code className="font-mono font-bold">null</code> rather than
                  interpolating.
                </p>
                <MetricChip metricId="M-OCF-Q4" projectId={pid} />
              </div>

              <div className="rounded-xl bg-[#E9DDF6] border-l-4 border-[#8A6BC2] p-4 space-y-2">
                <div className="text-xs font-mono font-bold text-[#2A1F45]">
                  2. REDACTED CREDIT FACILITY COVENANTS
                </div>
                <p className="text-xs text-[#2A1F45] leading-relaxed">
                  S1 p.47 discloses $145.0M of senior unsecured notes maturing in Q4 FY2026, but bank
                  revolving credit facility interest coverage and leverage maintenance covenants are
                  redacted, limiting Claim C9 to Partially Supported.
                </p>
                <ClaimChip claimId="C9" projectId={pid} />
              </div>

              <div className="rounded-xl bg-[#E9DDF6] border-l-4 border-[#E34234] p-4 space-y-2">
                <div className="text-xs font-mono font-bold text-[#B8301F]">
                  3. STALE (S5) & UNDATED (S6) THIRD-PARTY NOTES
                </div>
                <p className="text-xs text-[#2A1F45] leading-relaxed">
                  Industry market share data in S5 was published in March 2023 (21.5 months prior to
                  FY2024 period end), and sell-side note S6 lacks a publication date or methodology
                  table.
                </p>
                <div className="flex gap-2">
                  <SourceChip sourceId="S5" projectId={pid} />
                  <SourceChip sourceId="S6" projectId={pid} />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 10: Suggested follow-up research questions */}
          <section
            id="rep-sec-10"
            className="rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] p-6 space-y-4 scroll-mt-24"
          >
            <div className="flex items-center gap-2.5 border-b border-[#B9A0DA] pb-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#D4FF3F] text-[#2A1F45] border border-[#2A1F45] font-mono text-xs font-bold">
                SECTION 10
              </span>
              <h2 className="font-display text-xl md:text-2xl font-bold text-[#2A1F45]">
                Suggested Follow-Up Research Questions for Investor Relations / Audit Committee
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  q: 'Request the standalone Q4 FY2024 Statement of Cash Flows working-capital reconciliation schedule omitted from S1 p.31 to verify whether Q4 operating cash flow equaled $19.5M ($70.2M minus $50.7M 9M OCF).',
                  link: `/app/project/${pid}/analysis/metric/M-OCF-Q4`,
                  tag: 'Cash Flow Gap',
                },
                {
                  q: 'Request audit committee documentation regarding the $12.0M bill-and-hold distributor revenue reversal between the Feb 4 preliminary earnings release (S2: $552.0M) and the Feb 14 Form 10-K (S1: $540.0M).',
                  link: `/app/project/${pid}/verification/claim/C2`,
                  tag: 'Revenue Contradiction',
                },
                {
                  q: 'Obtain secondary foundry qualification timelines to mitigate the 38% single-source concentration risk at Helios MicroSystems GmbH (S1 p.47).',
                  link: `/app/project/${pid}/risks/R1`,
                  tag: 'Supply Chain',
                },
                {
                  q: 'Obtain the unredacted revolving credit facility covenant schedule and refinancing plan for the $145.0M senior notes maturing in Q4 FY2026.',
                  link: `/app/project/${pid}/verification/claim/C9`,
                  tag: 'Debt Maturity',
                },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  to={item.link}
                  className="rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] hover:border-[#E34234] p-4 space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold">
                      Question #{idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E34234] text-[#F3EBFA] font-mono text-xs font-bold">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-[#2A1F45] font-medium leading-relaxed">{item.q}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* SECTION 11: Source register and audit appendix */}
          <section
            id="rep-sec-11"
            className="rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] p-6 space-y-4 scroll-mt-24"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#B9A0DA] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-[#8A6BC2] text-[#F3EBFA] font-mono text-xs font-bold">
                  SECTION 11
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-[#2A1F45]">
                  Source Register & Audit Appendix
                </h2>
              </div>
              <Link
                to="/app/audit"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] text-xs font-bold"
              >
                <span>Open Full Audit Trail</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#B9A0DA]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#2A1F45] text-[#F3EBFA] font-mono">
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">Title</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Pub Date</th>
                    <th className="p-2.5">Hygiene / Security Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B9A0DA] bg-[#E9DDF6]">
                  {project.sources.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => openSourceDrawer(s.id, pid, 1)}
                      className="hover:bg-[#CBB3E8] cursor-pointer"
                    >
                      <td className="p-2.5 font-mono font-bold text-[#2A1F45]">{s.id}</td>
                      <td className="p-2.5 font-bold text-[#2A1F45] underline">{s.title}</td>
                      <td className="p-2.5 text-[#6B5B86]">{s.type}</td>
                      <td className="p-2.5 font-mono text-[#2A1F45]">
                        {s.publicationDate || 'UNDATED'}
                      </td>
                      <td className="p-2.5">
                        {s.promptInjectionFlag ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#E34234] text-[#F3EBFA] font-mono text-xs font-bold">
                            Quarantined Prompt Injection
                          </span>
                        ) : s.isStale ? (
                          <StatusBadge status="Stale" />
                        ) : s.missingDateFlag ? (
                          <StatusBadge status="Unsupported" />
                        ) : (
                          <StatusBadge status="Verified" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-[#2A1F45]">
                RECENT AUDIT APPENDIX EVENTS:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {projectAudits.map((aud) => (
                  <Link
                    key={aud.id}
                    to={aud.targetRoute}
                    className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3 flex items-start justify-between gap-2 hover:border-[#8A6BC2]"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#2A1F45]">{aud.action}</div>
                      <div className="text-xs text-[#6B5B86]">{aud.details}</div>
                    </div>
                    <span className="text-xs font-mono text-[#8A6BC2] shrink-0">
                      {aud.actorRole}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 12: Analyst review status and approval controls (sticky on mobile) */}
          <section
            id="rep-sec-12"
            className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] border-2 border-[#D4FF3F] p-6 space-y-5 scroll-mt-24 sticky bottom-2 lg:static z-30 shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#8A6BC2] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-[#D4FF3F] text-[#2A1F45] font-mono text-xs font-bold">
                  SECTION 12
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-[#D4FF3F] flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-[#D4FF3F]" />
                  <span>Analyst Review Status & Approval Controls</span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#CBB3E8]">Current Status:</span>
                <StatusBadge
                  status={anyAgentFailed ? 'Needs Review' : project.report.reviewStatus}
                />
              </div>
            </div>

            {project.report.reviewerSignOff && (
              <div className="rounded-xl bg-[#8A6BC2] text-[#F3EBFA] border border-[#D4FF3F] p-3.5 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong>Latest Attestation:</strong> {project.report.reviewerSignOff.name} (
                  {project.report.reviewerSignOff.role}) — "{project.report.reviewerSignOff.comment}"
                </div>
                <span className="font-mono">
                  {new Date(project.report.reviewerSignOff.timestamp).toLocaleString()}
                </span>
              </div>
            )}

            {/* Unresolved Issues Acknowledgement Checkbox */}
            {unresolvedClaims.length > 0 && (
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#B8301F] text-[#F3EBFA] border-[1.5px] border-[#D4FF3F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={ackUnresolved}
                  onChange={(e) => setAckUnresolved(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#D4FF3F] cursor-pointer"
                />
                <span className="text-xs leading-relaxed">
                  <strong>I acknowledge unresolved issues:</strong> This dossier has{' '}
                  <strong>{unresolvedClaims.length} unresolved claims</strong> (
                  {unresolvedClaims.map((c) => c.id).join(', ')}) which have been quarantined in
                  Section 07 and excluded from verified executive conclusions.
                </span>
              </label>
            )}

            {/* Reviewer Comment Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[#D4FF3F] font-bold">
                REVIEWER ATTESTATION COMMENT (REQUIRED FOR SIGN-OFF):
              </label>
              <input
                type="text"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Enter review comment..."
                className="w-full rounded-xl bg-[#F3EBFA] text-[#2A1F45] px-4 py-2.5 text-xs font-medium border-[1.5px] border-[#B9A0DA]"
              />
            </div>

            {/* Primary 3 Review Buttons: Approve (Chartreuse), Reject (Tomato), Request Revision */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={
                  anyAgentFailed ||
                  isPipelineRunning ||
                  (unresolvedClaims.length > 0 && !ackUnresolved) ||
                  !reviewComment.trim()
                }
                onClick={() => {
                  if (anyAgentFailed) {
                    addToast(
                      'Approval Blocked',
                      'Cannot approve while an agent is in Failed state.',
                      'risk'
                    );
                    return;
                  }
                  signOffReport(pid, 'Approved', reviewComment.trim(), ackUnresolved);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45] disabled:opacity-45 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Report Dossier</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRejectInput((prev) => !prev);
                  setShowRevisionPanel(false);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-bold border-[1.5px] border-[#F3EBFA] hover:bg-[#B8301F] cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Dossier</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRevisionPanel((prev) => !prev);
                  setShowRejectInput(false);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8A6BC2] text-[#F3EBFA] text-xs font-bold border-[1.5px] border-[#D4FF3F] hover:bg-[#CBB3E8] hover:text-[#2A1F45] cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isPipelineRunning ? 'animate-spin' : ''}`} />
                <span>
                  Request Revision & Re-Verify Claims (Creates v{(project.report.versionNumber || 1) + 1})
                </span>
              </button>
            </div>

            {/* Reject Reason Panel */}
            {showRejectInput && (
              <div className="rounded-xl bg-[#B8301F] border-2 border-[#F3EBFA] p-4 space-y-3">
                <div className="text-xs font-mono font-bold text-[#D4FF3F]">
                  REJECTION REASON (REQUIRED):
                </div>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="State specific reason for rejecting this dossier..."
                  className="w-full rounded-xl bg-[#F3EBFA] text-[#2A1F45] px-3.5 py-2 text-xs"
                />
                <button
                  type="button"
                  disabled={!rejectReason.trim()}
                  onClick={() => {
                    signOffReport(pid, 'Rejected', rejectReason.trim(), false);
                    setShowRejectInput(false);
                  }}
                  className="px-4 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  Confirm Rejection & Write Audit Entry
                </button>
              </div>
            )}

            {/* Request Revision + Claim Selection Panel */}
            {showRevisionPanel && (
              <div className="rounded-xl bg-[#8A6BC2] border-2 border-[#D4FF3F] p-4 space-y-3">
                <div className="text-xs font-mono font-bold text-[#D4FF3F]">
                  SELECT CLAIMS TO RE-VERIFY IN PIPELINE & CREATE VERSION v
                  {(project.report.versionNumber || 1) + 1}:
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.claims.map((c) => {
                    const checked = selectedClaimsForRevision.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleClaimForRevision(c.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border cursor-pointer ${
                          checked
                            ? 'bg-[#D4FF3F] text-[#2A1F45] border-[#2A1F45]'
                            : 'bg-[#2A1F45] text-[#F3EBFA] border-[#CBB3E8]'
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="w-3.5 h-3.5" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {c.id} ({c.status})
                        </span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={revisionComment}
                  onChange={(e) => setRevisionComment(e.target.value)}
                  placeholder="Enter revision instructions..."
                  className="w-full rounded-xl bg-[#F3EBFA] text-[#2A1F45] px-3.5 py-2 text-xs"
                />
                <button
                  type="button"
                  disabled={isPipelineRunning || !revisionComment.trim()}
                  onClick={async () => {
                    await requestReportRevision(
                      pid,
                      revisionComment.trim(),
                      selectedClaimsForRevision
                    );
                    setShowRevisionPanel(false);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border border-[#2A1F45] disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPipelineRunning ? 'animate-spin' : ''}`} />
                  <span>
                    {isPipelineRunning
                      ? 'Re-running Orchestrator Pipeline...'
                      : `Run Re-Verification & Publish v${(project.report.versionNumber || 1) + 1}`}
                  </span>
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
