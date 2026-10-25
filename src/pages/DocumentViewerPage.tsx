import React from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  Breadcrumbs,
  StatusBadge,
  SyntheticOriginTag,
  ClaimChip,
  RiskChip,
  MetricChip,
} from '../components/ui/primitives';

export const DocumentViewerPage: React.FC = () => {
  const { projectId, sourceId } = useParams<{ projectId: string; sourceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, activeProject, recordAudit } = useAppStore();

  const project = projects.find((p) => p.id === projectId) || activeProject;
  const sources = project.sources;
  const sourceIndex = sources.findIndex((s) => s.id === sourceId);
  const source = sourceIndex >= 0 ? sources[sourceIndex] : sources[0];

  const prevSource = sourceIndex > 0 ? sources[sourceIndex - 1] : null;
  const nextSource =
    sourceIndex >= 0 && sourceIndex < sources.length - 1 ? sources[sourceIndex + 1] : null;

  const requestedPage = Number(searchParams.get('page')) || source.pages[0]?.pageNumber || 1;
  const highlightPassageId = searchParams.get('highlight') || '';

  const currentPageObj =
    source.pages.find((p) => p.pageNumber === requestedPage) || source.pages[0];

  const relatedClaims = project.claims.filter(
    (c) =>
      c.originSourceId === source.id ||
      c.verification.supportingSourceIds.includes(source.id) ||
      c.verification.contradictingSourceIds.includes(source.id)
  );

  const relatedRisks = project.risks.filter((r) => r.sourceIds.includes(source.id));
  const relatedMetrics = project.metrics.filter((m) => m.sourceId === source.id);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        backTo={`/app/project/${project.id}`}
        items={[
          { label: 'Projects', to: '/app/dashboard' },
          { label: `${project.companyName} (${project.ticker})`, to: `/app/project/${project.id}` },
          { label: 'Source Documents', to: `/app/project/${project.id}/verification` },
          { label: `${source.id}: ${source.title}` },
        ]}
      />

      {/* Header Card with Prev/Next Document Navigation */}
      <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-sm font-bold px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F]">
                {source.id}
              </span>
              <SyntheticOriginTag origin={source.originLabel} />
              {source.isStale ? (
                <StatusBadge status="Partially Supported" />
              ) : source.missingDateFlag || source.promptInjectionFlag ? (
                <StatusBadge status="Contradicted" />
              ) : (
                <StatusBadge status="Verified" />
              )}
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#2A1F45]">
              {source.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B5B86]">
              <span>Type: {source.type}</span>
              <span>·</span>
              <span>
                Publication Date:{' '}
                <strong className="text-[#2A1F45] font-mono">
                  {source.publicationDate || 'MISSING (Undated — Flagged)'}
                </strong>
              </span>
              <span>·</span>
              <span>
                Period End:{' '}
                <strong className="text-[#2A1F45] font-mono">{source.reportingPeriodEnd}</strong>
              </span>
              <span>·</span>
              <span>Total Pages: {source.pageCount}</span>
            </div>
          </div>

          {/* Prev / Next Source Navigation (Rule 5) */}
          <div className="flex items-center gap-2">
            {prevSource ? (
              <Link
                to={`/app/project/${project.id}/sources/${prevSource.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E9DDF6] hover:bg-[#CBB3E8] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev ({prevSource.id})</span>
              </Link>
            ) : null}
            {nextSource ? (
              <Link
                to={`/app/project/${project.id}/sources/${nextSource.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E9DDF6] hover:bg-[#CBB3E8] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45]"
              >
                <span>Next ({nextSource.id})</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : null}
          </div>
        </div>

        {source.isStale && (
          <div className="mt-4 rounded-xl bg-[#EAF7A8] border border-[#8A6BC2] p-3 text-xs text-[#2A1F45] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#8A6BC2] shrink-0" />
            <span>
              <strong>Staleness Flag:</strong> {source.stalenessReason}
            </span>
          </div>
        )}

        {source.promptInjectionFlag && (
          <div className="mt-4 rounded-xl bg-[#E34234] border border-[#B8301F] p-3.5 text-xs text-[#F3EBFA] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#D4FF3F] shrink-0" />
            <span>
              <strong>Prompt-Injection Quarantine Active:</strong> This test document contains an adversarial instruction payload on Page 1. TrustLens isolated the string and prevented pipeline manipulation.
            </span>
          </div>
        )}
      </div>

      {/* Document Page Selector & Passage Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-5">
            <h2 className="font-display text-lg font-bold text-[#2A1F45] mb-3">
              Indexed Pages & Passages
            </h2>
            <div className="space-y-2">
              {source.pages.map((pg) => {
                const isSelected = pg.pageNumber === currentPageObj?.pageNumber;
                return (
                  <div key={pg.pageNumber} className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchParams({
                          page: String(pg.pageNumber),
                          highlight: pg.passages[0]?.id || '',
                        });
                        recordAudit(
                          `Viewed ${source.id} Page ${pg.pageNumber}`,
                          'Source',
                          source.id,
                          `${source.id} p.${pg.pageNumber}`,
                          `/app/project/${project.id}/sources/${source.id}?page=${pg.pageNumber}`,
                          `Navigated to page ${pg.pageNumber} in Document Viewer.`
                        );
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-full text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#2A1F45] text-[#D4FF3F]'
                          : 'bg-[#E9DDF6] hover:bg-[#CBB3E8] text-[#2A1F45]'
                      }`}
                    >
                      <span>
                        Page {pg.pageNumber}: {pg.title}
                      </span>
                      <span className="font-mono text-[11px]">{pg.passages.length} passages</span>
                    </button>

                    <div className="pl-3 space-y-1">
                      {pg.passages.map((pas) => {
                        const activeHighlight = highlightPassageId === pas.id;
                        return (
                          <button
                            key={pas.id}
                            type="button"
                            onClick={() =>
                              setSearchParams({
                                page: String(pg.pageNumber),
                                highlight: pas.id,
                              })
                            }
                            className={`w-full text-left px-3.5 py-1.5 rounded-full text-xs transition-colors flex items-center justify-between cursor-pointer ${
                              activeHighlight
                                ? 'bg-[#D4FF3F] text-[#2A1F45] font-bold border border-[#2A1F45]'
                                : 'text-[#6B5B86] hover:text-[#2A1F45] hover:bg-[#E9DDF6]'
                            }`}
                          >
                            <span className="truncate">
                              <strong className="font-mono mr-1.5">{pas.id}</strong>
                              {pas.sectionTitle}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Related Items Panel (Rule 5) */}
          <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-5 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#2A1F45]">
              Related Claims, Metrics & Risks
            </h2>

            <div>
              <div className="text-xs font-semibold text-[#6B5B86] mb-1.5">
                Linked Claims ({relatedClaims.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {relatedClaims.map((c) => (
                  <ClaimChip key={c.id} claimId={c.id} projectId={project.id} />
                ))}
              </div>
            </div>

            {relatedMetrics.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[#6B5B86] mb-1.5">
                  Extracted Metrics ({relatedMetrics.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {relatedMetrics.map((m) => (
                    <MetricChip key={m.id} metricId={m.id} projectId={project.id} />
                  ))}
                </div>
              </div>
            )}

            {relatedRisks.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[#6B5B86] mb-1.5">
                  Triggered Risks ({relatedRisks.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {relatedRisks.map((r) => (
                    <RiskChip key={r.id} riskId={r.id} projectId={project.id} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full Page Text & Highlighted Cited Passages */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-6 md:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#B9A0DA] pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8A6BC2]" />
                <h2 className="font-display text-xl font-bold text-[#2A1F45]">
                  Page {currentPageObj?.pageNumber} — {currentPageObj?.title}
                </h2>
              </div>
              <span className="font-mono text-xs text-[#6B5B86]">
                {source.id} · Page {currentPageObj?.pageNumber} of {source.pageCount}
              </span>
            </div>

            <div className="rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] p-4 text-sm text-[#2A1F45]">
              {currentPageObj?.content}
            </div>

            <div className="space-y-4">
              {currentPageObj?.passages.map((pas) => {
                const isHighlighted =
                  highlightPassageId === pas.id ||
                  (!highlightPassageId && pas.id === currentPageObj.passages[0]?.id);
                return (
                  <div
                    key={pas.id}
                    id={pas.id}
                    className={`rounded-2xl p-5 border-2 transition-all ${
                      pas.isPromptInjectionTest
                        ? 'bg-[#E34234] text-[#F3EBFA] border-[#B8301F]'
                        : isHighlighted
                        ? 'bg-[#EAF7A8] border-[#2A1F45] shadow-sm text-[#2A1F45]'
                        : 'bg-[#E9DDF6] border-[#B9A0DA] text-[#2A1F45]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-0.5 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold">
                          Passage {pas.id}
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            pas.isPromptInjectionTest ? 'text-[#F3EBFA]' : 'text-[#2A1F45]'
                          }`}
                        >
                          {pas.sectionTitle}
                        </span>
                      </div>
                      {isHighlighted && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2A1F45] bg-[#D4FF3F] px-3 py-0.5 rounded-full border border-[#2A1F45]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cited Passage Highlighted</span>
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-base leading-relaxed font-normal ${
                        pas.isPromptInjectionTest ? 'text-[#F3EBFA]' : 'text-[#2A1F45]'
                      }`}
                    >
                      {pas.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
