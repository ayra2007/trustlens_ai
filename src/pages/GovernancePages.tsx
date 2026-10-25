import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  Breadcrumbs,
  StatusBadge,
  SyntheticOriginTag,
  MetricChip,
  SourceChip,
  ClaimChip,
  RiskChip,
} from '../components/ui/primitives';
import { runDeterministicUnitTests } from '../lib/calculations';
import { DEFAULT_PROJECT_ID } from '../data/seed';

/**
 * 1. AUDIT LOG PAGE (/app/audit)
 */
export const AuditPage: React.FC = () => {
  const { auditEntries } = useAppStore();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo="/app/dashboard"
        items={[
          { label: 'Dashboard', to: '/app/dashboard' },
          { label: 'Immutable Audit Trail' },
        ]}
      />

      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#2A1F45]">
              Workspace Audit Log ({auditEntries.length} Recorded Events)
            </h1>
            <p className="text-xs text-[#6B5B86]">
              Every user action, source inspection, pipeline execution, and reviewer decision is logged with actor attribution and target links.
            </p>
          </div>
          <SyntheticOriginTag origin="SYNTHETIC — FICTIONAL" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#B9A0DA] text-[#6B5B86]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor & Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9A0DA]">
              {auditEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#E9DDF6] transition-colors">
                  <td className="py-3 px-3 font-mono text-[#6B5B86] whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-[#2A1F45]">{entry.actor}</span>{' '}
                    <span className="font-mono text-[11px] text-[#8A6BC2]">
                      ({entry.actorRole})
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-[#2A1F45]">{entry.action}</td>
                  <td className="py-3 px-3">
                    <Link
                      to={entry.targetRoute}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EAF7A8] text-[#2A1F45] font-mono font-semibold hover:bg-[#D4FF3F] border border-[#2A1F45]"
                    >
                      <span>{entry.targetLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-[#6B5B86]">{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. WATCHLIST PAGE (/app/watchlist)
 */
export const WatchlistPage: React.FC = () => {
  const { watchlist, activeProject } = useAppStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo="/app/dashboard"
        items={[
          { label: 'Dashboard', to: '/app/dashboard' },
          { label: 'Watchlist & Threshold Alerts' },
        ]}
      />

      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#2A1F45]">
              Monitored Entities & Discrepancy Alerts
            </h1>
            <p className="text-xs text-[#6B5B86]">
              Click any alert row to open the linked ratio or claim verification screen.
            </p>
          </div>
          <SyntheticOriginTag origin={activeProject.dataOrigin} />
        </div>

        <div className="space-y-3">
          {watchlist.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.targetRoute)}
              className="rounded-2xl bg-[#E9DDF6] hover:bg-[#EAF7A8] border border-[#B9A0DA] p-5 space-y-2 cursor-pointer transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F]">
                  {item.companyName} ({item.ticker}) · {item.severity}
                </span>
                <SyntheticOriginTag origin={item.dataOrigin} />
              </div>
              <h2 className="font-display text-lg font-bold text-[#2A1F45]">{item.alertHeadline}</h2>
              <p className="text-xs text-[#6B5B86]">{item.alertDetail}</p>
              <div className="flex flex-wrap gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                {item.trackedRatioIds.map((rid) => (
                  <MetricChip key={rid} ratioId={rid} projectId={item.projectId} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 3. COMPARE PAGE (/app/compare)
 */
export const ComparePage: React.FC = () => {
  const { activeProject } = useAppStore();
  const pid = activeProject.id;
  const annuals = activeProject.financials.filter((f) => f.periodType === 'Annual');

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo="/app/dashboard"
        items={[
          { label: 'Dashboard', to: '/app/dashboard' },
          { label: 'Multi-Period & Project Comparison Mode' },
        ]}
      />

      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#2A1F45]">
              Historical Period Comparison — {activeProject.companyName} ({activeProject.ticker})
            </h1>
            <p className="text-xs text-[#6B5B86]">
              Side-by-side comparison of audited FY2022, FY2023, and FY2024 figures (USD Millions).
            </p>
          </div>
          <SyntheticOriginTag origin={activeProject.dataOrigin} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#B9A0DA] text-[#6B5B86]">
                <th className="py-2.5 px-3">Financial Line Item</th>
                {annuals.map((a) => (
                  <th key={a.period} className="py-2.5 px-3 text-right font-mono">
                    {a.period}
                  </th>
                ))}
                <th className="py-2.5 px-3">Linked Metric</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9A0DA]">
              {[
                { label: 'Revenue', key: 'revenue', metricId: 'M-REV-2024' },
                { label: 'Cost of Goods Sold (COGS)', key: 'cogs', metricId: 'M-COGS-2024' },
                { label: 'Net Income', key: 'netIncome', metricId: 'M-NI-2024' },
                { label: 'Current Assets', key: 'currentAssets', metricId: 'M-CA-2024' },
                { label: 'Total Assets', key: 'totalAssets', metricId: 'M-TA-2024' },
                { label: 'Current Liabilities', key: 'currentLiabilities', metricId: 'M-CL-2024' },
                { label: 'Total Liabilities', key: 'totalLiabilities', metricId: 'M-TL-2024' },
                { label: 'Shareholders Equity', key: 'equity', metricId: 'M-EQ-2024' },
                { label: 'Operating Cash Flow', key: 'operatingCashFlow', metricId: 'M-OCF-2024' },
                { label: 'Capital Expenditures', key: 'capex', metricId: 'M-CAPEX-2024' },
              ].map((row) => (
                <tr key={row.key} className="hover:bg-[#E9DDF6]">
                  <td className="py-3 px-3 font-bold text-[#2A1F45]">{row.label}</td>
                  {annuals.map((a) => {
                    const val = a[row.key as keyof typeof a] as number | null;
                    return (
                      <td
                        key={a.period}
                        className="py-3 px-3 text-right font-mono font-semibold text-[#2A1F45] tabular-nums"
                      >
                        {val !== null ? `$${val.toFixed(1)}M` : 'N/A'}
                      </td>
                    );
                  })}
                  <td className="py-3 px-3">
                    <MetricChip metricId={row.metricId} projectId={pid} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * 4. RESOURCES & TRUST GOVERNANCE PAGE (/app/resources)
 */
export const ResourcesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo="/app/dashboard"
        items={[
          { label: 'Dashboard', to: '/app/dashboard' },
          { label: 'Trust & Responsible AI Resources' },
        ]}
      />

      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#2A1F45]">
              Trust & Responsible Financial AI Standards
            </h1>
            <p className="text-sm text-[#6B5B86]">
              Governance principles, deterministic safeguards, and external benchmarks (SEC EDGAR, FinQA, NIST AI RMF).
            </p>
          </div>
          <SyntheticOriginTag origin="SYNTHETIC — FICTIONAL" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              id: 'evidence-backed',
              title: '1. Evidence-Backed Claims',
              text: 'Every claim is cross-checked against primary filing passages and deterministic sums. See Claim C1 ($540.0M Verified) vs Claim C2 ($552.0M Contradicted).',
            },
            {
              id: 'transparent-uncertainty',
              title: '2. Transparent Uncertainty',
              text: 'When a figure is unreported—such as Aurora Q4 FY2024 Operating Cash Flow—it is stored as explicit null and flagged in Risk R4.',
            },
            {
              id: 'traceable-sources',
              title: '3. Page-Level Traceable Sources',
              text: 'Every SourceChip opens the Source Drawer with publication date, staleness status (S5 flagged stale), and highlighted passage links.',
            },
            {
              id: 'human-review',
              title: '4. Mandatory Human Review',
              text: 'Dossiers remain in "Needs Review" until an Analyst or Reviewer explicitly signs off on claims and reports.',
            },
            {
              id: 'no-autonomous-trades',
              title: '5. No Autonomous Trades or Ratings',
              text: 'TrustLens is strictly a decision-support verification tool. It never outputs buy/sell ratings or executes trades.',
            },
            {
              id: 'prompt-injection-guard',
              title: '6. Prompt-Injection Guard',
              text: 'Adversarial instructions embedded in documents (illustrated in Source S7 p.1) are quarantined and treated strictly as untrusted data.',
            },
          ].map((sec) => (
            <div
              key={sec.id}
              id={sec.id}
              className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-2"
            >
              <h2 className="font-display text-lg font-bold text-[#2A1F45]">{sec.title}</h2>
              <p className="text-xs text-[#6B5B86] leading-relaxed">{sec.text}</p>
              <div className="pt-2 flex flex-wrap gap-2">
                <SourceChip sourceId="S1" projectId={DEFAULT_PROJECT_ID} pageNumber={31} />
                <ClaimChip claimId="C2" projectId={DEFAULT_PROJECT_ID} />
                <RiskChip riskId="R1" projectId={DEFAULT_PROJECT_ID} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 5. EVALUATION & UNIT TESTS PAGE (/app/evaluation)
 */
export const EvaluationPage: React.FC = () => {
  const unitTests = runDeterministicUnitTests();
  const passedCount = unitTests.filter((t) => t.passed).length;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo="/app/dashboard"
        items={[
          { label: 'Dashboard', to: '/app/dashboard' },
          { label: 'Deterministic Calculation Unit Tests & System Evaluation' },
        ]}
      />

      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#2A1F45]">
              Deterministic Ratio Library Unit Tests ({passedCount}/{unitTests.length} Passing)
            </h1>
            <p className="text-xs text-[#6B5B86]">
              Live execution of pure calculation unit tests in <span className="font-mono">src/lib/calculations/index.ts</span> including null, zero, and negative equity guards.
            </p>
          </div>
          <StatusBadge status="Verified" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#B9A0DA] text-[#6B5B86]">
                <th className="py-2.5 px-3">Test ID</th>
                <th className="py-2.5 px-3">Test Case Description</th>
                <th className="py-2.5 px-3 font-mono">Expected</th>
                <th className="py-2.5 px-3 font-mono">Actual Output</th>
                <th className="py-2.5 px-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9A0DA]">
              {unitTests.map((t) => (
                <tr key={t.id} className="hover:bg-[#E9DDF6]">
                  <td className="py-3 px-3 font-mono font-bold text-[#8A6BC2]">{t.id}</td>
                  <td className="py-3 px-3 font-bold text-[#2A1F45]">{t.name}</td>
                  <td className="py-3 px-3 font-mono text-[#6B5B86]">{t.expected}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#2A1F45]">{t.actual}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={t.passed ? 'Verified' : 'Failed'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * 6. GUIDED WALKTHROUGH PAGE (/app/walkthrough)
 */
export const WalkthroughPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo="/app/dashboard"
        items={[
          { label: 'Dashboard', to: '/app/dashboard' },
          { label: 'Guided Verification Walkthrough' },
        ]}
      />

      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#2A1F45]">
          Interactive Verification Walkthrough — Aurora Dynamics (AURD)
        </h1>
        <div className="space-y-3">
          {[
            {
              step: 'Step 1: Inspect the $12.0M Revenue Contradiction (S1 vs S2)',
              desc: 'Open Claim C2 to see how S2 preliminary release ($552.0M) is contradicted by audited S1 p.31 ($540.0M) and the Q1–Q4 sum.',
              to: `/app/project/${DEFAULT_PROJECT_ID}/verification/claim/C2`,
            },
            {
              step: 'Step 2: Verify Deterministic Ratios & Null Q4 Cash Flow',
              desc: 'Open Financial Analysis to inspect Net Margin (11.0%), Current Ratio (1.67x), and explicit null handling on Q4 OCF.',
              to: `/app/project/${DEFAULT_PROJECT_ID}/analysis`,
            },
            {
              step: 'Step 3: Inspect Source Provenance & Prompt-Injection Quarantine',
              desc: 'Open Source S7 in the Document Viewer to see how the adversarial instruction string on Page 1 was quarantined.',
              to: `/app/project/${DEFAULT_PROJECT_ID}/sources/S7?page=1&highlight=S7-P1`,
            },
            {
              step: 'Step 4: Attest Dossier in Human Review Gate',
              desc: 'Open the Research Report and record a human reviewer attestation in the immutable Audit Trail.',
              to: `/app/project/${DEFAULT_PROJECT_ID}/report`,
            },
          ].map((item) => (
            <Link
              key={item.step}
              to={item.to}
              className="block rounded-xl bg-[#E9DDF6] hover:bg-[#EAF7A8] border border-[#B9A0DA] p-4 transition-colors"
            >
              <div className="font-display text-base font-bold text-[#2A1F45]">{item.step}</div>
              <div className="text-xs text-[#6B5B86] mt-1">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 7. SETTINGS PAGE (/app/settings)
 */
export const SettingsPage: React.FC = () => {
  const { user, isCloudConnected, loginAsAnalyst, signInWithGoogle, resetStoreToSeed } = useAppStore();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo="/app/dashboard"
        items={[
          { label: 'Dashboard', to: '/app/dashboard' },
          { label: 'Workspace & Governance Settings' },
        ]}
      />

      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2A1F45]">Workspace Settings</h1>
          <p className="text-xs text-[#6B5B86]">
            Manage Cloud Firestore database synchronization, active human review role, and baseline dataset restoration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">Active Governance Role &amp; Cloud Sync</h2>
            <p className="text-xs text-[#6B5B86]">
              Current User: <strong>{user?.name || 'Analyst'}</strong> ({user?.role || 'Analyst'}) ·{' '}
              <strong>{isCloudConnected ? 'Synced to Cloud Firestore' : 'Workspace Session Active'}</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loginAsAnalyst('Analyst')}
                className="px-4 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45] cursor-pointer"
              >
                Switch to Analyst
              </button>
              <button
                type="button"
                onClick={() => loginAsAnalyst('Reviewer')}
                className="px-4 py-2 rounded-full bg-[#8A6BC2] text-[#F3EBFA] text-xs font-bold border-[1.5px] border-[#2A1F45] cursor-pointer"
              >
                Switch to Reviewer (CFA)
              </button>
              {!isCloudConnected && (
                <button
                  type="button"
                  onClick={() => signInWithGoogle(user?.role || 'Analyst')}
                  className="px-4 py-2 rounded-full bg-[#2A1F45] text-[#D4FF3F] text-xs font-bold border-[1.5px] border-[#2A1F45] cursor-pointer"
                >
                  Connect Google Cloud DB
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">Reset Persisted Store</h2>
            <p className="text-xs text-[#6B5B86]">
              Restore the default Aurora Dynamics (AURD) synthetic baseline dataset, claims, risks, and initial audit log.
            </p>
            <button
              type="button"
              onClick={resetStoreToSeed}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E34234] hover:bg-[#B8301F] text-[#F3EBFA] text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Workspace to Baseline Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
