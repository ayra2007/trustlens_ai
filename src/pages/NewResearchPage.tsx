import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  Upload,
  Trash2,
  Eye,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Globe,
  Database,
  Play,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  Breadcrumbs,
  StatusBadge,
  SyntheticOriginTag,
  Modal,
} from '../components/ui/primitives';
import { buildAuroraSources, DEFAULT_PROJECT_ID } from '../data/seed';
import { DataOrigin, Source } from '../types';

const COMPANY_SUGGESTIONS = [
  {
    name: 'Aurora Dynamics Ltd.',
    ticker: 'AURD',
    sector: 'Industrial Technology',
    origin: 'SYNTHETIC — FICTIONAL' as DataOrigin,
  },
  {
    name: 'Rockwell Automation, Inc.',
    ticker: 'ROK',
    sector: 'Industrial Automation',
    origin: 'SEC EDGAR METADATA' as DataOrigin,
  },
  {
    name: 'Cognex Corporation',
    ticker: 'CGNX',
    sector: 'Machine Vision & Robotics',
    origin: 'SEC EDGAR METADATA' as DataOrigin,
  },
  {
    name: 'NVIDIA Corporation',
    ticker: 'NVDA',
    sector: 'Semiconductors & Compute',
    origin: 'SEC EDGAR METADATA' as DataOrigin,
  },
];

const AVAILABLE_PERIODS = [
  { id: 'FY2022', type: 'Annual' },
  { id: 'FY2023', type: 'Annual' },
  { id: 'FY2024', type: 'Annual' },
  { id: 'Q1 FY2024', type: 'Quarterly' },
  { id: 'Q2 FY2024', type: 'Quarterly' },
  { id: 'Q3 FY2024', type: 'Quarterly' },
  { id: 'Q4 FY2024', type: 'Quarterly' },
];

