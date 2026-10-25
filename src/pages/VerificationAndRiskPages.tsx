import React, { useState, useMemo } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Search,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Edit3,
  MessageSquarePlus,
  ExternalLink,
  HelpCircle,
  Scale,
  FileWarning,
  Layers,
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
import { ClaimAnalystStatus, RiskAnalystStatus } from '../types';

/**
 * 7. VERIFICATION CENTER (/app/project/:projectId/verification)
 */
export const VerificationPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, activeProject, bulkUpdateClaims, openSourceDrawer } = useAppStore();
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === projectId) || activeProject;
  const pid = project.id;

  const statusFilter = searchParams.get('status') || 'All';
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'numeric' | 'qualitative'>('All');
  const [periodFilter, setPeriodFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'id' | 'status' | 'completeness'>('id');
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(true);
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);
  const [bulkNote, setBulkNote] = useState<string>('');

  const counts = useMemo(() => {
    const verified = project.claims.filter((c) => c.status === 'Verified').length;
    const partial = project.claims.filter((c) => c.status === 'Partially Supported').length;
    const contradicted = project.claims.filter((c) => c.status === 'Contradicted').length;
    const unsupported = project.claims.filter((c) => c.status === 'Unsupported').length;
    const coveragePct =
      project.claims.length > 0
        ? (((verified + partial) / project.claims.length) * 100).toFixed(1)
        : '0.0';
    return {
      verified,
      partial,
      contradicted,
      unsupported,
      flagged: contradicted + unsupported,
      coveragePct,
    };
  }, [project.claims]);

  const filteredClaims = useMemo(() => {
    return project.claims
      .filter((c) => {
        if (statusFilter !== 'All' && c.status !== statusFilter) return false;
        if (sourceFilter !== 'All' && c.originSourceId !== sourceFilter) return false;
        if (typeFilter !== 'All' && (c.claimType || 'numeric') !== typeFilter) return false;
        if (periodFilter !== 'All' && (c.period || 'FY2024') !== periodFilter) return false;
        if (
          searchQuery.trim() &&
          !`${c.id} ${c.statement} ${c.confidenceNote}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'status') return a.status.localeCompare(b.status);
        if (sortBy === 'completeness')
          return (b.evidenceCompleteness ?? 80) - (a.evidenceCompleteness ?? 80);
        return a.id.localeCompare(b.id);
      });
  }, [project.claims, statusFilter, sourceFilter, typeFilter, periodFilter, searchQuery, sortBy]);

  const toggleSelectClaim = (id: string) => {
    setSelectedClaimIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo={`/app/project/${pid}`}
        items={[
          { label: 'Projects', to: '/app/dashboard' },
          { label: project.ticker, to: `/app/project/${pid}` },
          { label: 'Verification Center (C1–C9)' },
        ]}
      />

      {/* Expandable "How verification works" Panel */}
      <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] p-6 border border-[#8A6BC2] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SyntheticOriginTag origin={project.dataOrigin} />
              <span className="px-3 py-1 rounded-full bg-[#D4FF3F] text-[#2A1F45] font-mono text-xs font-bold">
                ±0.1% Numeric Tolerance Engine
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#F3EBFA]">
              Cross-Source Evidence Verification Center
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8A6BC2]/30 hover:bg-[#8A6BC2]/50 text-[#D4FF3F] text-xs font-bold border-[1.5px] border-[#CBB3E8] cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>How verification works</span>
            {showHowItWorks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showHowItWorks && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-3 border-t border-[#8A6BC2]/50 text-xs">
            <div className="rounded-xl bg-[#D4FF3F] text-[#2A1F45] p-3.5 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Numeric value is within <strong>0.1%</strong> of deterministic recalculation AND
                supported by a primary source passage with matching period.
              </p>
            </div>

            <div className="rounded-xl bg-[#E9DDF6] text-[#2A1F45] p-3.5 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#8A6BC2]" />
                <span>Partially Supported</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Directionally supported, or missing a sub-period (e.g., Q4 OCF null), or from a
                stale source (&gt; 12 months before period end), or qualitative without full numeric
                backing.
              </p>
            </div>

            <div className="rounded-xl bg-[#E34234] text-[#F3EBFA] p-3.5 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>Contradicted</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Another primary source or a deterministic recalculation disagrees beyond the 0.1%
                tolerance threshold (e.g., S2 $552.0M vs S1 $540.0M).
              </p>
            </div>

            <div className="rounded-xl bg-[#8A6BC2]/40 text-[#F3EBFA] border border-[#B9A0DA] p-3.5 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <FileWarning className="w-4 h-4 text-[#D4FF3F]" />
                <span>Unsupported</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                No passage in any verified source supports the claim (e.g., undated S6 claim of 2x
                market share).
              </p>
            </div>

            <div className="rounded-xl bg-[#EAF7A8] text-[#2A1F45] p-3.5 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Exclusion Rule</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Non-Verified claims are strictly excluded from verified executive conclusions and
                hold the dossier at <strong>Needs Review</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Strip (Clickable Status Filters + Coverage % + Flagged Count) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'All Claims', status: 'All', count: project.claims.length },
          { label: 'Verified', status: 'Verified', count: counts.verified },
          { label: 'Partially Supported', status: 'Partially Supported', count: counts.partial },
          { label: 'Contradicted', status: 'Contradicted', count: counts.contradicted },
          { label: 'Unsupported', status: 'Unsupported', count: counts.unsupported },
        ].map((item) => {
          const active = statusFilter === item.status;
          return (
            <button
              key={item.status}
              type="button"
              onClick={() =>
                setSearchParams(item.status === 'All' ? {} : { status: item.status })
              }
              className={`rounded-2xl p-4 text-left border-2 transition-all cursor-pointer ${
                active
                  ? 'bg-[#D4FF3F] text-[#2A1F45] border-[#2A1F45] shadow-sm'
                  : 'bg-[#F3EBFA] hover:bg-[#E9DDF6] text-[#2A1F45] border-[#B9A0DA]'
              }`}
            >
              <div className="text-[11px] font-mono uppercase text-[#6B5B86]">{item.label}</div>
              <div className="font-mono text-2xl font-bold mt-1 tabular-nums">{item.count}</div>
            </button>
          );
        })}

        <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] p-4 border border-[#8A6BC2]">
          <div className="text-[11px] font-mono uppercase text-[#CBB3E8]">
            Evidence Coverage
          </div>
          <div className="font-mono text-2xl font-bold text-[#D4FF3F] mt-1 tabular-nums">
            {counts.coveragePct}%
          </div>
          <div className="text-[10px] text-[#CBB3E8] mt-0.5">
            {counts.flagged} Flagged (Contradicted/Unsupported)
          </div>
        </div>
      </div>

      {/* Side-by-Side Conflict Comparison Card: C2 vs C1 */}
      <div className="rounded-2xl bg-[#F3EBFA] border-2 border-[#E34234] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#E34234]" />
            <h2 className="font-display text-xl font-bold text-[#2A1F45]">
              Side-by-Side Conflict Comparison: Claim C2 vs Claim C1 (FY2024 Revenue)
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#E34234] text-[#F3EBFA] font-mono text-xs font-bold">
            Discrepancy: +$12.0M / +2.2% (Exceeds 0.1% Tolerance)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Audited S1 */}
          <div className="rounded-2xl bg-[#E9DDF6] border-2 border-[#2A1F45] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <ClaimChip claimId="C1" projectId={pid} showStatement={false} />
              <StatusBadge status="Verified" size="sm" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#2A1F45] tabular-nums">
              $540.0M (S1 p.31)
            </div>
            <p className="text-xs text-[#2A1F45]">
              Audited Form 10-K statement of operations. Confirmed by deterministic YoY growth of
              +15.4% vs FY2023 ($468.0M).
            </p>
            <div className="pt-1 flex items-center justify-between">
              <SourceChip sourceId="S1" projectId={pid} pageNumber={31} highlightPassageId="S1-P1" />
              <Link
                to={`/app/project/${pid}/sources/S1?page=31&highlight=S1-P1`}
                className="text-xs font-bold text-[#2A1F45] underline"
              >
                Open S1 p.31
              </Link>
            </div>
          </div>

          {/* Preliminary S2 */}
          <div className="rounded-2xl bg-[#E9DDF6] border-2 border-[#E34234] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <ClaimChip claimId="C2" projectId={pid} showStatement={false} />
              <StatusBadge status="Contradicted" size="sm" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#B8301F] tabular-nums">
              $552.0M (S2 p.1–2)
            </div>
            <p className="text-xs text-[#2A1F45]">
              Unaudited Q4 earnings release. Overstated revenue by <strong>$12.0M (2.2%)</strong>{' '}
              due to unshipped bill-and-hold orders reversed in audit.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <SourceChip sourceId="S2" projectId={pid} pageNumber={1} highlightPassageId="S2-P1" />
              <Link
                to={`/app/project/${pid}/sources/S2?page=1&highlight=S2-P1`}
                className="text-xs font-bold text-[#B8301F] underline"
              >
                Open S2 p.1
              </Link>
            </div>
          </div>

          {/* Deterministic 4-Quarter Sum */}
          <div className="rounded-2xl bg-[#EAF7A8] border-2 border-[#2A1F45] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold">
                Deterministic 4Q Sum
              </span>
              <StatusBadge status="Verified" size="sm" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#2A1F45] tabular-nums">
              $540.0M Exact
            </div>
            <p className="text-xs text-[#2A1F45] font-mono">
              Q1 ($120.0M) + Q2 ($128.0M) + Q3 ($137.0M) + Q4 ($155.0M) = $540.0M.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <SourceChip sourceId="S4" projectId={pid} pageNumber={12} highlightPassageId="S4-P1" />
              <Link
                to={`/app/project/${pid}/verification/claim/C2`}
                className="text-xs font-bold text-[#2A1F45] underline"
              >
                Inspect C2 Proof →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search / Sort Bar & Claim Table */}
      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B5B86] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search claim ID or text..."
                className="pl-8 pr-3 py-1.5 rounded-full bg-[#E9DDF6] text-[#2A1F45] placeholder-[#6B5B86] text-xs border border-[#B9A0DA]"
              />
            </div>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-full bg-[#E9DDF6] text-[#2A1F45] px-3 py-1.5 text-xs font-semibold border border-[#B9A0DA]"
            >
              <option value="All">All Sources (S1–S7)</option>
              {project.sources.map((s) => (
                <option key={s.id} value={s.id}>
                  Source {s.id}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as 'All' | 'numeric' | 'qualitative')
              }
              className="rounded-full bg-[#E9DDF6] text-[#2A1F45] px-3 py-1.5 text-xs font-semibold border border-[#B9A0DA]"
            >
              <option value="All">All Claim Types</option>
              <option value="numeric">Numeric Claims</option>
              <option value="qualitative">Qualitative Claims</option>
            </select>

            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="rounded-full bg-[#E9DDF6] text-[#2A1F45] px-3 py-1.5 text-xs font-semibold border border-[#B9A0DA]"
            >
              <option value="All">All Periods</option>
              <option value="FY2024">FY2024</option>
              <option value="Q4 FY2024">Q4 FY2024</option>
              <option value="FY2025 (Forward)">FY2025 (Forward)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#6B5B86]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'id' | 'status' | 'completeness')}
              className="rounded-full bg-[#E9DDF6] text-[#2A1F45] px-3 py-1.5 text-xs font-semibold border border-[#B9A0DA]"
            >
              <option value="id">Claim ID (C1–C9)</option>
              <option value="status">Verification Status</option>
              <option value="completeness">Evidence Completeness</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedClaimIds.length > 0 && (
          <div className="rounded-xl bg-[#2A1F45] text-[#F3EBFA] p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-mono">
              Selected <strong>{selectedClaimIds.length}</strong> claim(s):{' '}
              {selectedClaimIds.join(', ')}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={bulkNote}
                onChange={(e) => setBulkNote(e.target.value)}
                placeholder="Bulk review note..."
                className="rounded-full bg-[#F3EBFA] text-[#2A1F45] px-3 py-1 text-xs"
              />
              {(['Accepted', 'Corrected', 'Dismissed', 'Open'] as ClaimAnalystStatus[]).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      bulkUpdateClaims(pid, selectedClaimIds, st, bulkNote);
                      setSelectedClaimIds([]);
                      setBulkNote('');
                    }}
                    className="px-3 py-1 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold cursor-pointer"
                  >
                    Mark {st}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Claim Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#B9A0DA] font-mono text-[11px] uppercase text-[#6B5B86]">
                <th className="py-3 px-2">Sel</th>
                <th className="py-3 px-2">ID</th>
                <th className="py-3 px-3">Claim Statement</th>
                <th className="py-3 px-2">Type</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Claimed vs Recalculated</th>
                <th className="py-3 px-2">Source</th>
                <th
                  className="py-3 px-2"
                  title="Evidence Completeness = % of verification checks (source exists, fresh date, matching period, 0.1% numeric match, no contradiction) satisfied."
                >
                  Completeness ⓘ
                </th>
                <th className="py-3 px-2">Analyst Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9A0DA]/60">
              {filteredClaims.map((claim) => {
                const src = project.sources.find((s) => s.id === claim.originSourceId);
                const pageNum = src?.pages[0]?.pageNumber || 1;
                return (
                  <tr
                    key={claim.id}
                    onClick={() => navigate(`/app/project/${pid}/verification/claim/${claim.id}`)}
                    className="hover:bg-[#E9DDF6] cursor-pointer transition-colors"
                  >
                    <td
                      className="py-3 px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedClaimIds.includes(claim.id)}
                        onChange={() => toggleSelectClaim(claim.id)}
                        className="accent-[#2A1F45] cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-[#2A1F45]">{claim.id}</td>
                    <td className="py-3 px-3 font-semibold text-[#2A1F45]">
                      <div>{claim.statement}</div>
                      {claim.correctedValue && (
                        <div className="text-[11px] font-mono text-[#8A6BC2] mt-0.5">
                          Analyst-Corrected → {claim.correctedValue} ({claim.correctionJustification})
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 font-mono text-[#6B5B86] capitalize">
                      {claim.claimType || 'numeric'}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={claim.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 font-mono text-[#2A1F45]">
                      <div>Claimed: {claim.verification.reportedValue}</div>
                      <div className="text-[#8A6BC2] font-bold">
                        Recalc: {claim.verification.recalculatedValue || 'None (Unsupported)'}
                      </div>
                    </td>
                    <td
                      className="py-3 px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SourceChip
                        sourceId={claim.originSourceId}
                        projectId={pid}
                        pageNumber={pageNum}
                        highlightPassageId={claim.originPassageId}
                      />
                    </td>
                    <td
                      className="py-3 px-2 font-mono font-bold text-[#2A1F45]"
                      title="Percentage of 5 deterministic verification checks passed for this claim."
                    >
                      {claim.evidenceCompleteness ?? 80}%
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E9DDF6] border border-[#2A1F45] font-mono text-[11px] font-bold text-[#2A1F45]">
                        {claim.analystStatus || 'Open'}
                      </span>
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
 * 8. CLAIM DETAIL (/app/project/:projectId/verification/claim/:claimId)
 */
export const ClaimDetailPage: React.FC = () => {
  const { projectId, claimId } = useParams<{ projectId: string; claimId: string }>();
  const {
    projects,
    activeProject,
    performClaimAnalystAction,
  } = useAppStore();

  const project = projects.find((p) => p.id === projectId) || activeProject;
  const pid = project.id;

  const idx = project.claims.findIndex((c) => c.id === claimId);
  const claim = idx >= 0 ? project.claims[idx] : project.claims[0];
  const prevClaim = idx > 0 ? project.claims[idx - 1] : null;
  const nextClaim =
    idx >= 0 && idx < project.claims.length - 1 ? project.claims[idx + 1] : null;

  const producingAgent =
    project.agents.find((a) => a.id === claim.producingAgentId) || project.agents[2];

  const [correctedValue, setCorrectedValue] = useState(
    claim.correctedValue || claim.verification.recalculatedValue || '$540.0M'
  );
  const [justification, setJustification] = useState(
    claim.correctionJustification ||
      'Replaced preliminary S2 figure with audited S1 p.31 figure ($540.0M).'
  );
  const [dismissReason, setDismissReason] = useState(claim.dismissReason || '');
  const [annotationInput, setAnnotationInput] = useState('');
  const [feedbackComment, setFeedbackComment] = useState(claim.feedbackComment || '');

  // Helper to resolve passage details from sourceId & passageId
  const resolvePassage = (sourceId: string, passageId: string) => {
    const src = project.sources.find((s) => s.id === sourceId);
    if (!src) return null;
    for (const pg of src.pages) {
      const ps = pg.passages.find((p) => p.id === passageId);
      if (ps) return { source: src, pageNumber: pg.pageNumber, passage: ps };
    }
    return {
      source: src,
      pageNumber: src.pages[0]?.pageNumber || 1,
      passage: src.pages[0]?.passages[0],
    };
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo={`/app/project/${pid}/verification`}
        items={[
          { label: 'Projects', to: '/app/dashboard' },
          { label: project.ticker, to: `/app/project/${pid}` },
          { label: 'Verification Center', to: `/app/project/${pid}/verification` },
          { label: `${claim.id}: ${claim.statement}` },
        ]}
      />

      {/* Claim Header */}
      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold">
                Claim {claim.id} · {claim.claimType || 'numeric'}
              </span>
              <StatusBadge status={claim.status} />
              <span className="px-3 py-1 rounded-full bg-[#E9DDF6] border border-[#2A1F45] font-mono text-xs font-bold text-[#2A1F45]">
                Analyst Status: {claim.analystStatus || 'Open'}
              </span>
              <Link
                to={`/app/project/${pid}/pipeline/agent/${producingAgent.id}`}
                className="px-3 py-1 rounded-full bg-[#E9DDF6] hover:bg-[#D4FF3F] text-[#2A1F45] font-mono text-xs font-bold border border-[#B9A0DA]"
              >
                Agent: {producingAgent.name}
              </Link>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#2A1F45]">
              "{claim.statement}"
            </h1>
            <p className="text-sm text-[#6B5B86]">
              <strong>Plain-English Why:</strong> {claim.confidenceNote}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {prevClaim && (
              <Link
                to={`/app/project/${pid}/verification/claim/${prevClaim.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#E9DDF6] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev ({prevClaim.id})</span>
              </Link>
            )}
            {nextClaim && (
              <Link
                to={`/app/project/${pid}/verification/claim/${nextClaim.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#E9DDF6] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45]"
              >
                <span>Next ({nextClaim.id})</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Calculation Panel & 5-Point Checks List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calculation Panel */}
          <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] p-5 space-y-3 border border-[#8A6BC2]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#D4FF3F]">
                Deterministic Calculation & Tolerance Check
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#8A6BC2] text-[#F3EBFA] font-mono text-xs">
                Tolerance: ±{claim.tolerancePercent ?? 0.1}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="rounded-xl bg-[#8A6BC2]/25 p-3">
                <div className="text-[#CBB3E8]">Claimed / Reported Value</div>
                <div className="text-lg font-bold text-[#F3EBFA] mt-0.5">
                  {claim.verification.reportedValue}
                </div>
              </div>
              <div className="rounded-xl bg-[#8A6BC2]/25 p-3">
                <div className="text-[#CBB3E8]">Recalculated / Extracted</div>
                <div className="text-lg font-bold text-[#D4FF3F] mt-0.5">
                  {claim.verification.recalculatedValue || 'No Numeric Support'}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#8A6BC2]/20 p-3 font-mono text-xs text-[#F3EBFA]">
              <div className="text-[#CBB3E8] text-[11px] uppercase mb-1">Formula / Proof</div>
              {claim.verification.deterministicCheck}
            </div>

            {claim.verification.discrepancyNote && (
              <div className="rounded-xl bg-[#E34234] text-[#F3EBFA] p-3 text-xs">
                <strong>Discrepancy Alert:</strong> {claim.verification.discrepancyNote}
              </div>
            )}
          </div>

          {/* 5-Point Verification Checks List */}
          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">
              5-Point Provenance & Hygiene Checks
            </h2>
            <div className="space-y-2">
              {(claim.checks || []).map((chk) => (
                <div
                  key={chk.id}
                  className="rounded-xl bg-[#F3EBFA] border border-[#B9A0DA] p-3 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2">
                    {chk.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#2A1F45] shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#E34234] shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-[#2A1F45]">{chk.label}</div>
                      <div className="text-[#6B5B86]">{chk.detail}</div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shrink-0 ${
                      chk.passed
                        ? 'bg-[#D4FF3F] text-[#2A1F45]'
                        : 'bg-[#E34234] text-[#F3EBFA]'
                    }`}
                  >
                    {chk.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Supporting & Contradicting Passages with "Open in document viewer" */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supporting Passages */}
          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">
              Supporting Evidence Passages ({claim.verification.supportingPassageIds.length})
            </h2>
            {claim.verification.supportingPassageIds.length === 0 ? (
              <div className="rounded-xl bg-[#F3EBFA] border border-[#B9A0DA] p-4 text-xs text-[#6B5B86]">
                Zero supporting passages found in primary sources (Claim is Unsupported).
              </div>
            ) : (
              claim.verification.supportingPassageIds.map((pid2, idx2) => {
                const sid =
                  claim.verification.supportingSourceIds[idx2] ||
                  claim.verification.supportingSourceIds[0] ||
                  claim.originSourceId;
                const resolved = resolvePassage(sid, pid2);
                return (
                  <div
                    key={pid2}
                    className="rounded-xl bg-[#F3EBFA] border border-[#B9A0DA] p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <SourceChip
                        sourceId={sid}
                        projectId={pid}
                        pageNumber={resolved?.pageNumber}
                        highlightPassageId={pid2}
                      />
                      <Link
                        to={`/app/project/${pid}/sources/${sid}?page=${
                          resolved?.pageNumber || 1
                        }&highlight=${pid2}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border border-[#2A1F45]"
                      >
                        <span>Open in document viewer</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-xs text-[#2A1F45] italic font-serif leading-relaxed">
                      "{resolved?.passage?.text}"
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Contradicting Passages */}
          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">
              Contradicting Evidence Passages ({claim.verification.contradictingPassageIds.length})
            </h2>
            {claim.verification.contradictingPassageIds.length === 0 ? (
              <div className="rounded-xl bg-[#F3EBFA] border border-[#B9A0DA] p-4 text-xs text-[#6B5B86]">
                No contradicting passages detected across S1–S7.
              </div>
            ) : (
              claim.verification.contradictingPassageIds.map((pid2, idx2) => {
                const sid =
                  claim.verification.contradictingSourceIds[idx2] ||
                  claim.verification.contradictingSourceIds[0] ||
                  'S1';
                const resolved = resolvePassage(sid, pid2);
                return (
                  <div
                    key={pid2}
                    className="rounded-xl bg-[#F3EBFA] border-2 border-[#E34234] p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <SourceChip
                        sourceId={sid}
                        projectId={pid}
                        pageNumber={resolved?.pageNumber}
                        highlightPassageId={pid2}
                      />
                      <Link
                        to={`/app/project/${pid}/sources/${sid}?page=${
                          resolved?.pageNumber || 1
                        }&highlight=${pid2}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-bold"
                      >
                        <span>Open in document viewer</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-xs text-[#2A1F45] italic font-serif leading-relaxed">
                      "{resolved?.passage?.text}"
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Analyst Controls Panel */}
        <div className="rounded-2xl bg-[#E9DDF6] border-2 border-[#2A1F45] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-[#2A1F45]">
                Human-in-the-Loop Analyst Controls
              </h2>
              <p className="text-xs text-[#6B5B86]">
                Every action creates an immutable <code className="font-mono">ReviewEvent</code> and
                updates the Report, Ratios, and Audit Log.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  performClaimAnalystAction(pid, claim.id, {
                    type: 'accept_flag',
                    justification: 'Accepted verification status after inspecting primary filing.',
                  })
                }
                className="px-4 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45] cursor-pointer"
              >
                Accept flag
              </button>
              <button
                type="button"
                onClick={() => performClaimAnalystAction(pid, claim.id, { type: 'reverify' })}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#F3EBFA] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Request re-verification</span>
              </button>
            </div>
          </div>

          {/* Mark Corrected Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[#B9A0DA]">
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#6B5B86] mb-1">
                Corrected Value
              </label>
              <input
                type="text"
                value={correctedValue}
                onChange={(e) => setCorrectedValue(e.target.value)}
                className="w-full rounded-xl bg-[#F3EBFA] text-[#2A1F45] px-3.5 py-2 text-xs font-mono border border-[#B9A0DA]"
              />
            </div>
            <div className="md:col-span-2 flex flex-col justify-between">
              <label className="block text-[11px] font-mono uppercase text-[#6B5B86] mb-1">
                Correction Justification (Propagates to Report & Ratios as "analyst-corrected")
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="flex-1 rounded-xl bg-[#F3EBFA] text-[#2A1F45] px-3.5 py-2 text-xs border border-[#B9A0DA]"
                />
                <button
                  type="button"
                  onClick={() =>
                    performClaimAnalystAction(pid, claim.id, {
                      type: 'mark_corrected',
                      correctedValue,
                      justification,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2A1F45] text-[#D4FF3F] text-xs font-bold cursor-pointer shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Mark corrected</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dismiss with Reason & Add Annotation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#B9A0DA]">
            <div className="flex gap-2">
              <input
                type="text"
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="Reason for dismissing claim..."
                className="flex-1 rounded-full bg-[#F3EBFA] text-[#2A1F45] px-3.5 py-2 text-xs border border-[#B9A0DA]"
              />
              <button
                type="button"
                onClick={() =>
                  performClaimAnalystAction(pid, claim.id, {
                    type: 'dismiss',
                    dismissReason: dismissReason || 'Dismissed by analyst.',
                  })
                }
                className="px-4 py-2 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-bold cursor-pointer shrink-0"
              >
                Dismiss with reason
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={annotationInput}
                onChange={(e) => setAnnotationInput(e.target.value)}
                placeholder="Add timestamped annotation..."
                className="flex-1 rounded-full bg-[#F3EBFA] text-[#2A1F45] px-3.5 py-2 text-xs border border-[#B9A0DA]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!annotationInput.trim()) return;
                  performClaimAnalystAction(pid, claim.id, {
                    type: 'annotate',
                    annotation: annotationInput,
                  });
                  setAnnotationInput('');
                }}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#F3EBFA] text-[#2A1F45] text-xs font-bold border border-[#2A1F45] cursor-pointer shrink-0"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Add annotation</span>
              </button>
            </div>
          </div>

          {/* Give Feedback (Thumbs + Comment) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#B9A0DA]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#2A1F45]">Give Verification Feedback:</span>
              <button
                type="button"
                onClick={() =>
                  performClaimAnalystAction(pid, claim.id, {
                    type: 'feedback',
                    feedbackThumb: 'up',
                    feedbackComment,
                  })
                }
                className={`p-2 rounded-full border cursor-pointer ${
                  claim.feedbackThumb === 'up'
                    ? 'bg-[#D4FF3F] text-[#2A1F45] border-[#2A1F45]'
                    : 'bg-[#F3EBFA] text-[#2A1F45] border-[#B9A0DA]'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  performClaimAnalystAction(pid, claim.id, {
                    type: 'feedback',
                    feedbackThumb: 'down',
                    feedbackComment,
                  })
                }
                className={`p-2 rounded-full border cursor-pointer ${
                  claim.feedbackThumb === 'down'
                    ? 'bg-[#E34234] text-[#F3EBFA] border-[#2A1F45]'
                    : 'bg-[#F3EBFA] text-[#2A1F45] border-[#B9A0DA]'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-1 max-w-md gap-2">
              <input
                type="text"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Optional feedback comment on agent verification..."
                className="flex-1 rounded-full bg-[#F3EBFA] text-[#2A1F45] px-3.5 py-1.5 text-xs border border-[#B9A0DA]"
              />
              <button
                type="button"
                onClick={() =>
                  performClaimAnalystAction(pid, claim.id, {
                    type: 'feedback',
                    feedbackThumb: claim.feedbackThumb || 'up',
                    feedbackComment,
                  })
                }
                className="px-4 py-1.5 rounded-full bg-[#2A1F45] text-[#D4FF3F] text-xs font-bold cursor-pointer"
              >
                Save Feedback
              </button>
            </div>
          </div>

          {(claim.annotations || []).length > 0 && (
            <div className="space-y-1.5 pt-2">
              {(claim.annotations || []).map((ann, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-[#F3EBFA] border border-[#B9A0DA] px-3 py-2 text-xs font-mono text-[#2A1F45]"
                >
                  {ann}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Metrics, Ratios & Risks */}
        <div className="pt-3 border-t border-[#B9A0DA] space-y-2">
          <h3 className="font-display text-base font-bold text-[#2A1F45]">
            Related Metrics, Ratios & Risks
          </h3>
          <div className="flex flex-wrap gap-2">
            {claim.relatedMetricIds.map((mid) => (
              <MetricChip key={mid} metricId={mid} projectId={pid} />
            ))}
            {claim.relatedRatioIds.map((rid) => (
              <MetricChip key={rid} ratioId={rid} projectId={pid} />
            ))}
            {claim.relatedRiskIds.map((rkid) => (
              <RiskChip key={rkid} riskId={rkid} projectId={pid} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 9. RISK & UNCERTAINTY CENTER (/app/project/:projectId/risks)
 */
export const RisksPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, activeProject, toggleNistControl, openSourceDrawer } = useAppStore();
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === projectId) || activeProject;
  const pid = project.id;

  const [activeTab, setActiveTab] = useState<
    'evidence' | 'hypotheses' | 'data_quality' | 'limitations'
  >('evidence');

  const verifiedOrPartialCount = project.claims.filter(
    (c) => c.status === 'Verified' || c.status === 'Partially Supported'
  ).length;
  const totalClaimsCount = project.claims.length;
  const evidenceCompletenessPct = (
    (verifiedOrPartialCount / Math.max(1, totalClaimsCount)) *
    100
  ).toFixed(1);

  const filteredRisks = useMemo(() => {
    if (activeTab === 'evidence') {
      return project.risks.filter((r) => r.riskType !== 'Hypothesis');
    }
    if (activeTab === 'hypotheses') {
      return project.risks.filter((r) => r.riskType === 'Hypothesis' || r.convertedFromHypothesis);
    }
    if (activeTab === 'data_quality') {
      return project.risks.filter(
        (r) =>
          r.businessCategory === 'Data Quality' ||
          r.riskType === 'Contradiction' ||
          r.riskType === 'Source Quality'
      );
    }
    return project.risks;
  }, [project.risks, activeTab]);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo={`/app/project/${pid}`}
        items={[
          { label: 'Projects', to: '/app/dashboard' },
          { label: project.ticker, to: `/app/project/${pid}` },
          { label: 'Risk & Uncertainty Center' },
        ]}
      />

      {/* Header & Evidence Completeness Formula Banner */}
      <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] p-6 border border-[#8A6BC2] space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <SyntheticOriginTag origin={project.dataOrigin} />
              <span className="px-3 py-1 rounded-full bg-[#E34234] text-[#F3EBFA] font-mono text-xs font-bold">
                Hypotheses Strictly Separated from Evidence
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#F3EBFA]">
              Risk, Uncertainty & Governance Center
            </h1>
          </div>

          {/* Evidence Completeness Formula Card */}
          <div className="rounded-2xl bg-[#8A6BC2]/30 border border-[#CBB3E8] p-4 max-w-md space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-[#D4FF3F] font-bold">
                Evidence Completeness Indicator
              </span>
              <span className="font-mono text-xl font-bold text-[#D4FF3F]">
                {evidenceCompletenessPct}% ({verifiedOrPartialCount}/{totalClaimsCount})
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#F3EBFA]">
              Formula: (Claims with Verified or Partially Supported evidence ÷ Total Claims)
            </div>
            <p className="text-[11px] text-[#CBB3E8]">
              <strong>Governance Note:</strong> This measures source coverage completeness — it is{' '}
              <u>not</u> a statistical probability of correctness.
            </p>
          </div>
        </div>

        {/* 4 Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#8A6BC2]/50">
          {[
            { id: 'evidence', label: 'Evidence-backed Risks' },
            { id: 'hypotheses', label: 'Hypotheses (need investigation)' },
            { id: 'data_quality', label: 'Data Quality' },
            { id: 'limitations', label: 'Limitations & Open Questions' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(
                  tab.id as 'evidence' | 'hypotheses' | 'data_quality' | 'limitations'
                )
              }
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#D4FF3F] text-[#2A1F45]'
                  : 'bg-[#8A6BC2]/30 text-[#F3EBFA] hover:bg-[#8A6BC2]/50 border border-[#CBB3E8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRisks.map((risk) => {
          const isHypothesis = risk.riskType === 'Hypothesis';
          return (
            <div
              key={risk.id}
              onClick={() => navigate(`/app/project/${pid}/risks/${risk.id}`)}
              className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                isHypothesis
                  ? 'bg-[#EAF7A8] border-[#2A1F45]'
                  : risk.severity === 'High'
                  ? 'bg-[#F3EBFA] border-[#E34234]'
                  : 'bg-[#F3EBFA] border-[#B9A0DA] hover:border-[#2A1F45]'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold">
                      {risk.id}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${
                        risk.severity === 'High'
                          ? 'bg-[#E34234] text-[#F3EBFA]'
                          : 'bg-[#E9DDF6] text-[#2A1F45] border border-[#2A1F45]'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>{risk.severity} Severity</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E9DDF6] text-[#2A1F45] font-mono text-[11px] font-bold border border-[#B9A0DA]">
                      {risk.businessCategory || 'Business'}
                    </span>
                  </div>
                  <StatusBadge status={risk.status} size="sm" />
                </div>

                {isHypothesis && (
                  <div className="px-3 py-1.5 rounded-xl bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#E34234]" />
                    <span>HYPOTHESIS — not supported by evidence yet</span>
                  </div>
                )}

                <h2 className="font-display text-lg font-bold text-[#2A1F45]">{risk.title}</h2>
                <p className="text-xs text-[#2A1F45] leading-relaxed">{risk.summary}</p>
              </div>

              <div className="pt-3 border-t border-[#B9A0DA] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="font-mono text-[#6B5B86]">
                  Evidence Count: <strong>{risk.sourceIds.length} source(s)</strong> · Analyst
                  Status: <strong>{risk.analystStatus || 'Open'}</strong>
                </div>
                <span className="inline-flex items-center gap-1 font-bold text-[#2A1F45]">
                  <span>Inspect Risk</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Matrix of Severity × Evidence Strength */}
      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-[#2A1F45]">
              Severity × Evidence Strength Matrix
            </h2>
            <p className="text-xs text-[#6B5B86]">
              <strong>Definition:</strong> Cross-tabulates potential financial/operational impact
              (Severity) against the verifiability of underlying source passages (Evidence
              Strength).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#B9A0DA] font-mono text-[11px] uppercase text-[#6B5B86]">
                <th className="py-3 px-3">Severity \ Evidence</th>
                <th className="py-3 px-3">Strong (Audited Filing / Math Proof)</th>
                <th className="py-3 px-3">Moderate (Stale / Partial Schedule)</th>
                <th className="py-3 px-3">Weak / Hypothesis (Needs Investigation)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9A0DA]/60">
              {(['High', 'Medium', 'Low'] as const).map((sev) => (
                <tr key={sev}>
                  <td className="py-4 px-3 font-mono font-bold text-[#2A1F45]">{sev} Severity</td>
                  {(['Strong', 'Moderate', 'Weak / Hypothesis'] as const).map((str) => {
                    const matches = project.risks.filter(
                      (r) =>
                        r.severity === sev &&
                        (r.evidenceStrength ||
                          (r.riskType === 'Hypothesis' ? 'Weak / Hypothesis' : 'Strong')) === str
                    );
                    return (
                      <td key={str} className="py-4 px-3 bg-[#E9DDF6]/50">
                        <div className="flex flex-wrap gap-1.5">
                          {matches.length === 0 ? (
                            <span className="text-[#6B5B86] font-mono">—</span>
                          ) : (
                            matches.map((m) => (
                              <RiskChip key={m.id} riskId={m.id} projectId={pid} />
                            ))
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stale/Missing Source Panel & Contradictions Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#2A1F45]">
            Stale, Undated & Missing Disclosure Panel
          </h2>
          <div className="space-y-2.5 text-xs">
            <div
              onClick={() => openSourceDrawer('S5', pid, 19, 'S5-P1')}
              className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3.5 flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-bold text-[#2A1F45]">
                  S5: Global Industrial Automation Market Report (Mar 2023)
                </div>
                <div className="text-[#6B5B86]">
                  21.5 months older than FY2024 period end (&gt;12m staleness threshold).
                </div>
              </div>
              <StatusBadge status="Stale" size="sm" />
            </div>

            <div
              onClick={() => openSourceDrawer('S6', pid, 1, 'S6-P1')}
              className="rounded-xl bg-[#E9DDF6] border border-[#E34234] p-3.5 flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-bold text-[#2A1F45]">
                  S6: External Sell-Side Analyst Note (Undated)
                </div>
                <div className="text-[#6B5B86]">
                  Missing publication date metadata; claim C5 marked Unsupported.
                </div>
              </div>
              <StatusBadge status="Unsupported" size="sm" />
            </div>

            <div
              onClick={() => navigate(`/app/project/${pid}/analysis/metric/M-OCF-Q4`)}
              className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3.5 flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-bold text-[#2A1F45]">
                  Missing Q4 FY2024 Operating Cash Flow Schedule
                </div>
                <div className="text-[#6B5B86]">
                  Explicitly null in S1 & S2; Claim C7 marked Partially Supported.
                </div>
              </div>
              <StatusBadge status="Partially Supported" size="sm" />
            </div>
          </div>
        </div>

        {/* Contradictions Panel & NIST Mitigation Checklist */}
        <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">
              NIST AI RMF Mitigation Checklist
            </h2>
            <Link
              to={`/app/project/${pid}/verification`}
              className="text-xs font-bold text-[#8A6BC2] underline"
            >
              Open C1 vs C2 Conflict Comparison →
            </Link>
          </div>

          <div className="space-y-2.5">
            {(project.nistChecklist || []).map((item) => (
              <label
                key={item.id}
                className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3.5 flex items-start gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleNistControl(pid, item.id)}
                  className="accent-[#2A1F45] mt-1 w-4 h-4 cursor-pointer"
                />
                <div className="space-y-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-[#8A6BC2]">{item.controlCode}</span>
                    <span className="font-bold text-[#2A1F45]">{item.title}</span>
                  </div>
                  <p className="text-[#6B5B86]">{item.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 10. RISK DETAIL (/app/project/:projectId/risks/:riskId)
 */
export const RiskDetailPage: React.FC = () => {
  const { projectId, riskId } = useParams<{ projectId: string; riskId: string }>();
  const {
    projects,
    activeProject,
    updateRiskAnalystDetail,
    convertHypothesisToEvidence,
    auditEntries,
  } = useAppStore();

  const project = projects.find((p) => p.id === projectId) || activeProject;
  const pid = project.id;

  const idx = project.risks.findIndex((r) => r.id === riskId);
  const risk = idx >= 0 ? project.risks[idx] : project.risks[0];
  const prevRisk = idx > 0 ? project.risks[idx - 1] : null;
  const nextRisk =
    idx >= 0 && idx < project.risks.length - 1 ? project.risks[idx + 1] : null;

  const [analystStatus, setAnalystStatus] = useState<RiskAnalystStatus>(
    risk.analystStatus || 'Open'
  );
  const [analystNotes, setAnalystNotes] = useState<string>(risk.analystNotes || '');
  const [attachSourceId, setAttachSourceId] = useState<string>('S1');
  const [conversionRationale, setConversionRationale] = useState<string>(
    'Confirmed fixed-price rare-earth procurement exposure against S1 p.47 and S4 p.14.'
  );

  const riskAudits = auditEntries.filter((a) => a.targetId === risk.id);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo={`/app/project/${pid}/risks`}
        items={[
          { label: 'Projects', to: '/app/dashboard' },
          { label: project.ticker, to: `/app/project/${pid}` },
          { label: 'Risk Center', to: `/app/project/${pid}/risks` },
          { label: `${risk.id}: ${risk.title}` },
        ]}
      />

      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold">
                {risk.id} · {risk.riskType}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                  risk.severity === 'High'
                    ? 'bg-[#E34234] text-[#F3EBFA]'
                    : 'bg-[#E9DDF6] text-[#2A1F45] border border-[#2A1F45]'
                }`}
              >
                {risk.severity} Severity · {risk.businessCategory || 'Business'}
              </span>
              <StatusBadge status={risk.status} />
            </div>

            {risk.riskType === 'Hypothesis' && (
              <div className="px-3.5 py-1.5 rounded-xl bg-[#EAF7A8] border-2 border-[#2A1F45] text-[#2A1F45] font-mono text-xs font-bold inline-flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#E34234]" />
                <span>HYPOTHESIS — not supported by evidence yet</span>
              </div>
            )}

            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#2A1F45]">
              {risk.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {prevRisk && (
              <Link
                to={`/app/project/${pid}/risks/${prevRisk.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#E9DDF6] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev ({prevRisk.id})</span>
              </Link>
            )}
            {nextRisk && (
              <Link
                to={`/app/project/${pid}/risks/${nextRisk.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#E9DDF6] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45]"
              >
                <span>Next ({nextRisk.id})</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Detailed Analysis & Suggested Follow-up Questions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-2">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">
              Severity Rationale & Detailed Analysis
            </h2>
            <p className="text-xs text-[#2A1F45] leading-relaxed">{risk.detailedAnalysis}</p>
          </div>

          <div className="rounded-2xl bg-[#EAF7A8] border border-[#2A1F45] p-5 space-y-2">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">
              Suggested Follow-Up & Diligence Questions
            </h2>
            <ul className="space-y-1.5 text-xs text-[#2A1F45]">
              {risk.mitigationQuestions.map((q, i) => (
                <li key={i}>• {q}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Convert Hypothesis to Evidence-Backed After Investigation */}
        {(risk.riskType === 'Hypothesis' || risk.convertedFromHypothesis) && (
          <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] p-5 space-y-4 border border-[#8A6BC2]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-[#D4FF3F]">
                  Convert Hypothesis to Evidence-Backed After Investigation
                </h2>
                <p className="text-xs text-[#CBB3E8]">
                  Requires attaching a corroborating source document from the project register.
                </p>
              </div>
              {risk.convertedFromHypothesis && (
                <span className="px-3 py-1 rounded-full bg-[#D4FF3F] text-[#2A1F45] font-mono text-xs font-bold">
                  Converted via {risk.convertedSourceId}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={attachSourceId}
                onChange={(e) => setAttachSourceId(e.target.value)}
                className="rounded-xl bg-[#F3EBFA] text-[#2A1F45] px-3.5 py-2 text-xs font-bold"
              >
                {project.sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    Attach {s.id}: {s.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={conversionRationale}
                onChange={(e) => setConversionRationale(e.target.value)}
                placeholder="Investigation finding & rationale..."
                className="rounded-xl bg-[#F3EBFA] text-[#2A1F45] px-3.5 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() =>
                  convertHypothesisToEvidence(
                    pid,
                    risk.id,
                    attachSourceId,
                    conversionRationale
                  )
                }
                className="px-4 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold cursor-pointer"
              >
                Convert to Evidence-Backed
              </button>
            </div>
          </div>
        )}

        {/* Analyst Status & Notes */}
        <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#2A1F45]">
            Analyst Workflow Status & Notes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={analystStatus}
              onChange={(e) => setAnalystStatus(e.target.value as RiskAnalystStatus)}
              className="rounded-xl bg-[#F3EBFA] text-[#2A1F45] px-3.5 py-2 text-xs font-bold border border-[#B9A0DA]"
            >
              <option value="Open">Status: Open</option>
              <option value="Investigating">Status: Investigating</option>
              <option value="Resolved">Status: Resolved</option>
              <option value="Accepted">Status: Accepted</option>
            </select>
            <input
              type="text"
              value={analystNotes}
              onChange={(e) => setAnalystNotes(e.target.value)}
              placeholder="Enter analyst investigation notes..."
              className="rounded-xl bg-[#F3EBFA] text-[#2A1F45] px-3.5 py-2 text-xs border border-[#B9A0DA]"
            />
            <button
              type="button"
              onClick={() => updateRiskAnalystDetail(pid, risk.id, analystStatus, analystNotes)}
              className="px-5 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45] cursor-pointer"
            >
              Save Risk Status & Notes
            </button>
          </div>
        </div>

        {/* Supporting Evidence, Related Claims & Metrics */}
        <div className="pt-3 border-t border-[#B9A0DA] space-y-2">
          <h3 className="font-display text-base font-bold text-[#2A1F45]">
            Supporting Sources, Related Claims & Metrics
          </h3>
          <div className="flex flex-wrap gap-2">
            {risk.sourceIds.map((sid, i) => (
              <SourceChip
                key={sid}
                sourceId={sid}
                projectId={pid}
                highlightPassageId={risk.passageIds[i]}
              />
            ))}
            {risk.relatedClaimIds.map((cid) => (
              <ClaimChip key={cid} claimId={cid} projectId={pid} />
            ))}
            {risk.relatedMetricIds.map((mid) => (
              <MetricChip key={mid} metricId={mid} projectId={pid} />
            ))}
          </div>
        </div>

        {/* Risk Audit Trail */}
        {riskAudits.length > 0 && (
          <div className="pt-3 border-t border-[#B9A0DA] space-y-2">
            <h3 className="font-display text-base font-bold text-[#2A1F45]">
              Risk Audit Trail ({riskAudits.length})
            </h3>
            <div className="space-y-1.5">
              {riskAudits.map((aud) => (
                <div
                  key={aud.id}
                  className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] px-3.5 py-2 text-xs font-mono text-[#2A1F45] flex flex-wrap justify-between gap-2"
                >
                  <span>
                    <strong>{aud.actor}:</strong> {aud.action} — {aud.details}
                  </span>
                  <span className="text-[#6B5B86]">
                    {new Date(aud.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
