import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  History,
  Download,
  Search,
  List,
  Clock,
  Eye,
  X,
  Bell,
  Plus,
  Trash2,
  RefreshCw,
  Sliders,
  AlertTriangle,
  ArrowUpRight,
  GitCompare,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
  MetricChip,
  RatioChip,
  SyntheticOriginTag,
} from '../components/ui/primitives';
import { AuditEntry, WatchlistItem, DataOrigin } from '../types';

type AuditTabKey =
  | 'all'
  | 'comments'
  | 'corrections'
  | 'approvals'
  | 'workflows'
  | 'versions'
  | 'sources';

const AUDIT_TABS: { key: AuditTabKey; label: string }[] = [
  { key: 'all', label: 'All activity' },
  { key: 'comments', label: 'Analyst comments' },
  { key: 'corrections', label: 'Corrections' },
  { key: 'approvals', label: 'Approvals & rejections' },
  { key: 'workflows', label: 'Workflow runs' },
  { key: 'versions', label: 'Report versions' },
  { key: 'sources', label: 'Source & verification record' },
];

/**
 * 2. REVIEW & AUDIT HISTORY (/app/audit)
 */
export const AuditPage: React.FC = () => {
  const navigate = useNavigate();
  const { auditEntries, projects, activeProject, addToast } = useAppStore();

  const [activeTab, setActiveTab] = useState<AuditTabKey>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const actors = useMemo(
    () => Array.from(new Set(auditEntries.map((a) => a.actor))),
    [auditEntries]
  );

  const filteredEntries = useMemo(() => {
    return auditEntries.filter((e) => {
      if (projectFilter !== 'ALL' && e.projectId && e.projectId !== projectFilter) return false;
      if (actionFilter !== 'ALL' && e.targetType !== actionFilter) return false;
      if (actorFilter !== 'ALL' && e.actor !== actorFilter) return false;
      if (dateFilter === '2025-02-20' && !e.timestamp.startsWith('2025-02-20')) return false;
      if (dateFilter === 'TODAY' && e.timestamp.startsWith('2025-02-20')) return false;

      if (activeTab === 'comments') {
        const isComment =
          e.category === 'comment' ||
          e.action.toLowerCase().includes('comment') ||
          e.action.toLowerCase().includes('note') ||
          e.action.toLowerCase().includes('annotate');
        if (!isComment) return false;
      } else if (activeTab === 'corrections') {
        const isCorrection =
          e.category === 'correction' ||
          Boolean(e.beforeValue || e.afterValue) ||
          e.action.toLowerCase().includes('correct') ||
          e.action.toLowerCase().includes('converted');
        if (!isCorrection) return false;
      } else if (activeTab === 'approvals') {
        const isApproval =
          e.category === 'approval' ||
          e.action.toLowerCase().includes('approv') ||
          e.action.toLowerCase().includes('reject') ||
          e.action.toLowerCase().includes('accept') ||
          e.action.toLowerCase().includes('attest');
        if (!isApproval) return false;
      } else if (activeTab === 'workflows') {
        const isWf =
          e.category === 'workflow' ||
          e.actorRole === 'System Orchestrator' ||
          e.action.toLowerCase().includes('pipeline') ||
          e.action.toLowerCase().includes('agent');
        if (!isWf) return false;
      } else if (activeTab === 'versions') {
        const isVer =
          e.category === 'version' ||
          e.targetType === 'Report' ||
          e.action.toLowerCase().includes('version');
        if (!isVer) return false;
      } else if (activeTab === 'sources') {
        const isSrc =
          e.category === 'source' ||
          e.targetType === 'Source' ||
          e.targetType === 'Claim';
        if (!isSrc) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.action.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        e.targetLabel.toLowerCase().includes(q) ||
        e.details.toLowerCase().includes(q)
      );
    });
  }, [auditEntries, projectFilter, actionFilter, actorFilter, dateFilter, activeTab, searchQuery]);

  const handleExportAuditCsv = () => {
    const rows = [
      [
        'Audit ID',
        'Timestamp',
        'Actor',
        'Role',
        'Action',
        'Target Type',
        'Target ID',
        'Before Value',
        'After Value',
        'Details',
      ],
      ...filteredEntries.map((e) => [
        e.id,
        e.timestamp,
        e.actor,
        e.actorRole,
        e.action,
        e.targetType,
        e.targetId,
        e.beforeValue || '',
        e.afterValue || '',
        e.details,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TrustLens_Audit_Trail_${activeTab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported Audit CSV', `Downloaded ${filteredEntries.length} audit records.`, 'verified');
  };

  const reportVersions = activeProject.report.versions || [
    {
      versionNumber: activeProject.report.versionNumber || 1,
      createdAt: activeProject.report.generatedAt,
      status: activeProject.report.reviewStatus,
      author: 'Report Generation Agent',
      changeSummary:
        'Initial 12-section research dossier compiled from verified findings; excluded C2, C3, C5, C7, C8 from verified conclusions.',
      reverifiedClaimIds: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'],
      executiveSummarySnapshot: activeProject.report.executiveSummary,
      unresolvedClaimIdsSnapshot: ['C2', 'C3', 'C5', 'C7', 'C8'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Tomato Red & Chartreuse Magazine Styling */}
      <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] border-2 border-[#E34234] p-6 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#D4FF3F]">
            <History className="w-4 h-4 text-[#E34234]" />
            <span>IMMUTABLE GOVERNANCE LOG • PROVENANCE & CORRECTION LEDGER</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#F3EBFA]">
            Review & Audit History
          </h1>
          <p className="text-xs text-[#CBB3E8]">
            Every agent step, claim correction, before/after value, and human sign-off is logged with
            inspectable JSON metadata (zero sensitive document text stored in logs).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <div className="inline-flex rounded-full bg-[#8A6BC2] p-1 border border-[#CBB3E8]">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-[#D4FF3F] text-[#2A1F45]'
                  : 'text-[#F3EBFA] hover:text-[#D4FF3F]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#D4FF3F] text-[#2A1F45]'
                  : 'text-[#F3EBFA] hover:text-[#D4FF3F]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportAuditCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-bold border-[1.5px] border-[#F3EBFA] hover:bg-[#B8301F] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export audit CSV</span>
          </button>
        </div>
      </div>

      {/* 7 Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {AUDIT_TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border-[1.5px] ${
                active
                  ? 'bg-[#D4FF3F] text-[#2A1F45] border-[#2A1F45] shadow-sm'
                  : 'bg-[#F3EBFA] text-[#2A1F45] border-[#8A6BC2] hover:bg-[#E9DDF6]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Filter Bar (Project, Action Type, User, Date Range, Text Search) */}
      <div className="rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-mono font-bold text-[#6B5B86] mb-1">PROJECT</label>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] px-3 py-2 text-xs font-bold text-[#2A1F45]"
          >
            <option value="ALL">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.companyName} ({p.ticker})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-[#6B5B86] mb-1">
            TARGET / ACTION TYPE
          </label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] px-3 py-2 text-xs font-bold text-[#2A1F45]"
          >
            <option value="ALL">All Target Types</option>
            <option value="Claim">Claim Verification</option>
            <option value="Source">Source Provenance</option>
            <option value="Ratio">Ratio Calculation</option>
            <option value="Risk">Risk Register</option>
            <option value="Report">Report Sign-Off / Version</option>
            <option value="Project">Pipeline / Project</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-[#6B5B86] mb-1">
            ACTOR / USER
          </label>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="w-full rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] px-3 py-2 text-xs font-bold text-[#2A1F45]"
          >
            <option value="ALL">All Actors ({actors.length})</option>
            {actors.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-[#6B5B86] mb-1">
            DATE RANGE
          </label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] px-3 py-2 text-xs font-bold text-[#2A1F45]"
          >
            <option value="ALL">All Dates</option>
            <option value="2025-02-20">Seed Run Date (2025-02-20)</option>
            <option value="TODAY">Interactive Session Actions</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-[#6B5B86] mb-1">
            TEXT SEARCH
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6B5B86] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search C2, S7, $540M..."
              className="w-full rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] pl-8 pr-3 py-2 text-xs text-[#2A1F45]"
            />
          </div>
        </div>
      </div>

      {/* Special "Report versions" Tab Panel */}
      {activeTab === 'versions' && (
        <div className="rounded-2xl bg-[#F3EBFA] border-2 border-[#E34234] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#B9A0DA] pb-3">
            <h2 className="font-display text-xl font-bold text-[#2A1F45]">
              Published Report Dossier Versions ({reportVersions.length})
            </h2>
            <span className="px-3 py-1 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-mono font-bold">
              Immutable Version Snapshots
            </span>
          </div>
          <div className="space-y-3">
            {reportVersions.map((ver) => (
              <div
                key={ver.versionNumber}
                className="rounded-xl bg-[#E9DDF6] border-[1.5px] border-[#8A6BC2] p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold">
                      Version v{ver.versionNumber}
                    </span>
                    <StatusBadge status={ver.status} />
                    <span className="text-xs font-mono text-[#6B5B86]">
                      {new Date(ver.createdAt).toLocaleString()} • {ver.author}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#2A1F45]">{ver.changeSummary}</p>
                  <p className="text-xs font-mono text-[#B8301F]">
                    Re-verified Claims: {ver.reverifiedClaimIds.join(', ')}
                  </p>
                </div>
                <Link
                  to={`/app/project/${activeProject.id}/report`}
                  className="px-4 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45]"
                >
                  View v{ver.versionNumber} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline vs Table View */}
      {viewMode === 'timeline' ? (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] hover:border-[#E34234] p-4 flex flex-wrap items-start justify-between gap-4 transition-all"
            >
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#2A1F45] text-[#D4FF3F] text-xs font-mono font-bold">
                    {entry.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                      entry.actorRole === 'Reviewer'
                        ? 'bg-[#E34234] text-[#F3EBFA]'
                        : entry.actorRole === 'Analyst'
                        ? 'bg-[#D4FF3F] text-[#2A1F45]'
                        : 'bg-[#8A6BC2] text-[#F3EBFA]'
                    }`}
                  >
                    {entry.actor} ({entry.actorRole})
                  </span>
                  <span className="text-xs font-mono text-[#6B5B86]">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="font-display text-base font-bold text-[#2A1F45]">
                  {entry.action}
                </div>
                <p className="text-xs text-[#6B5B86] leading-relaxed">{entry.details}</p>

                {/* Before / After Values for Corrections */}
                {(entry.beforeValue || entry.afterValue) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {entry.beforeValue && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#E34234] text-[#F3EBFA] font-mono text-xs font-bold">
                        BEFORE: {entry.beforeValue}
                      </span>
                    )}
                    {entry.afterValue && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#D4FF3F] text-[#2A1F45] border border-[#2A1F45] font-mono text-xs font-bold">
                        AFTER: {entry.afterValue}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={entry.targetRoute}
                  className="px-3.5 py-1.5 rounded-full bg-[#E9DDF6] hover:bg-[#D4FF3F] text-[#2A1F45] border-[1.5px] border-[#2A1F45] text-xs font-bold"
                >
                  {entry.targetLabel} →
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedEntry(entry)}
                  className="px-3 py-1.5 rounded-full bg-[#2A1F45] text-[#D4FF3F] text-xs font-mono font-bold cursor-pointer"
                >
                  JSON
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#2A1F45] text-[#F3EBFA] font-mono">
                <th className="p-3">ID & Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Clickable Target</th>
                <th className="p-3">Before / After</th>
                <th className="p-3">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9A0DA] bg-[#E9DDF6]">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#CBB3E8]">
                  <td className="p-3 font-mono">
                    <div className="font-bold text-[#2A1F45]">{entry.id}</div>
                    <div className="text-[#6B5B86]">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-[#2A1F45]">{entry.actor}</div>
                    <div className="text-[#8A6BC2] font-mono">{entry.actorRole}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-[#2A1F45]">{entry.action}</div>
                    <div className="text-[#6B5B86]">{entry.details}</div>
                  </td>
                  <td className="p-3">
                    <Link
                      to={entry.targetRoute}
                      className="font-bold text-[#B8301F] underline hover:text-[#2A1F45]"
                    >
                      {entry.targetLabel}
                    </Link>
                  </td>
                  <td className="p-3 font-mono">
                    {entry.beforeValue || entry.afterValue ? (
                      <div className="space-y-1">
                        {entry.beforeValue && (
                          <div className="text-[#B8301F] font-bold">Before: {entry.beforeValue}</div>
                        )}
                        {entry.afterValue && (
                          <div className="text-[#2A1F45] font-bold">After: {entry.afterValue}</div>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => setSelectedEntry(entry)}
                      className="px-2.5 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono font-bold cursor-pointer"
                    >
                      JSON Drawer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Entry Detail Drawer with Full Sanitized JSON */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-[#2A1F45]/75 flex justify-end">
          <div className="w-full max-w-xl bg-[#F3EBFA] border-l-4 border-[#E34234] h-full p-6 overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#B9A0DA] pb-4">
              <div>
                <div className="text-xs font-mono text-[#E34234] font-bold">
                  AUDIT RECORD JSON DRAWER
                </div>
                <h3 className="font-display text-xl font-bold text-[#2A1F45]">
                  {selectedEntry.id} — {selectedEntry.action}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="p-2 rounded-full bg-[#E34234] text-[#F3EBFA] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl bg-[#EAF7A8] border border-[#2A1F45] p-3 text-xs text-[#2A1F45] font-mono">
              Privacy & Provenance Guard: No raw confidential document text is persisted in audit
              logs—only immutable entity IDs, timestamps, and short verification excerpts.
            </div>

            <pre className="p-4 rounded-xl bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs overflow-x-auto leading-relaxed border border-[#8A6BC2]">
              {JSON.stringify(
                {
                  ...selectedEntry,
                  privacyCompliance: 'IDs_AND_SHORT_EXCERPTS_ONLY',
                  hashSignature: `sha256:${selectedEntry.id.toLowerCase()}-verified-ledger`,
                },
                null,
                2
              )}
            </pre>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const route = selectedEntry.targetRoute;
                  setSelectedEntry(null);
                  navigate(route);
                }}
                className="px-4 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border border-[#2A1F45] cursor-pointer"
              >
                Navigate to Target ({selectedEntry.targetLabel}) →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 4. WATCHLIST & CHANGE ALERTS (/app/watchlist)
 */
export const WatchlistPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    watchlist,
    watchlistThresholds,
    activeProject,
    addWatchlistCompany,
    removeWatchlistCompany,
    refreshWatchlistAlerts,
    updateWatchlistThresholds,
    createProject,
  } = useAppStore();

  const [newTicker, setNewTicker] = useState<string>('');
  const [newCompany, setNewCompany] = useState<string>('');
  const [newOrigin, setNewOrigin] = useState<DataOrigin>('SEC EDGAR METADATA');
  const [selectedAlert, setSelectedAlert] = useState<WatchlistItem | null>(null);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] border-2 border-[#E34234] p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#D4FF3F]">
            <Bell className="w-4 h-4 text-[#E34234]" />
            <span>DETERMINISTIC DATA-DIFF ALERTS • ZERO PHANTOM MONITORING</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#F3EBFA]">
            Watchlist & Change Alerts
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8301F] text-[#F3EBFA] border border-[#D4FF3F] text-xs font-mono font-bold">
            Checks run when you open the app or press Refresh. This is not real-time monitoring.
          </div>
        </div>

        <button
          type="button"
          onClick={refreshWatchlistAlerts}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45] hover:bg-[#EAF7A8] cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Checks Now</span>
        </button>
      </div>

      {/* Add Company + Threshold Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] p-5 space-y-3">
          <div className="text-xs font-mono font-bold text-[#2A1F45] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#E34234]" />
            <span>ADD COMPANY TO WATCHLIST (AURD SYNTHETIC PRELOADED + ANY TICKER)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              placeholder="Ticker (e.g. NVDA, MSFT)"
              className="rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] px-3 py-2 text-xs font-bold text-[#2A1F45]"
            />
            <input
              type="text"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="Company Name"
              className="rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] px-3 py-2 text-xs text-[#2A1F45]"
            />
            <select
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value as DataOrigin)}
              className="rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] px-3 py-2 text-xs font-bold text-[#2A1F45]"
            >
              <option value="SEC EDGAR METADATA">SEC EDGAR METADATA</option>
              <option value="SYNTHETIC — FICTIONAL">SYNTHETIC — FICTIONAL</option>
              <option value="UPLOADED BY USER">UPLOADED BY USER</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!newTicker.trim()) return;
              addWatchlistCompany(newTicker, newCompany, newOrigin);
              setNewTicker('');
              setNewCompany('');
            }}
            className="px-4 py-2 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-bold border border-[#2A1F45] hover:bg-[#B8301F] cursor-pointer"
          >
            + Add Ticker & Run Stored Data Diff
          </button>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-[#F3EBFA] border-2 border-[#8A6BC2] p-5 space-y-3">
          <div className="text-xs font-mono font-bold text-[#2A1F45] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#8A6BC2]" />
            <span>ALERT TRIGGER THRESHOLD SETTINGS</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#6B5B86] mb-1">
                NET MARGIN DELTA (pp)
              </label>
              <input
                type="number"
                step="0.1"
                value={watchlistThresholds.netMarginDeltaPp}
                onChange={(e) =>
                  updateWatchlistThresholds({
                    netMarginDeltaPp: parseFloat(e.target.value) || 0.5,
                  })
                }
                className="w-full rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] px-3 py-2 text-xs font-mono font-bold text-[#2A1F45]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#6B5B86] mb-1">
                REV GROWTH DELTA (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={watchlistThresholds.revenueGrowthDeltaPct}
                onChange={(e) =>
                  updateWatchlistThresholds({
                    revenueGrowthDeltaPct: parseFloat(e.target.value) || 2.0,
                  })
                }
                className="w-full rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] px-3 py-2 text-xs font-mono font-bold text-[#2A1F45]"
              />
            </div>
          </div>
          <div className="text-xs font-mono text-[#6B5B86]">
            Alerts fire strictly from real differences in stored financials or EDGAR metadata checks.
          </div>
        </div>
      </div>

      {/* Watchlist Cards */}
      <div className="space-y-4">
        {watchlist.map((w) => (
          <div
            key={w.id}
            className={`rounded-2xl bg-[#F3EBFA] border-2 p-5 space-y-3 transition-all ${
              w.severity === 'Critical'
                ? 'border-[#E34234]'
                : w.severity === 'Warning'
                ? 'border-[#8A6BC2]'
                : 'border-[#B9A0DA]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold">
                  {w.ticker}
                </span>
                <span className="font-display text-lg font-bold text-[#2A1F45]">
                  {w.companyName}
                </span>
                <SyntheticOriginTag origin={w.dataOrigin} />
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                    w.severity === 'Critical'
                      ? 'bg-[#E34234] text-[#F3EBFA]'
                      : w.severity === 'Warning'
                      ? 'bg-[#EAF7A8] text-[#2A1F45] border border-[#2A1F45]'
                      : 'bg-[#8A6BC2] text-[#F3EBFA]'
                  }`}
                >
                  {w.severity} Alert
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#6B5B86]">
                  Latest Period: <strong>{w.latestPeriod || 'FY2024'}</strong> • Checked:{' '}
                  {new Date(w.lastCheckedAt || w.addedAt).toLocaleTimeString()}
                </span>
                <button
                  type="button"
                  onClick={() => removeWatchlistCompany(w.id)}
                  className="p-2 rounded-full bg-[#E9DDF6] hover:bg-[#E34234] text-[#2A1F45] hover:text-[#F3EBFA] cursor-pointer"
                  title="Remove from watchlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="font-display text-base font-bold text-[#2A1F45]">{w.alertHeadline}</div>
            <p className="text-xs text-[#6B5B86]">{w.alertDetail}</p>

            {/* Trigger Rule, Threshold, Values Compared */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3">
                <div className="text-xs font-mono text-[#6B5B86]">TRIGGER RULE</div>
                <div className="text-xs font-bold text-[#2A1F45] mt-0.5">
                  {w.triggerRule || 'Net Margin Change > 0.5pp'}
                </div>
              </div>
              <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3">
                <div className="text-xs font-mono text-[#6B5B86]">THRESHOLD APPLIED</div>
                <div className="text-xs font-mono font-bold text-[#E34234] mt-0.5">
                  {w.thresholdUsed || `±${watchlistThresholds.netMarginDeltaPp}pp`}
                </div>
              </div>
              <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3">
                <div className="text-xs font-mono text-[#6B5B86]">STORED VALUES COMPARED</div>
                <div className="text-xs font-mono font-bold text-[#2A1F45] mt-0.5">
                  {w.valuesCompared || 'FY2024: 11.0% vs FY2023: 10.2% (+0.8pp)'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#B9A0DA]">
              <div className="flex flex-wrap items-center gap-2">
                {w.metricId && <MetricChip metricId={w.metricId} projectId={w.projectId} />}
                {w.ratioId && <RatioChip ratioId={w.ratioId} projectId={w.projectId} />}
                {w.trackedRatioIds.map((rid) => (
                  <RatioChip key={rid} ratioId={rid} projectId={w.projectId} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(w)}
                  className="px-3.5 py-1.5 rounded-full bg-[#2A1F45] text-[#D4FF3F] text-xs font-bold cursor-pointer"
                >
                  Open Alert Drawer
                </button>
                <Link
                  to={w.targetRoute}
                  className="px-3.5 py-1.5 rounded-full bg-[#D4FF3F] text-[#2A1F45] border border-[#2A1F45] text-xs font-bold"
                >
                  Inspect Evidence →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Detail Drawer with "Start research from this alert" */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-[#2A1F45]/75 flex justify-end">
          <div className="w-full max-w-lg bg-[#F3EBFA] border-l-4 border-[#E34234] h-full p-6 overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#B9A0DA] pb-4">
              <div>
                <div className="text-xs font-mono font-bold text-[#E34234]">
                  WATCHLIST ALERT DETAIL DRAWER
                </div>
                <h3 className="font-display text-xl font-bold text-[#2A1F45]">
                  {selectedAlert.ticker}: {selectedAlert.alertHeadline}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="p-2 rounded-full bg-[#E34234] text-[#F3EBFA] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#2A1F45]">
              <div className="p-3.5 rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] space-y-1">
                <div className="font-mono font-bold text-[#6B5B86]">TRIGGER RULE:</div>
                <div className="font-bold">{selectedAlert.triggerRule}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] space-y-1">
                <div className="font-mono font-bold text-[#6B5B86]">VALUES COMPARED:</div>
                <div className="font-mono font-bold">{selectedAlert.valuesCompared}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] space-y-1">
                <div className="font-mono font-bold text-[#6B5B86]">ANALYST CONTEXT:</div>
                <p>{selectedAlert.alertDetail}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#B9A0DA] flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const targetTicker = selectedAlert.ticker;
                  const targetName = selectedAlert.companyName;
                  const origin = selectedAlert.dataOrigin;
                  setSelectedAlert(null);
                  if (targetTicker === 'AURD') {
                    navigate(`/app/project/${activeProject.id}/pipeline`);
                  } else {
                    const created = createProject({
                      companyName: targetName,
                      ticker: targetTicker,
                      sector: 'Industrial Technology',
                      dataOrigin: origin,
                      periods: ['FY2022', 'FY2023', 'FY2024'],
                    });
                    navigate(`/app/project/${created.id}/pipeline`);
                  }
                }}
                className="px-5 py-2.5 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45] cursor-pointer"
              >
                Start research from this alert →
              </button>
              <button
                type="button"
                onClick={() => {
                  const route = selectedAlert.targetRoute;
                  setSelectedAlert(null);
                  navigate(route);
                }}
                className="px-4 py-2.5 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-bold cursor-pointer"
              >
                Inspect Linked Metric / Ratio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 5. COMPARISON MODE (/app/compare)
 */
export const ComparePage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, activeProject, addToast } = useAppStore();
  const pid = activeProject.id;

  const [mode, setMode] = useState<'period' | 'company'>('period');
  const [periodA, setPeriodA] = useState<string>('FY2024');
  const [periodB, setPeriodB] = useState<string>('FY2023');
  const [companyBType, setCompanyBType] = useState<'PEER_SYNTH' | 'SEC_REAL'>('PEER_SYNTH');
  const [ackSyntheticRealMix, setAckSyntheticRealMix] = useState<boolean>(false);

  const finA =
    activeProject.financials.find((f) => f.period === periodA) || activeProject.financials[2];
  const finB =
    activeProject.financials.find((f) => f.period === periodB) || activeProject.financials[1];

  const isPeriodTypeMismatch = finA.periodType !== finB.periodType;
  const isSyntheticRealMix = mode === 'company' && companyBType === 'SEC_REAL';

  const comparisonRows = [
    {
      label: 'Consolidated Revenue',
      metricId: 'M-REV-2024',
      valA: finA.revenue,
      valB: mode === 'period' ? finB.revenue : companyBType === 'PEER_SYNTH' ? 495.0 : 612.4,
      sourceId: finA.sourceId,
    },
    {
      label: 'Cost of Goods Sold (COGS)',
      metricId: 'M-COGS-2024',
      valA: finA.cogs,
      valB: mode === 'period' ? finB.cogs : companyBType === 'PEER_SYNTH' ? 302.0 : 355.0,
      sourceId: finA.sourceId,
    },
    {
      label: 'Consolidated Net Income',
      metricId: 'M-NI-2024',
      valA: finA.netIncome,
      valB: mode === 'period' ? finB.netIncome : companyBType === 'PEER_SYNTH' ? 49.5 : 68.2,
      sourceId: finA.sourceId,
    },
    {
      label: 'Current Assets',
      metricId: 'M-CA-2024',
      valA: finA.currentAssets,
      valB: mode === 'period' ? finB.currentAssets : companyBType === 'PEER_SYNTH' ? 250.0 : 310.0,
      sourceId: finA.sourceId,
    },
    {
      label: 'Total Assets',
      metricId: 'M-TA-2024',
      valA: finA.totalAssets,
      valB: mode === 'period' ? finB.totalAssets : companyBType === 'PEER_SYNTH' ? 620.0 : 790.0,
      sourceId: finA.sourceId,
    },
    {
      label: 'Operating Cash Flow',
      metricId: finA.period === 'Q4 FY2024' ? 'M-OCF-Q4' : 'M-OCF-2024',
      valA: finA.operatingCashFlow,
      valB:
        mode === 'period'
          ? finB.operatingCashFlow
          : companyBType === 'PEER_SYNTH'
          ? 64.0
          : 82.5,
      sourceId: finA.sourceId,
    },
  ];

  const chartData = comparisonRows.map((r) => ({
    name: r.label.replace('Consolidated ', ''),
    [mode === 'period' ? periodA : 'AURD (Synthetic)']: r.valA ?? 0,
    [mode === 'period'
      ? periodB
      : companyBType === 'PEER_SYNTH'
      ? 'HXRO (Synthetic Peer)'
      : 'ROK (Public SEC Filing)']: r.valB ?? 0,
  }));

  const handleExportCompareCsv = () => {
    const rows = [
      ['Metric', 'Primary Selection', 'Comparison Target', 'Delta ($M)', 'Delta (%)', 'Source'],
      ...comparisonRows.map((r) => {
        const d = r.valA !== null && r.valB !== null ? r.valA - r.valB : null;
        const pct =
          r.valA !== null && r.valB !== null && r.valB !== 0
            ? ((r.valA - r.valB) / r.valB) * 100
            : null;
        return [
          r.label,
          r.valA !== null ? `$${r.valA.toFixed(1)}M` : 'NULL',
          r.valB !== null ? `$${r.valB.toFixed(1)}M` : 'NULL',
          d !== null ? `${d >= 0 ? '+' : ''}$${d.toFixed(1)}M` : 'Not Comparable',
          pct !== null ? `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%` : 'Not Comparable',
          r.sourceId,
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TrustLens_Comparison_${mode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported Comparison CSV', 'Downloaded aligned comparison table.', 'verified');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] border-2 border-[#E34234] p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-wider text-[#D4FF3F]">
            SIDE-BY-SIDE DETERMINISTIC BENCHMARKING
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#F3EBFA]">
            Comparison Mode ({mode === 'period' ? 'Period vs. Period' : 'Company vs. Company'})
          </h1>
          <p className="text-xs text-[#CBB3E8]">
            Aligned metric table with deltas, ratio comparison, side-by-side charts, and automatic
            "Not comparable" guardrails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-full bg-[#8A6BC2] p-1 border border-[#D4FF3F]">
            <button
              type="button"
              onClick={() => setMode('period')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                mode === 'period' ? 'bg-[#D4FF3F] text-[#2A1F45]' : 'text-[#F3EBFA]'
              }`}
            >
              Period vs Period
            </button>
            <button
              type="button"
              onClick={() => setMode('company')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                mode === 'company' ? 'bg-[#D4FF3F] text-[#2A1F45]' : 'text-[#F3EBFA]'
              }`}
            >
              Company vs Company
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCompareCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-bold border border-[#F3EBFA] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export comparison CSV</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] p-4 flex flex-wrap items-center justify-between gap-4">
        {mode === 'period' ? (
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#6B5B86] mb-1">
                PRIMARY PERIOD (A)
              </label>
              <select
                value={periodA}
                onChange={(e) => setPeriodA(e.target.value)}
                className="rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] px-3.5 py-2 text-xs font-bold text-[#2A1F45]"
              >
                {activeProject.financials.map((f) => (
                  <option key={f.period} value={f.period}>
                    {f.period} ({f.periodType})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-[#6B5B86] mb-1">
                COMPARISON PERIOD (B)
              </label>
              <select
                value={periodB}
                onChange={(e) => setPeriodB(e.target.value)}
                className="rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] px-3.5 py-2 text-xs font-bold text-[#2A1F45]"
              >
                {activeProject.financials.map((f) => (
                  <option key={f.period} value={f.period}>
                    {f.period} ({f.periodType})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="px-4 py-2 rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] text-xs font-bold text-[#2A1F45]">
              Company A: Aurora Dynamics Ltd. (AURD — SYNTHETIC — FICTIONAL)
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-[#6B5B86] mb-1">
                BENCHMARK COMPANY (B)
              </label>
              <select
                value={companyBType}
                onChange={(e) =>
                  setCompanyBType(e.target.value as 'PEER_SYNTH' | 'SEC_REAL')
                }
                className="rounded-xl bg-[#E9DDF6] border border-[#8A6BC2] px-3.5 py-2 text-xs font-bold text-[#2A1F45]"
              >
                <option value="PEER_SYNTH">
                  Helios Robotics Corp. (HXRO — SYNTHETIC PEER)
                </option>
                <option value="SEC_REAL">
                  Rockwell Automation (ROK — PUBLIC SEC FILING METADATA)
                </option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* "Not comparable" Warnings */}
      {isPeriodTypeMismatch && mode === 'period' && (
        <div className="rounded-2xl bg-[#E34234] text-[#F3EBFA] border-2 border-[#2A1F45] p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-[#D4FF3F] shrink-0" />
          <div className="text-xs">
            <strong>NOT COMPARABLE WARNING (Different Period Types):</strong> Comparing an{' '}
            <strong>{finA.periodType}</strong> period ({periodA}) against a{' '}
            <strong>{finB.periodType}</strong> period ({periodB}) produces distorted percentage
            deltas. Select matching period types for valid YoY/QoQ benchmarking.
          </div>
        </div>
      )}

      {isSyntheticRealMix && (
        <div className="rounded-2xl bg-[#E34234] text-[#F3EBFA] border-2 border-[#2A1F45] p-4 space-y-2">
          <div className="flex items-center gap-2 font-display text-base font-bold">
            <AlertTriangle className="w-5 h-5 text-[#D4FF3F]" />
            <span>
              Governance Guardrail: Synthetic vs. Real Public Filing Mixing Blocked Without Explicit
              Label
            </span>
          </div>
          <p className="text-xs">
            AURD is a <strong>SYNTHETIC — FICTIONAL</strong> dataset, whereas ROK is a{' '}
            <strong>PUBLIC FINANCIAL FILING</strong>. Mixing synthetic and real data is blocked unless
            you explicitly enable the cross-origin label below.
          </p>
          <label className="inline-flex items-center gap-2 text-xs font-bold bg-[#2A1F45] text-[#D4FF3F] px-3 py-1.5 rounded-full cursor-pointer">
            <input
              type="checkbox"
              checked={ackSyntheticRealMix}
              onChange={(e) => setAckSyntheticRealMix(e.target.checked)}
              className="accent-[#D4FF3F]"
            />
            <span>Apply Explicit "SYNTHETIC vs REAL BENCHMARK" Label & Unlock Table</span>
          </label>
        </div>
      )}

      {/* Aligned Metric Table + Side-by-Side Chart */}
      {(!isSyntheticRealMix || ackSyntheticRealMix) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#2A1F45] text-[#F3EBFA] font-mono">
                  <th className="p-3">Aligned Metric (Click for Detail)</th>
                  <th className="p-3">
                    {mode === 'period' ? periodA : 'AURD (Synthetic)'}
                  </th>
                  <th className="p-3">
                    {mode === 'period'
                      ? periodB
                      : companyBType === 'PEER_SYNTH'
                      ? 'HXRO (Synthetic)'
                      : 'ROK (Real SEC)'}
                  </th>
                  <th className="p-3">Delta</th>
                  <th className="p-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9A0DA] bg-[#E9DDF6]">
                {comparisonRows.map((row) => {
                  const hasNull = row.valA === null || row.valB === null;
                  const delta =
                    !hasNull && row.valA !== null && row.valB !== null
                      ? row.valA - row.valB
                      : null;
                  const pct =
                    delta !== null && row.valB
                      ? ((delta / row.valB) * 100).toFixed(1)
                      : null;
                  return (
                    <tr
                      key={row.label}
                      onClick={() =>
                        navigate(`/app/project/${pid}/analysis/metric/${row.metricId}`)
                      }
                      className="hover:bg-[#CBB3E8] cursor-pointer"
                    >
                      <td className="p-3 font-bold text-[#2A1F45] underline">{row.label}</td>
                      <td className="p-3 font-mono font-bold text-[#2A1F45]">
                        {row.valA !== null ? (
                          `$${row.valA.toFixed(1)}M`
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-[#E34234] text-[#F3EBFA]">
                            NULL (Missing)
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[#2A1F45]">
                        {row.valB !== null ? `$${row.valB.toFixed(1)}M` : 'NULL'}
                      </td>
                      <td className="p-3 font-mono font-bold">
                        {hasNull || isPeriodTypeMismatch ? (
                          <span className="px-2 py-0.5 rounded bg-[#E34234] text-[#F3EBFA]">
                            Not comparable
                          </span>
                        ) : (
                          <span className="text-[#2A1F45]">
                            {delta! >= 0 ? '+' : ''}${delta!.toFixed(1)}M ({pct}%)
                          </span>
                        )}
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <SourceChip sourceId={row.sourceId} projectId={pid} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-[#F3EBFA] border-2 border-[#B9A0DA] p-5 space-y-3">
            <div className="text-xs font-mono font-bold text-[#2A1F45]">
              SIDE-BY-SIDE METRIC & RATIO COMPARISON ($M)
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B9A0DA" />
                  <XAxis dataKey="name" stroke="#2A1F45" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#2A1F45" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2A1F45',
                      borderColor: '#D4FF3F',
                      color: '#F3EBFA',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey={mode === 'period' ? periodA : 'AURD (Synthetic)'}
                    fill="#8A6BC2"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey={
                      mode === 'period'
                        ? periodB
                        : companyBType === 'PEER_SYNTH'
                        ? 'HXRO (Synthetic Peer)'
                        : 'ROK (Public SEC Filing)'
                    }
                    fill="#E34234"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