export const NewResearchPage: React.FC = () => {
  const { createProject, triggerPipelineRun, openSourceDrawer } = useAppStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [companyName, setCompanyName] = useState('Aurora Dynamics Ltd.');
  const [ticker, setTicker] = useState('AURD');
  const [sector, setSector] = useState('Industrial Technology');
  const [dataOrigin, setDataOrigin] = useState<DataOrigin>('SYNTHETIC — FICTIONAL');

  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([
    'FY2022',
    'FY2023',
    'FY2024',
    'Q1 FY2024',
    'Q2 FY2024',
    'Q3 FY2024',
    'Q4 FY2024',
  ]);

  const [sourceTab, setSourceTab] = useState<'synthetic' | 'upload' | 'edgar'>('synthetic');
  const [sourcesList, setSourcesList] = useState<Source[]>(() =>
    buildAuroraSources(DEFAULT_PROJECT_ID)
  );
  const [previewSource, setPreviewSource] = useState<Source | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [edgarCikOrTicker, setEdgarCikOrTicker] = useState('0000320193');
  const [edgarStatus, setEdgarStatus] = useState<'idle' | 'loading' | 'success' | 'blocked'>('idle');
  const [edgarMessage, setEdgarMessage] = useState<string>('');

  const hasAnnual = selectedPeriods.some((p) => p.startsWith('FY'));
  const hasQuarterly = selectedPeriods.some((p) => p.startsWith('Q'));
  const isMixingPeriods = hasAnnual && hasQuarterly;

  const togglePeriod = (periodId: string) => {
    setSelectedPeriods((prev) =>
      prev.includes(periodId) ? prev.filter((p) => p !== periodId) : [...prev, periodId]
    );
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const validExts = ['pdf', 'csv', 'txt', 'md', 'json'];
      if (!validExts.includes(ext)) {
        setUploadError(
          `Unsupported file type (.${ext}) for "${file.name}". Only PDF, CSV, TXT, MD, or JSON files are accepted.`
        );
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds 10MB maximum upload limit.`);
        return;
      }

      const newSourceId = `U-${sourcesList.length + 1}`;
      const queuedSource: Source = {
        id: newSourceId,
        projectId: DEFAULT_PROJECT_ID,
        title: file.name,
        type: 'Uploaded Document',
        originLabel: 'USER UPLOADED',
        publicationDate: null,
        reportingPeriodEnd: '2024-12-31',
        isStale: false,
        missingDateFlag: true,
        pageCount: 1,
        uploadStatus: 'Queued',
        fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
        pages: [
          {
            pageNumber: 1,
            title: `Uploaded Content — ${file.name}`,
            content: 'Processing uploaded file...',
            passages: [
              {
                id: `${newSourceId}-P1`,
                pageNumber: 1,
                sectionTitle: 'Extracted Passage Preview',
                text: `Uploaded document "${file.name}" (${Math.max(1, Math.round(file.size / 1024))} KB). Enter publication date to clear provenance warning.`,
              },
            ],
          },
        ],
      };

      setSourcesList((prev) => [queuedSource, ...prev]);

      setTimeout(() => {
        setSourcesList((prev) =>
          prev.map((s) => (s.id === newSourceId ? { ...s, uploadStatus: 'Reading' } : s))
        );
      }, 300);

      const reader = new FileReader();
      reader.onload = () => {
        const textContent =
          typeof reader.result === 'string' && reader.result.trim().length > 0
            ? reader.result.slice(0, 600)
            : `Extracted structured text from ${file.name}. Ready for passage indexing.`;

        setTimeout(() => {
          setSourcesList((prev) =>
            prev.map((s) =>
              s.id === newSourceId
                ? {
                    ...s,
                    uploadStatus: 'Extracted',
                    pages: [
                      {
                        pageNumber: 1,
                        title: `Uploaded File: ${file.name}`,
                        content: `USER UPLOADED DOCUMENT (${file.name})`,
                        passages: [
                          {
                            id: `${newSourceId}-P1`,
                            pageNumber: 1,
                            sectionTitle: 'Primary Uploaded Excerpt',
                            text: textContent,
                          },
                        ],
                      },
                    ],
                  }
                : s
            )
          );
        }, 700);
      };
      reader.onerror = () => {
        setSourcesList((prev) =>
          prev.map((s) => (s.id === newSourceId ? { ...s, uploadStatus: 'Unreadable' } : s))
        );
      };
      reader.readAsText(file);
    });
  };

  const handleUpdateSourceDate = (sourceId: string, newDate: string) => {
    setSourcesList((prev) =>
      prev.map((s) =>
        s.id === sourceId
          ? {
              ...s,
              publicationDate: newDate || null,
              missingDateFlag: !newDate,
            }
          : s
      )
    );
  };

  const handleAttemptEdgarFetch = async () => {
    setEdgarStatus('loading');
    setEdgarMessage('Attempting live browser fetch from data.sec.gov/submissions...');
    try {
      const paddedCik = edgarCikOrTicker.replace(/\D/g, '').padStart(10, '0') || '0000320193';
      const response = await fetch(`https://data.sec.gov/submissions/CIK${paddedCik}.json`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const entityName = data?.name || `CIK ${paddedCik}`;
      const newSecSource: Source = {
        id: `SEC-${sourcesList.length + 1}`,
        projectId: DEFAULT_PROJECT_ID,
        title: `${entityName} — SEC EDGAR Live Metadata Submission`,
        type: 'SEC Filing',
        originLabel: 'SEC EDGAR METADATA',
        publicationDate: new Date().toISOString().slice(0, 10),
        reportingPeriodEnd: '2024-12-31',
        isStale: false,
        pageCount: 1,
        pages: [
          {
            pageNumber: 1,
            title: 'SEC EDGAR Submissions Header',
            content: `Live SEC EDGAR metadata retrieved for ${entityName} (CIK ${paddedCik}).`,
            passages: [
              {
                id: `SEC-P1`,
                pageNumber: 1,
                sectionTitle: 'EDGAR Filing Index Metadata',
                text: `Verified live SEC EDGAR registrant ${entityName} (SIC: ${data?.sic || 'N/A'}).`,
              },
            ],
          },
        ],
      };
      setSourcesList((prev) => [newSecSource, ...prev]);
      setEdgarStatus('success');
      setEdgarMessage(`Retrieved live metadata for ${entityName}.`);
    } catch {
      setEdgarStatus('blocked');
      setEdgarMessage(
        'Browser fetch to data.sec.gov was blocked by SEC CORS / User-Agent browser restrictions. Per TrustLens integrity policy, zero fake SEC filings were generated. Use the Synthetic Reference dataset (Aurora S1–S7) or Upload Documents tab to proceed.'
      );
    }
  };

  const handleStartResearch = () => {
    const created = createProject({
      companyName: companyName.trim() || 'Aurora Dynamics Ltd.',
      ticker: ticker.trim() || 'AURD',
      sector: sector.trim() || 'Industrial Technology',
      dataOrigin,
      periods: selectedPeriods,
      customSources: sourcesList,
    });
    navigate(`/app/project/${created.id}/pipeline`);
    setTimeout(() => {
      triggerPipelineRun(created.id);
    }, 250);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo="/app/dashboard"
        items={[
          { label: 'Dashboard', to: '/app/dashboard' },
          { label: 'New Multi-Agent Research Wizard' },
        ]}
      />

      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#B9A0DA] pb-5">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#2A1F45]">
              Configure New Research Dossier
            </h1>
            <p className="text-sm text-[#6B5B86]">
              Set up company identifiers, reporting periods, and provenance-verified source documents.
            </p>
          </div>
          <SyntheticOriginTag origin={dataOrigin} />
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { num: 1, title: '1. Company & Ticker' },
            { num: 2, title: '2. Reporting Periods' },
            { num: 3, title: '3. Source Documents' },
            { num: 4, title: '4. Review & Start' },
          ].map((s) => {
            const active = step === s.num;
            const done = step > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num as 1 | 2 | 3 | 4)}
                className={`px-4 py-3 rounded-full border-[1.5px] text-left transition-all cursor-pointer flex items-center justify-between ${
                  active
                    ? 'bg-[#D4FF3F] text-[#2A1F45] border-[#2A1F45] font-bold'
                    : done
                    ? 'bg-[#EAF7A8] text-[#2A1F45] border-[#2A1F45] font-semibold'
                    : 'bg-[#E9DDF6] text-[#6B5B86] border-[#B9A0DA]'
                }`}
              >
                <span className="text-xs">{s.title}</span>
                {done && <CheckCircle2 className="w-4 h-4 text-[#2A1F45] shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* STEP 1: COMPANY */}
        {step === 1 && (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#2A1F45] mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] px-3.5 py-2.5 text-sm font-semibold text-[#2A1F45]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2A1F45] mb-1">
                  Ticker Symbol
                </label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  className="w-full rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] px-3.5 py-2.5 text-sm font-mono font-bold text-[#2A1F45]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2A1F45] mb-1">
                  Sector Classification
                </label>
                <input
                  type="text"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] px-3.5 py-2.5 text-sm text-[#2A1F45]"
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-[#6B5B86] mb-2">
                Quick-Select Entity Suggestions (Synthetic Reference + Public Tickers)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {COMPANY_SUGGESTIONS.map((item) => (
                  <button
                    key={item.ticker}
                    type="button"
                    onClick={() => {
                      setCompanyName(item.name);
                      setTicker(item.ticker);
                      setSector(item.sector);
                      setDataOrigin(item.origin);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      ticker === item.ticker
                        ? 'bg-[#EAF7A8] border-[#2A1F45]'
                        : 'bg-[#E9DDF6] hover:bg-[#CBB3E8] border-[#B9A0DA]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-sm text-[#2A1F45]">
                        {item.ticker}
                      </span>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#2A1F45] text-[#D4FF3F]">
                        {item.origin === 'SYNTHETIC — FICTIONAL' ? 'SYNTHETIC' : 'REAL TICKER'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#2A1F45] truncate">{item.name}</div>
                    <div className="text-[11px] text-[#6B5B86]">{item.sector}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PERIODS */}
        {step === 2 && (
          <div className="space-y-5 pt-2">
            <div>
              <h2 className="font-display text-xl font-bold text-[#2A1F45]">
                Select Reporting Periods for Deterministic Analysis
              </h2>
              <p className="text-xs text-[#6B5B86]">
                Toggle fiscal years and interim quarters to include in ratio calculations and cross-period sums.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {AVAILABLE_PERIODS.map((p) => {
                const selected = selectedPeriods.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePeriod(p.id)}
                    className={`px-4 py-2 rounded-full font-mono text-xs font-bold border-[1.5px] transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#D4FF3F] text-[#2A1F45] border-[#2A1F45]'
                        : 'bg-[#E9DDF6] text-[#6B5B86] border-[#B9A0DA] hover:text-[#2A1F45]'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}
                    {p.id} ({p.type})
                  </button>
                );
              })}
            </div>

            {isMixingPeriods && (
              <div className="rounded-2xl bg-[#EAF7A8] border border-[#8A6BC2] p-4 flex items-start gap-3 text-xs text-[#2A1F45]">
                <AlertTriangle className="w-5 h-5 text-[#8A6BC2] shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">
                    Period Mixing Notice (Annual + Quarterly Selected)
                  </strong>
                  <span>
                    You have selected both Annual (FY) and Quarterly (Q1–Q4) periods. The Deterministic Analysis Agent will separate YoY annual comparisons from QoQ quarterly series and cross-check that Q1+Q2+Q3+Q4 sums match FY2024 totals.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: SOURCES */}
        {step === 3 && (
          <div className="space-y-6 pt-2">
            <div className="flex flex-wrap gap-2 border-b border-[#B9A0DA] pb-3">
              {[
                { id: 'synthetic', label: 'Synthetic bundle (Aurora)', icon: Database },
                { id: 'upload', label: 'Upload documents', icon: Upload },
                { id: 'edgar', label: 'SEC EDGAR', icon: Globe },
              ].map((t) => {
                const Icon = t.icon;
                const active = sourceTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSourceTab(t.id as 'synthetic' | 'upload' | 'edgar')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-[1.5px] text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#D4FF3F] text-[#2A1F45] border-[#2A1F45]'
                        : 'bg-[#E9DDF6] text-[#2A1F45] border-[#2A1F45] hover:bg-[#CBB3E8]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {sourceTab === 'synthetic' && (
              <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-4 flex items-center justify-between">
                <div className="text-xs text-[#2A1F45]">
                  <strong>Synthetic Aurora Dynamics Bundle (S1–S7) Loaded:</strong> Includes S1 Audited FY2024 Report, S2 Contradictory Press Release ($552M), S5 Stale Market Study, S6 Undated Note, and S7 Prompt-Injection Test.
                </div>
                <button
                  type="button"
                  onClick={() => setSourcesList(buildAuroraSources(DEFAULT_PROJECT_ID))}
                  className="px-4 py-1.5 rounded-full bg-[#2A1F45] text-[#D4FF3F] text-xs font-bold shrink-0 cursor-pointer"
                >
                  Restore All S1–S7
                </button>
              </div>
            )}

            {sourceTab === 'upload' && (
              <div className="space-y-4">
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileUpload(e.dataTransfer.files);
                  }}
                  className="block rounded-2xl border-2 border-dashed border-[#8A6BC2] bg-[#E9DDF6] hover:bg-[#CBB3E8] p-8 text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-8 h-8 text-[#8A6BC2] mx-auto mb-2" />
                  <div className="text-sm font-bold text-[#2A1F45]">
                    Drag & drop PDF, CSV, or TXT files here, or click to browse
                  </div>
                  <div className="text-xs text-[#6B5B86] mt-1">
                    Max 10MB per file · Per-file status progresses Queued → Reading → Extracted
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.csv,.txt,.md,.json"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </label>

                {uploadError && (
                  <div className="rounded-xl bg-[#E34234] border border-[#B8301F] p-3 text-xs text-[#F3EBFA] font-semibold">
                    {uploadError}
                  </div>
                )}
              </div>
            )}

            {sourceTab === 'edgar' && (
              <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-4">
                <div className="text-xs text-[#2A1F45]">
                  <strong>Live SEC EDGAR Submission Metadata Probe:</strong> Enter a 10-digit CIK (e.g. <span className="font-mono">0000320193</span>) to attempt a direct browser fetch from <span className="font-mono">data.sec.gov</span>. If blocked by browser CORS policies, TrustLens displays a transparent fallback notice and never fabricates SEC filings.
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={edgarCikOrTicker}
                    onChange={(e) => setEdgarCikOrTicker(e.target.value)}
                    placeholder="CIK e.g. 0000320193"
                    className="rounded-xl bg-[#F3EBFA] border border-[#B9A0DA] px-3.5 py-2 text-xs font-mono font-bold text-[#2A1F45]"
                  />
                  <button
                    type="button"
                    onClick={handleAttemptEdgarFetch}
                    className="px-4 py-2 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] text-[#2A1F45] border-[1.5px] border-[#2A1F45] text-xs font-bold cursor-pointer"
                  >
                    Attempt Live SEC EDGAR Fetch
                  </button>
                </div>
                {edgarStatus !== 'idle' && (
                  <div
                    className={`rounded-xl p-3 text-xs border ${
                      edgarStatus === 'blocked'
                        ? 'bg-[#EAF7A8] border-[#8A6BC2] text-[#2A1F45]'
                        : 'bg-[#F3EBFA] border-[#B9A0DA] text-[#2A1F45]'
                    }`}
                  >
                    <strong>SEC EDGAR Status ({edgarStatus.toUpperCase()}):</strong> {edgarMessage}
                  </div>
                )}
              </div>
            )}

            {/* Source Files Table */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-[#2A1F45]">
                Included Sources ({sourcesList.length} documents)
              </div>
              {sourcesList.map((src) => (
                <div
                  key={src.id}
                  className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#2A1F45] text-[#D4FF3F]">
                        {src.id}
                      </span>
                      <span className="text-xs font-bold text-[#2A1F45]">{src.title}</span>
                      <SyntheticOriginTag origin={src.originLabel} />
                      {src.uploadStatus && <StatusBadge status={src.uploadStatus} />}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B5B86]">
                      <span>Type: {src.type}</span>
                      <span>·</span>
                      {src.publicationDate ? (
                        <span>
                          Published: <strong className="font-mono text-[#2A1F45]">{src.publicationDate}</strong>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[#B8301F] font-semibold">
                          <span>Missing Date — Enter manually:</span>
                          <input
                            type="date"
                            onChange={(e) => handleUpdateSourceDate(src.id, e.target.value)}
                            className="rounded bg-[#F3EBFA] border border-[#B8301F] px-2 py-0.5 text-xs font-mono text-[#2A1F45]"
                          />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewSource(src)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F3EBFA] hover:bg-[#D4FF3F] text-[#2A1F45] border-[1.5px] border-[#2A1F45] text-xs font-semibold cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        openSourceDrawer(src.id, DEFAULT_PROJECT_ID, src.pages[0]?.pageNumber || 1)
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F3EBFA] hover:bg-[#D4FF3F] text-[#2A1F45] border-[1.5px] border-[#2A1F45] text-xs font-semibold cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in viewer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSourcesList((prev) => prev.filter((item) => item.id !== src.id))
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#E34234] hover:bg-[#B8301F] text-[#F3EBFA] text-xs font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & START */}
        {step === 4 && (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-5 space-y-3">
                <h3 className="font-display text-lg font-bold text-[#2A1F45]">
                  Research Configuration Summary
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6B5B86]">Target Entity:</span>
                    <span className="font-bold text-[#2A1F45]">
                      {companyName} ({ticker})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B5B86]">Data Origin Label:</span>
                    <SyntheticOriginTag origin={dataOrigin} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B5B86]">Selected Periods ({selectedPeriods.length}):</span>
                    <span className="font-mono font-semibold text-[#2A1F45]">
                      {selectedPeriods.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B5B86]">Indexed Sources:</span>
                    <span className="font-mono font-bold text-[#2A1F45]">
                      {sourcesList.length} documents
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#EAF7A8] border border-[#2A1F45]/30 p-5 space-y-3">
                <h3 className="font-display text-lg font-bold text-[#2A1F45]">
                  Pre-Flight Verification Checklist
                </h3>
                <ul className="space-y-2 text-xs text-[#2A1F45]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2A1F45] shrink-0" />
                    <span>Deterministic ratio functions enabled (null/zero/negative guards active)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2A1F45] shrink-0" />
                    <span>Staleness detector (&gt;12m threshold) active on {sourcesList.filter((s) => s.isStale).length} source(s)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2A1F45] shrink-0" />
                    <span>Missing publication date flag active on {sourcesList.filter((s) => !s.publicationDate).length} source(s)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2A1F45] shrink-0" />
                    <span>Human review gate required prior to report attestation</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleStartResearch}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] text-[#2A1F45] font-bold text-sm border-[1.5px] border-[#2A1F45] cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Start Research & Launch 5-Agent Orchestrator</span>
              </button>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="pt-4 border-t border-[#B9A0DA] flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-[1.5px] border-[#2A1F45] bg-[#E9DDF6] text-[#2A1F45] text-xs font-semibold disabled:opacity-40 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Step</span>
          </button>

          {step < 4 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s))}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] text-[#2A1F45] border-[1.5px] border-[#2A1F45] text-xs font-bold cursor-pointer"
            >
              <span>Continue to Step {step + 1}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Source Metadata Preview Modal */}
      <Modal
        isOpen={!!previewSource}
        onClose={() => setPreviewSource(null)}
        title={previewSource ? `${previewSource.id}: ${previewSource.title}` : 'Source Preview'}
      >
        {previewSource && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <SyntheticOriginTag origin={previewSource.originLabel} />
              <span className="font-mono">
                Published: {previewSource.publicationDate || 'UNDATED (Flagged)'}
              </span>
            </div>
            {previewSource.pages.map((p) => (
              <div key={p.pageNumber} className="rounded-xl bg-[#E9DDF6] p-3.5 space-y-2">
                <div className="font-bold text-[#2A1F45]">
                  Page {p.pageNumber}: {p.title}
                </div>
                {p.passages.map((pas) => (
                  <p key={pas.id} className="text-[#2A1F45] leading-relaxed">
                    <strong className="font-mono text-[#8A6BC2] mr-1">{pas.id}:</strong>
                    {pas.text}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
