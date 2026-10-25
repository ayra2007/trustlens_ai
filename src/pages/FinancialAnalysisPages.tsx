import React, { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
  ReferenceDot,
} from 'recharts';
import {
  Calculator,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Flag,
  MessageSquarePlus,
  RefreshCw,
  CheckCircle2,
  Eye,
  BookOpen,
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
import { calcPeriodChange, calcGrossMargin, calcNetMargin, safeDivide } from '../lib/calculations';

/**
 * 4. FINANCIAL ANALYSIS (/app/project/:projectId/analysis)
 */
export const AnalysisPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, activeProject } = useAppStore();
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === projectId) || activeProject;
  const pid = project.id;

  const [periodMode, setPeriodMode] = useState<'YoY' | 'QoQ'>('YoY');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('FY2024');
  const [ratioCategoryFilter, setRatioCategoryFilter] = useState<
    'All' | 'Profitability' | 'Liquidity' | 'Leverage' | 'Efficiency'
  >('All');
  const [showCalcSteps, setShowCalcSteps] = useState<boolean>(false);

  const annualFinancials = useMemo(
    () => project.financials.filter((f) => f.periodType === 'Annual'),
    [project.financials]
  );
  const quarterlyFinancials = useMemo(
    () => project.financials.filter((f) => f.periodType === 'Quarterly'),
    [project.financials]
  );

  // Chart data for Revenue & Net Income
  const revenueAndIncomeSeries = useMemo(() => {
    const sourceList = periodMode === 'YoY' ? annualFinancials : quarterlyFinancials;
    return sourceList.map((f) => {
      const gm = calcGrossMargin(f.revenue, f.cogs);
      const nm = calcNetMargin(f.netIncome, f.revenue);
      return {
        period: f.period,
        revenue: f.revenue,
        netIncome: f.netIncome,
        operatingCashFlow: f.operatingCashFlow, // null in Q4 FY2024!
        grossMargin: gm.value,
        netMargin: nm.value,
        metricIdRevenue: f.period === 'Q4 FY2024' ? 'M-REV-Q4' : 'M-REV-2024',
        metricIdNi: 'M-NI-2024',
        metricIdOcf: f.period === 'Q4 FY2024' ? 'M-OCF-Q4' : 'M-OCF-2024',
      };
    });
  }, [periodMode, annualFinancials, quarterlyFinancials]);

  const filteredRatios = useMemo(() => {
    if (ratioCategoryFilter === 'All') return project.ratios;
    return project.ratios.filter((r) => (r.category || 'Profitability') === ratioCategoryFilter);
  }, [project.ratios, ratioCategoryFilter]);

  // Division-by-zero deterministic guard check
  const divByZeroGuardCheck = safeDivide(59.4, 0);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo={`/app/project/${pid}`}
        items={[
          { label: 'Projects', to: '/app/dashboard' },
          { label: project.ticker, to: `/app/project/${pid}` },
          { label: 'Financial Analysis & Deterministic Ratios' },
        ]}
      />

      {/* Top Controls Header */}
      <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] p-6 border border-[#8A6BC2] space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <SyntheticOriginTag origin={project.dataOrigin} />
              <span className="px-3 py-1 rounded-full bg-[#D4FF3F] text-[#2A1F45] font-mono text-xs font-bold inline-flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                <span>100% Deterministic TypeScript Arithmetic</span>
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#F3EBFA]">
              Financial Statement & Ratio Analysis ({project.ticker})
            </h1>
            <p className="text-xs text-[#CBB3E8] max-w-3xl">
              Click any chart bar, point, metric row, or ratio row to drill down into exact source
              passages and step-by-step math. Missing values (such as Q4 FY2024 Operating Cash Flow)
              are preserved as explicit <span className="font-mono text-[#D4FF3F]">null</span> gaps
              and never coerced to zero.
            </p>
          </div>

          {/* Period Selector, YoY/QoQ Toggle & Show Calculation Steps Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex rounded-full bg-[#8A6BC2]/30 p-1 border border-[#CBB3E8]">
              {(['YoY', 'QoQ'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPeriodMode(mode)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    periodMode === mode
                      ? 'bg-[#D4FF3F] text-[#2A1F45]'
                      : 'text-[#F3EBFA] hover:text-[#D4FF3F]'
                  }`}
                >
                  {mode === 'YoY' ? 'Annual (YoY)' : 'Quarterly (QoQ)'}
                </button>
              ))}
            </div>

            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-full bg-[#F3EBFA] text-[#2A1F45] px-4 py-2 text-xs font-bold border border-[#B9A0DA]"
            >
              {project.periods.map((per) => (
                <option key={per} value={per}>
                  Focus Period: {per}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowCalcSteps(!showCalcSteps)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border-[1.5px] transition-colors cursor-pointer ${
                showCalcSteps
                  ? 'bg-[#D4FF3F] text-[#2A1F45] border-[#2A1F45]'
                  : 'bg-[#8A6BC2]/30 text-[#F3EBFA] border-[#CBB3E8]'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{showCalcSteps ? 'Hide calculation steps' : 'Show calculation steps'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Recharts Panels (Strict Palette Only) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Revenue & Net Income Trend */}
        <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-[#2A1F45]">
                Revenue & Net Income Trend ({periodMode === 'YoY' ? 'FY2022–FY2024' : 'Q1–Q4 FY2024'})
              </h2>
              <p className="text-xs text-[#6B5B86]">
                Click any bar to open Metric Detail (USD Millions, Audited S1/S3/S4).
              </p>
            </div>
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-[#E9DDF6] text-[#2A1F45] border border-[#B9A0DA]">
              Click Bar → Drill Down
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueAndIncomeSeries}
                onClick={(state) => {
                  if (state && state.activeLabel) {
                    const isQ4 = state.activeLabel === 'Q4 FY2024';
                    navigate(
                      `/app/project/${pid}/analysis/metric/${isQ4 ? 'M-REV-Q4' : 'M-REV-2024'}`
                    );
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#B9A0DA" />
                <XAxis dataKey="period" stroke="#2A1F45" tick={{ fill: '#2A1F45', fontSize: 12 }} />
                <YAxis stroke="#2A1F45" tick={{ fill: '#2A1F45', fontSize: 12 }} unit="M" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2A1F45',
                    borderColor: '#8A6BC2',
                    borderRadius: '12px',
                    color: '#F3EBFA',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#D4FF3F' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#2A1F45' }} />
                <Bar
                  dataKey="revenue"
                  name="Audited Revenue ($M)"
                  fill="#8A6BC2"
                  radius={[8, 8, 0, 0]}
                  cursor="pointer"
                />
                <Bar
                  dataKey="netIncome"
                  name="Net Income ($M)"
                  fill="#D4FF3F"
                  stroke="#2A1F45"
                  strokeWidth={1.5}
                  radius={[8, 8, 0, 0]}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Operating Cash Flow Trend (with Missing Q4 Labelled Gap, NOT Zero) */}
        <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-[#2A1F45]">
                Operating Cash Flow (Missing Q4 Shown as Gap — Never Zero)
              </h2>
              <p className="text-xs text-[#6B5B86]">
                Switch to Quarterly (QoQ) to see Q4 FY2024 explicitly rendered as a null gap.
              </p>
            </div>
            <Link
              to={`/app/project/${pid}/analysis/metric/M-OCF-Q4`}
              className="px-3 py-1 rounded-full bg-[#E34234] text-[#F3EBFA] font-mono text-[11px] font-bold"
            >
              Q4 OCF = NULL (Inspect)
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={quarterlyFinancials.map((q) => ({
                  period: q.period,
                  operatingCashFlow: q.operatingCashFlow,
                  revenue: q.revenue,
                }))}
                onClick={() => navigate(`/app/project/${pid}/analysis/metric/M-OCF-Q4`)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#B9A0DA" />
                <XAxis dataKey="period" stroke="#2A1F45" tick={{ fill: '#2A1F45', fontSize: 12 }} />
                <YAxis
                  stroke="#2A1F45"
                  tick={{ fill: '#2A1F45', fontSize: 12 }}
                  domain={[10, 25]}
                  unit="M"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2A1F45',
                    borderColor: '#E34234',
                    borderRadius: '12px',
                    color: '#F3EBFA',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown) =>
                    value === null || value === undefined
                      ? ['MISSING (Null — Not Reported)', 'Operating Cash Flow']
                      : [`$${value}M`, 'Operating Cash Flow']
                  }
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#2A1F45' }} />
                <Line
                  type="monotone"
                  dataKey="operatingCashFlow"
                  name="Quarterly OCF ($M) — Q4 Missing Gap"
                  stroke="#2A1F45"
                  strokeWidth={3}
                  connectNulls={false}
                  dot={{ r: 6, fill: '#D4FF3F', stroke: '#2A1F45', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#E34234' }}
                />
                <ReferenceDot
                  x="Q3 FY2024"
                  y={18.0}
                  r={5}
                  fill="#E34234"
                  stroke="#2A1F45"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl bg-[#E9DDF6] border border-[#E34234] px-3.5 py-2 text-xs text-[#2A1F45] flex items-center justify-between">
            <span>
              <strong>Zero-Coercion Guard:</strong> Q1 ($15.8M), Q2 ($16.9M), Q3 ($18.0M) are
              plotted; Q4 FY2024 is <code className="font-mono font-bold">null</code> (labelled gap).
            </span>
            <ClaimChip claimId="C7" projectId={pid} showStatement={false} />
          </div>
        </div>

        {/* 3. Gross Margin & Net Margin Lines */}
        <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-3 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-[#2A1F45]">
                Profitability Margin Trajectory (Gross Margin vs Net Margin %)
              </h2>
              <p className="text-xs text-[#6B5B86]">
                Click chart to inspect RAT-GM (40.0%) and RAT-NM (11.0%) deterministic calculations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MetricChip ratioId="RAT-GM" projectId={pid} />
              <MetricChip ratioId="RAT-NM" projectId={pid} />
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueAndIncomeSeries}
                onClick={() => navigate(`/app/project/${pid}/analysis/ratio/RAT-NM`)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#B9A0DA" />
                <XAxis dataKey="period" stroke="#2A1F45" tick={{ fill: '#2A1F45', fontSize: 12 }} />
                <YAxis stroke="#2A1F45" tick={{ fill: '#2A1F45', fontSize: 12 }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2A1F45',
                    borderColor: '#8A6BC2',
                    borderRadius: '12px',
                    color: '#F3EBFA',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#2A1F45' }} />
                <Line
                  type="monotone"
                  dataKey="grossMargin"
                  name="Gross Margin (%)"
                  stroke="#8A6BC2"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#D4FF3F', stroke: '#2A1F45', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="netMargin"
                  name="Net Profit Margin (%)"
                  stroke="#2A1F45"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#E34234', stroke: '#2A1F45', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Deterministic Ratio Table with Category Tabs & Optional Calculation Steps */}
      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[#2A1F45]">
              Deterministic Financial Ratios (FY2022 – FY2024)
            </h2>
            <p className="text-xs text-[#6B5B86]">
              Click any row to open Ratio Detail (`/analysis/ratio/:id`).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Profitability', 'Liquidity', 'Leverage', 'Efficiency'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setRatioCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    ratioCategoryFilter === cat
                      ? 'bg-[#D4FF3F] text-[#2A1F45] border-[1.5px] border-[#2A1F45]'
                      : 'bg-[#E9DDF6] text-[#6B5B86] border border-[#B9A0DA]'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#B9A0DA] font-mono text-[11px] uppercase text-[#6B5B86]">
                <th className="py-3 px-3">Ratio</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Formula</th>
                <th className="py-3 px-3">FY2022</th>
                <th className="py-3 px-3">FY2023</th>
                <th className="py-3 px-3">FY2024</th>
                <th className="py-3 px-3">YoY Change</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9A0DA]/60">
              {filteredRatios.map((r) => (
                <React.Fragment key={r.id}>
                  <tr
                    onClick={() => navigate(`/app/project/${pid}/analysis/ratio/${r.id}`)}
                    className="hover:bg-[#E9DDF6] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-bold text-[#2A1F45]">
                      <div>{r.name}</div>
                      {r.analystCorrectedNote && (
                        <div className="text-[10px] font-mono text-[#B8301F] mt-0.5">
                          {r.analystCorrectedNote}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E9DDF6] border border-[#B9A0DA] font-mono text-[11px] text-[#2A1F45]">
                        {r.category || 'Profitability'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#6B5B86]">{r.formula}</td>
                    <td className="py-3 px-3 font-mono text-[#2A1F45] tabular-nums">
                      {r.fy2022Formatted || '—'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#2A1F45] tabular-nums">
                      {r.fy2023Formatted || (r.priorValue !== null ? `${r.priorValue}${r.unit}` : '—')}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#2A1F45] tabular-nums">
                      {r.formattedValue}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#8A6BC2] font-bold">
                      {r.deltaFormatted}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                  </tr>
                  {showCalcSteps && (
                    <tr className="bg-[#EAF7A8]/70">
                      <td colSpan={8} className="p-3 font-mono text-xs text-[#2A1F45]">
                        <div className="font-bold mb-1">
                          Deterministic Step-by-Step ({r.id}): {r.numeratorLabel} (
                          {r.numeratorValue !== null ? `$${r.numeratorValue}M` : 'N/A'}) ÷{' '}
                          {r.denominatorLabel} (
                          {r.denominatorValue !== null ? `$${r.denominatorValue}M` : 'N/A'})
                        </div>
                        <div className="space-y-0.5 text-[11px]">
                          {(r.stepByStep || []).map((st, idx2) => (
                            <div key={idx2}>• {st}</div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Period Comparison Table with Absolute & Percentage Change + "Not comparable" Warnings */}
      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-[#2A1F45]">
              Multi-Period Statement Comparison & Comparability Checks
            </h2>
            <p className="text-xs text-[#6B5B86]">
              Shows absolute ($) and percentage (%) changes with explicit warnings when periods or
              missing fields are not comparable.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#B9A0DA] font-mono text-[11px] uppercase text-[#6B5B86]">
                <th className="py-3 px-3">Line Item</th>
                <th className="py-3 px-3">FY2022</th>
                <th className="py-3 px-3">FY2023</th>
                <th className="py-3 px-3">FY2024 (Audited)</th>
                <th className="py-3 px-3">Abs Change (24 vs 23)</th>
                <th className="py-3 px-3">% Change (YoY)</th>
                <th className="py-3 px-3">Q4 FY2024 vs Q3 (QoQ)</th>
                <th className="py-3 px-3">Comparability / Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9A0DA]/60 font-mono">
              {[
                {
                  metricId: 'M-REV-2024',
                  label: 'Revenue ($M)',
                  fy22: 410.0,
                  fy23: 468.0,
                  fy24: 540.0,
                  q3: 137.0,
                  q4: 155.0,
                  note: 'Comparable (Audited S1/S3/S4)',
                  warn: false,
                },
                {
                  metricId: 'M-COGS-2024',
                  label: 'Cost of Goods Sold ($M)',
                  fy22: 246.0,
                  fy23: 289.0,
                  fy24: 324.0,
                  q3: 82.5,
                  q4: 92.5,
                  note: 'Comparable (Audited S1/S3)',
                  warn: false,
                },
                {
                  metricId: 'M-NI-2024',
                  label: 'Net Income ($M)',
                  fy22: 38.2,
                  fy23: 47.8,
                  fy24: 59.4,
                  q3: 14.6,
                  q4: 19.3,
                  note: 'Comparable (Audited S1/S3)',
                  warn: false,
                },
                {
                  metricId: 'M-OCF-Q4',
                  label: 'Operating Cash Flow ($M)',
                  fy22: 52.0,
                  fy23: 61.5,
                  fy24: 70.2,
                  q3: 18.0,
                  q4: null,
                  note: 'NOT COMPARABLE in Q4 (Standalone Q4 OCF Missing/Null)',
                  warn: true,
                },
                {
                  metricId: 'M-TA-2024',
                  label: 'Total Assets ($M)',
                  fy22: 520.0,
                  fy23: 585.0,
                  fy24: 668.0,
                  q3: null,
                  q4: 668.0,
                  note: 'NOT COMPARABLE QoQ (Q3 Balance Sheet Condensed)',
                  warn: true,
                },
              ].map((row) => {
                const absYoY = row.fy24 !== null && row.fy23 !== null ? row.fy24 - row.fy23 : null;
                const pctYoY = calcPeriodChange(row.fy24, row.fy23, 'YoY');
                const pctQoQ = calcPeriodChange(row.q4, row.q3, 'QoQ');

                return (
                  <tr
                    key={row.label}
                    onClick={() => navigate(`/app/project/${pid}/analysis/metric/${row.metricId}`)}
                    className="hover:bg-[#E9DDF6] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-sans font-bold text-[#2A1F45]">{row.label}</td>
                    <td className="py-3 px-3 text-[#2A1F45] tabular-nums">${row.fy22.toFixed(1)}M</td>
                    <td className="py-3 px-3 text-[#2A1F45] tabular-nums">${row.fy23.toFixed(1)}M</td>
                    <td className="py-3 px-3 font-bold text-[#2A1F45] tabular-nums">
                      ${row.fy24.toFixed(1)}M
                    </td>
                    <td className="py-3 px-3 text-[#8A6BC2] font-bold tabular-nums">
                      {absYoY !== null ? `${absYoY >= 0 ? '+' : ''}$${absYoY.toFixed(1)}M` : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-[#2A1F45] font-bold tabular-nums">
                      {pctYoY.formatted}
                    </td>
                    <td className="py-3 px-3 tabular-nums">
                      {row.q4 === null || row.q3 === null ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#E34234] text-[#F3EBFA] text-[10px] font-bold">
                          Not comparable (Null)
                        </span>
                      ) : (
                        pctQoQ.formatted
                      )}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      {row.warn ? (
                        <span className="inline-flex items-center gap-1 text-[#B8301F] font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#E34234]" />
                          <span>{row.note}</span>
                        </span>
                      ) : (
                        <span className="text-[#6B5B86]">{row.note}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deterministic Warnings & Arithmetic Guardrails Panel */}
      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-[#2A1F45] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#E34234]" />
          <span>Deterministic Arithmetic & Data-Hygiene Warnings Panel</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-[#E9DDF6] border border-[#E34234] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-[#2A1F45]">
                1. S1 vs S2 Revenue Conflict ($540.0M vs $552.0M)
              </span>
              <ClaimChip claimId="C2" projectId={pid} showStatement={false} />
            </div>
            <p className="text-xs text-[#6B5B86] leading-relaxed">
              Unaudited earnings release S2 reported $552.0M (+18.0% YoY), whereas audited Form 10-K
              S1 p.31 and Q1–Q4 addition ($120M+$128M+$137M+$155M) prove revenue was $540.0M (+15.4%
              YoY). All ratios strictly use audited S1 ($540.0M).
            </p>
          </div>

          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-[#2A1F45]">
                2. Missing Q4 Cash Flow Schedule (Explicit Null)
              </span>
              <MetricChip metricId="M-OCF-Q4" projectId={pid} />
            </div>
            <p className="text-xs text-[#6B5B86] leading-relaxed">
              Standalone Q4 FY2024 operating cash flow is omitted in S1 and S2. The analysis engine
              stores <code className="font-mono font-bold text-[#2A1F45]">null</code> and blocks
              QoQ OCF growth calculation rather than assuming $0.0M or unadjusted subtraction.
            </p>
          </div>

          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-[#2A1F45]">
                3. Division-by-Zero Guard Verification
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono text-[10px] font-bold">
                safeDivide(59.4, 0) → {String(divByZeroGuardCheck.value)}
              </span>
            </div>
            <p className="text-xs text-[#6B5B86] leading-relaxed">
              Live output from <code className="font-mono">safeDivide(59.4, 0)</code>:{' '}
              <span className="font-mono text-[#2A1F45] font-semibold">
                "{divByZeroGuardCheck.error}"
              </span>
              . Prevents <code className="font-mono">Infinity</code> or <code className="font-mono">NaN</code> from corrupting downstream verification.
            </p>
          </div>

          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-[#2A1F45]">
                4. Negative-Value & Sign-Flip Handling Note
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EAF7A8] text-[#2A1F45] border border-[#2A1F45] font-mono text-[10px] font-bold">
                Active Guardrail
              </span>
            </div>
            <p className="text-xs text-[#6B5B86] leading-relaxed">
              In <code className="font-mono">calcROE</code> and{' '}
              <code className="font-mono">calcDebtToEquity</code>, negative shareholders equity
              triggers an automatic warning and returns <code className="font-mono">Not meaningful</code>{' '}
              rather than producing a misleading positive ratio when both net income and equity are
              negative.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 5. METRIC DETAIL (/app/project/:projectId/analysis/metric/:metricId)
 * - Value, unit, period, SourceChip, passage excerpt with page, extraction method
 * - Other sources reporting the same metric (highlighting conflicts such as S1 $540.0M vs S2 $552.0M)
 * - Mini history chart, linked claims & ratios
 * - "Flag this value" and "Add note" actions (audited)
 */
export const MetricDetailPage: React.FC = () => {
  const { projectId, metricId } = useParams<{ projectId: string; metricId: string }>();
  const {
    projects,
    activeProject,
    flagMetricValue,
    addMetricNote,
    openSourceDrawer,
  } = useAppStore();

  const project = projects.find((p) => p.id === projectId) || activeProject;
  const pid = project.id;

  const idx = project.metrics.findIndex((m) => m.id === metricId);
  const metric = idx >= 0 ? project.metrics[idx] : project.metrics[0];
  const prevMetric = idx > 0 ? project.metrics[idx - 1] : null;
  const nextMetric =
    idx >= 0 && idx < project.metrics.length - 1 ? project.metrics[idx + 1] : null;

  const [noteInput, setNoteInput] = useState('');

  // Find source and exact passage excerpt
  const source = project.sources.find((s) => s.id === metric.sourceId);
  const passageInfo = useMemo(() => {
    if (!source) return null;
    for (const pg of source.pages) {
      const found = pg.passages.find((ps) => ps.id === metric.passageId);
      if (found) return { pageNumber: pg.pageNumber, pageTitle: pg.title, passage: found };
    }
    return null;
  }, [source, metric.passageId]);

  const relatedClaims = project.claims.filter((c) => c.relatedMetricIds.includes(metric.id));
  const relatedRatios = project.ratios.filter((r) => r.metricIds.includes(metric.id));
  const relatedRisks = project.risks.filter((rk) => rk.relatedMetricIds.includes(metric.id));

  const historyData = useMemo(() => {
    if (metric.historicalSeries && metric.historicalSeries.length > 0) {
      return metric.historicalSeries;
    }
    return [
      { period: 'Prior', value: metric.priorValue },
      { period: metric.period, value: metric.value },
    ];
  }, [metric]);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo={`/app/project/${pid}/analysis`}
        items={[
          { label: 'Projects', to: '/app/dashboard' },
          { label: project.ticker, to: `/app/project/${pid}` },
          { label: 'Financial Analysis', to: `/app/project/${pid}/analysis` },
          { label: metric.name },
        ]}
      />

      {/* Metric Header */}
      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F]">
                {metric.id}
              </span>
              <StatusBadge status={metric.status} />
              <SyntheticOriginTag origin={project.dataOrigin} />
              {metric.flaggedByAnalyst && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-bold">
                  <Flag className="w-3.5 h-3.5" />
                  <span>Flagged by Analyst</span>
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#2A1F45]">
              {metric.name}
            </h1>
            <p className="text-xs font-mono text-[#6B5B86]">
              Extraction Method:{' '}
              <span className="text-[#2A1F45] font-semibold">
                {metric.extractionMethod || 'Audited Financial Table Parser'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => flagMetricValue(pid, metric.id, !metric.flaggedByAnalyst)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border-[1.5px] transition-colors cursor-pointer ${
                metric.flaggedByAnalyst
                  ? 'bg-[#E34234] text-[#F3EBFA] border-[#2A1F45]'
                  : 'bg-[#E9DDF6] hover:bg-[#E34234] hover:text-[#F3EBFA] text-[#2A1F45] border-[#2A1F45]'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{metric.flaggedByAnalyst ? 'Unflag value' : 'Flag this value'}</span>
            </button>

            {prevMetric && (
              <Link
                to={`/app/project/${pid}/analysis/metric/${prevMetric.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#E9DDF6] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </Link>
            )}
            {nextMetric && (
              <Link
                to={`/app/project/${pid}/analysis/metric/${nextMetric.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#E9DDF6] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45]"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] p-5">
            <div className="text-xs text-[#CBB3E8]">Extracted Value ({metric.period})</div>
            <div className="font-mono text-3xl font-bold text-[#D4FF3F] my-1 tabular-nums">
              {metric.value !== null ? `$${metric.value.toFixed(1)}M` : 'MISSING (Null)'}
            </div>
            <div className="text-xs font-mono text-[#CBB3E8]">{metric.unit}</div>
          </div>

          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5">
            <div className="text-xs text-[#6B5B86]">Prior Period Baseline</div>
            <div className="font-mono text-3xl font-bold text-[#2A1F45] my-1 tabular-nums">
              {metric.priorValue !== null ? `$${metric.priorValue.toFixed(1)}M` : 'N/A'}
            </div>
            <div className="text-xs font-mono text-[#8A6BC2] font-bold">{metric.changeNote}</div>
          </div>

          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-2">
            <div className="text-xs text-[#6B5B86]">Primary Filing Provenance</div>
            <div className="flex flex-wrap gap-2">
              <SourceChip
                sourceId={metric.sourceId}
                projectId={pid}
                pageNumber={passageInfo?.pageNumber}
                highlightPassageId={metric.passageId}
              />
            </div>
            <div className="text-xs font-mono text-[#2A1F45]">
              Page {passageInfo?.pageNumber || 31} · Passage {metric.passageId}
            </div>
          </div>
        </div>

        {/* Exact Passage Excerpt & Mini History Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#2A1F45]">
                Source Passage Excerpt ({metric.sourceId} p.{passageInfo?.pageNumber || 31})
              </h2>
              <button
                type="button"
                onClick={() =>
                  openSourceDrawer(
                    metric.sourceId,
                    pid,
                    passageInfo?.pageNumber || 31,
                    metric.passageId
                  )
                }
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border border-[#2A1F45] cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Inspect in Drawer</span>
              </button>
            </div>
            <div className="rounded-xl bg-[#F3EBFA] border border-[#B9A0DA] p-4 text-xs text-[#2A1F45] leading-relaxed font-serif italic">
              "{passageInfo?.passage.text || metric.explanation}"
            </div>
            <div className="rounded-xl bg-[#EAF7A8] border border-[#2A1F45] p-3 text-xs text-[#2A1F45]">
              <strong>Verification Explanation:</strong> {metric.explanation}
            </div>
          </div>

          {/* Mini History Chart */}
          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">
              Historical Series ({metric.unit})
            </h2>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B9A0DA" />
                  <XAxis dataKey="period" stroke="#2A1F45" tick={{ fill: '#2A1F45', fontSize: 12 }} />
                  <YAxis stroke="#2A1F45" tick={{ fill: '#2A1F45', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2A1F45',
                      borderColor: '#8A6BC2',
                      borderRadius: '12px',
                      color: '#F3EBFA',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name={metric.name}
                    fill="#8A6BC2"
                    stroke="#2A1F45"
                    strokeWidth={1.5}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Cross-Source Comparison (Other Sources Reporting This Metric) */}
        <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#2A1F45]">
            Cross-Source Comparison (Sources Reporting {metric.name})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(metric.alternativeReports && metric.alternativeReports.length > 0
              ? metric.alternativeReports
              : [
                  {
                    sourceId: metric.sourceId,
                    passageId: metric.passageId,
                    pageNumber: passageInfo?.pageNumber || 31,
                    reportedValue: metric.value,
                    formattedValue:
                      metric.value !== null ? `$${metric.value.toFixed(1)}M` : 'MISSING (Null)',
                    status: metric.status,
                    note: metric.explanation,
                  },
                ]
            ).map((rep, i) => (
              <div
                key={i}
                className={`rounded-xl p-4 border-2 space-y-2 ${
                  rep.status === 'Contradicted'
                    ? 'bg-[#F3EBFA] border-[#E34234]'
                    : 'bg-[#F3EBFA] border-[#B9A0DA]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <SourceChip
                    sourceId={rep.sourceId}
                    projectId={pid}
                    pageNumber={rep.pageNumber}
                    highlightPassageId={rep.passageId}
                  />
                  <StatusBadge status={rep.status} size="sm" />
                </div>
                <div className="font-mono text-xl font-bold text-[#2A1F45] tabular-nums">
                  {rep.formattedValue}
                </div>
                <p className="text-xs text-[#6B5B86]">{rep.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Audited Analyst Notes Section */}
        <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#2A1F45]">
            Analyst Audit Notes ({(metric.analystNotes || []).length})
          </h2>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add an audited analyst note to this metric..."
              className="flex-1 min-w-[240px] rounded-full bg-[#F3EBFA] text-[#2A1F45] px-4 py-2 text-xs border border-[#B9A0DA]"
            />
            <button
              type="button"
              onClick={() => {
                if (!noteInput.trim()) return;
                addMetricNote(pid, metric.id, noteInput);
                setNoteInput('');
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45] cursor-pointer"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Add note (Audited)</span>
            </button>
          </div>
          {(metric.analystNotes || []).length > 0 && (
            <div className="space-y-1.5 pt-2">
              {(metric.analystNotes || []).map((n, idx2) => (
                <div
                  key={idx2}
                  className="rounded-xl bg-[#F3EBFA] border border-[#B9A0DA] px-3.5 py-2 text-xs font-mono text-[#2A1F45]"
                >
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked Ratios, Claims & Risks */}
        <div className="pt-3 border-t border-[#B9A0DA] space-y-2">
          <h3 className="font-display text-base font-bold text-[#2A1F45]">
            Linked Ratios, Claims & Risks
          </h3>
          <div className="flex flex-wrap gap-2">
            {relatedRatios.map((r) => (
              <MetricChip key={r.id} ratioId={r.id} projectId={pid} />
            ))}
            {relatedClaims.map((c) => (
              <ClaimChip key={c.id} claimId={c.id} projectId={pid} />
            ))}
            {relatedRisks.map((rk) => (
              <RiskChip key={rk.id} riskId={rk.id} projectId={pid} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 6. RATIO DETAIL (/app/project/:projectId/analysis/ratio/:ratioId)
 * - Readable formula, plain-English explanation, inputs table with source links
 * - Step-by-step calculation with actual numbers, units, assumptions
 * - Results for all periods, trend chart, interpretation limits ("Not an investment rating"), linked claims
 * - "Recalculate" button that re-runs the deterministic function
 */
export const RatioDetailPage: React.FC = () => {
  const { projectId, ratioId } = useParams<{ projectId: string; ratioId: string }>();
  const { projects, activeProject, recalculateRatio } = useAppStore();
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === projectId) || activeProject;
  const pid = project.id;

  const idx = project.ratios.findIndex((r) => r.id === ratioId);
  const ratio = idx >= 0 ? project.ratios[idx] : project.ratios[0];
  const prevRatio = idx > 0 ? project.ratios[idx - 1] : null;
  const nextRatio =
    idx >= 0 && idx < project.ratios.length - 1 ? project.ratios[idx + 1] : null;

  const relatedClaims = project.claims.filter(
    (c) =>
      c.relatedRatioIds.includes(ratio.id) || (ratio.linkedClaimIds || []).includes(c.id)
  );
  const inputMetrics = project.metrics.filter((m) => ratio.metricIds.includes(m.id));

  const periodSeries = useMemo(() => {
    if (ratio.periodHistory && ratio.periodHistory.length > 0) {
      return ratio.periodHistory;
    }
    return [
      {
        period: 'FY2022',
        value: ratio.fy2022Value ?? null,
        formatted: ratio.fy2022Formatted || '—',
        numerator: null,
        denominator: null,
      },
      {
        period: 'FY2023',
        value: ratio.priorValue,
        formatted: ratio.fy2023Formatted || `${ratio.priorValue ?? '—'}${ratio.unit}`,
        numerator: null,
        denominator: null,
      },
      {
        period: 'FY2024',
        value: ratio.value,
        formatted: ratio.formattedValue,
        numerator: ratio.numeratorValue,
        denominator: ratio.denominatorValue,
      },
    ];
  }, [ratio]);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo={`/app/project/${pid}/analysis`}
        items={[
          { label: 'Projects', to: '/app/dashboard' },
          { label: project.ticker, to: `/app/project/${pid}` },
          { label: 'Financial Analysis', to: `/app/project/${pid}/analysis` },
          { label: ratio.name },
        ]}
      />

      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F]">
                {ratio.id} · {ratio.category || 'Profitability'}
              </span>
              <StatusBadge status={ratio.status} />
              <SyntheticOriginTag origin={project.dataOrigin} />
              <span className="px-3 py-1 rounded-full bg-[#E9DDF6] border border-[#2A1F45] font-mono text-xs font-bold text-[#2A1F45]">
                Not an investment rating
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#2A1F45]">
              {ratio.name} ({ratio.period})
            </h1>
            <p className="text-sm text-[#6B5B86]">
              {ratio.plainEnglishExplanation || ratio.interpretation}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => recalculateRatio(pid, ratio.id)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recalculate (Deterministic)</span>
            </button>

            {prevRatio && (
              <Link
                to={`/app/project/${pid}/analysis/ratio/${prevRatio.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#E9DDF6] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </Link>
            )}
            {nextRatio && (
              <Link
                to={`/app/project/${pid}/analysis/ratio/${nextRatio.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#E9DDF6] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45]"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Readable Formula & Key Output Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-[#2A1F45] text-[#F3EBFA] p-5">
            <div className="text-xs text-[#CBB3E8]">Deterministic Result ({ratio.period})</div>
            <div className="font-mono text-3xl font-bold text-[#D4FF3F] my-1 tabular-nums">
              {ratio.formattedValue}
            </div>
            <div className="text-xs font-mono text-[#F3EBFA]">{ratio.deltaFormatted}</div>
            {ratio.lastRecalculatedAt && (
              <div className="text-[10px] font-mono text-[#D4FF3F] mt-1">
                Verified at {new Date(ratio.lastRecalculatedAt).toLocaleTimeString()}
              </div>
            )}
          </div>

          <div className="md:col-span-2 rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 flex flex-col justify-between space-y-2">
            <div className="text-xs font-mono uppercase text-[#6B5B86]">Readable Formula</div>
            <div className="font-mono text-lg md:text-xl font-bold text-[#2A1F45]">
              {ratio.name} = {ratio.formula}
            </div>
            <div className="text-xs text-[#2A1F45]">
              <strong>Substitution ({ratio.period}):</strong> {ratio.numeratorLabel} (
              <span className="font-mono font-bold">
                ${ratio.numeratorValue?.toFixed(1) ?? 'N/A'}M
              </span>
              ) ÷ {ratio.denominatorLabel} (
              <span className="font-mono font-bold">
                ${ratio.denominatorValue?.toFixed(1) ?? 'N/A'}M
              </span>
              ) = <span className="font-mono font-bold">{ratio.formattedValue}</span>
            </div>
          </div>
        </div>

        {/* Inputs Table & Step-by-Step Calculation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs Table with Source Links */}
          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">
              Audited Input Metrics & Source Provenance
            </h2>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#B9A0DA] font-mono text-[11px] uppercase text-[#6B5B86]">
                  <th className="py-2 px-2">Input Metric</th>
                  <th className="py-2 px-2">Value</th>
                  <th className="py-2 px-2">Unit</th>
                  <th className="py-2 px-2">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9A0DA]/50">
                {inputMetrics.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => navigate(`/app/project/${pid}/analysis/metric/${m.id}`)}
                    className="hover:bg-[#F3EBFA] cursor-pointer"
                  >
                    <td className="py-2.5 px-2 font-bold text-[#2A1F45]">{m.name}</td>
                    <td className="py-2.5 px-2 font-mono font-bold text-[#2A1F45] tabular-nums">
                      {m.value !== null ? `$${m.value.toFixed(1)}M` : 'Null'}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[#6B5B86]">{m.unit}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Step-by-Step Calculation & Assumptions */}
          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">
              Step-by-Step Deterministic Execution
            </h2>
            <div className="rounded-xl bg-[#2A1F45] text-[#F3EBFA] p-4 font-mono text-xs space-y-1.5">
              {(ratio.stepByStep || [
                `Step 1: Numerator (${ratio.numeratorLabel}) = $${ratio.numeratorValue}M`,
                `Step 2: Denominator (${ratio.denominatorLabel}) = $${ratio.denominatorValue}M`,
                `Step 3: Result = ${ratio.formattedValue}`,
              ]).map((step, i) => (
                <div key={i} className="text-[#D4FF3F]">
                  {step}
                </div>
              ))}
            </div>
            <div className="space-y-1 text-xs text-[#2A1F45]">
              <div className="font-bold">Assumptions & Units:</div>
              {(ratio.assumptions || ['Inputs in USD Millions; output in ' + ratio.unit]).map(
                (asmp, i) => (
                  <div key={i} className="text-[#6B5B86]">
                    • {asmp}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Multi-Period Results Table & Trend Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">
              Results Across All Periods (FY2022 – FY2024)
            </h2>
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-[#B9A0DA] text-[11px] uppercase text-[#6B5B86]">
                  <th className="py-2 px-2">Period</th>
                  <th className="py-2 px-2">Numerator ($M)</th>
                  <th className="py-2 px-2">Denominator ($M)</th>
                  <th className="py-2 px-2">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9A0DA]/50">
                {periodSeries.map((ps) => (
                  <tr key={ps.period}>
                    <td className="py-2.5 px-2 font-bold text-[#2A1F45]">{ps.period}</td>
                    <td className="py-2.5 px-2 text-[#6B5B86]">
                      {ps.numerator !== null ? `$${ps.numerator.toFixed(1)}M` : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-[#6B5B86]">
                      {ps.denominator !== null ? `$${ps.denominator.toFixed(1)}M` : '—'}
                    </td>
                    <td className="py-2.5 px-2 font-bold text-[#2A1F45]">{ps.formatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">
              Multi-Year Ratio Trend ({ratio.unit})
            </h2>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={periodSeries.filter((p) => p.value !== null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B9A0DA" />
                  <XAxis dataKey="period" stroke="#2A1F45" tick={{ fill: '#2A1F45', fontSize: 12 }} />
                  <YAxis stroke="#2A1F45" tick={{ fill: '#2A1F45', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2A1F45',
                      borderColor: '#8A6BC2',
                      borderRadius: '12px',
                      color: '#F3EBFA',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={ratio.name}
                    stroke="#2A1F45"
                    strokeWidth={3}
                    dot={{ r: 6, fill: '#D4FF3F', stroke: '#2A1F45', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Interpretation Limits & Linked Claims */}
        <div className="rounded-xl bg-[#EAF7A8] border border-[#2A1F45] p-4 text-xs text-[#2A1F45] space-y-1">
          <div className="font-bold">Interpretation Limits (Decision Support Boundary):</div>
          <p>
            {ratio.interpretationLimits ||
              'Not an investment rating. Deterministic financial ratios summarize historical accounting data and must be reviewed alongside risk disclosures.'}
          </p>
        </div>

        <div className="pt-3 border-t border-[#B9A0DA] space-y-2">
          <h3 className="font-display text-base font-bold text-[#2A1F45]">
            Linked Claims, Metrics & Sources
          </h3>
          <div className="flex flex-wrap gap-2">
            {ratio.metricIds.map((mid) => (
              <MetricChip key={mid} metricId={mid} projectId={pid} />
            ))}
            {ratio.sourceIds.map((sid) => (
              <SourceChip key={sid} sourceId={sid} projectId={pid} />
            ))}
            {relatedClaims.map((c) => (
              <ClaimChip key={c.id} claimId={c.id} projectId={pid} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
