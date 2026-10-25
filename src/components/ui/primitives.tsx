import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  Loader2,
  Eye,
  FileText,
  TrendingUp,
  ShieldAlert,
  Quote,
  ChevronRight,
  X,
  ArrowLeft,
} from 'lucide-react';
import { BadgeStatus, DataOrigin } from '../../types';
import { useAppStore } from '../../store/useAppStore';

/**
 * Reusable StatusBadge
 * Every status has icon + text, NEVER color alone.
 * Uses strictly the permitted palette:
 * #CBB3E8, #D4FF3F, #E34234, #8A6BC2, #2A1F45, #E9DDF6, #F3EBFA, #B8301F, #EAF7A8, #6B5B86, #B9A0DA
 */
export const StatusBadge: React.FC<{
  status: BadgeStatus | string;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  const baseClass =
    size === 'sm'
      ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border-[1.5px]'
      : 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 border-[1.5px]';

  switch (status) {
    case 'Verified':
    case 'Completed':
    case 'Approved':
    case 'Reviewed & Attested':
      return (
        <span className={`${baseClass} bg-[#D4FF3F] text-[#2A1F45] border-[#2A1F45]`}>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#2A1F45]" />
          <span>{status}</span>
        </span>
      );
    case 'Partially Supported':
    case 'Needs Review':
    case 'In Review':
    case 'Under Human Review':
    case 'Draft — Needs Review':
    case 'Draft':
      return (
        <span className={`${baseClass} bg-[#EAF7A8] text-[#2A1F45] border-[#B8301F]`}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#E34234]" />
          <span>{status}</span>
        </span>
      );
    case 'Contradicted':
    case 'Failed':
    case 'Rejected':
    case 'Changes Requested':
    case 'Revision Requested':
    case 'Stale':
      return (
        <span className={`${baseClass} bg-[#E34234] text-[#F3EBFA] border-[#2A1F45]`}>
          <XCircle className="w-3.5 h-3.5 shrink-0 text-[#D4FF3F]" />
          <span>{status}</span>
        </span>
      );
    case 'Unsupported':
      return (
        <span className={`${baseClass} bg-[#B8301F] text-[#F3EBFA] border-[#2A1F45]`}>
          <HelpCircle className="w-3.5 h-3.5 shrink-0 text-[#D4FF3F]" />
          <span>{status}</span>
        </span>
      );
    case 'Processing':
      return (
        <span className={`${baseClass} bg-[#8A6BC2] text-[#F3EBFA] border-[#2A1F45]`}>
          <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-[#D4FF3F]" />
          <span>{status}</span>
        </span>
      );
    case 'Queued':
    default:
      return (
        <span className={`${baseClass} bg-[#F3EBFA] text-[#2A1F45] border-[#8A6BC2]`}>
          <Clock className="w-3.5 h-3.5 shrink-0 text-[#E34234]" />
          <span>{status}</span>
        </span>
      );
  }
};

/**
 * Synthetic Data Origin Label (Required on every screen where synthetic dataset appears)
 */
export const SyntheticOriginTag: React.FC<{ origin?: DataOrigin }> = ({
  origin = 'SYNTHETIC — FICTIONAL',
}) => {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#2A1F45] text-[#D4FF3F] border-[1.5px] border-[#E34234] whitespace-nowrap shrink-0">
      <Eye className="w-3.5 h-3.5 shrink-0 text-[#D4FF3F]" />
      <span>{origin}</span>
    </span>
  );
};

/**
 * Rule 1: Any source name anywhere opens the Source Drawer
 */
export const SourceChip: React.FC<{
  sourceId: string;
  projectId?: string;
  pageNumber?: number;
  highlightPassageId?: string;
  label?: string;
}> = ({ sourceId, projectId, pageNumber, highlightPassageId, label }) => {
  const { openSourceDrawer, activeProject } = useAppStore();
  const resolvedProjectId = projectId || activeProject.id;
  const source = activeProject.sources.find((s) => s.id === sourceId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openSourceDrawer(sourceId, resolvedProjectId, pageNumber, highlightPassageId);
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#E9DDF6] hover:bg-[#D4FF3F] text-[#2A1F45] border-[1.5px] border-[#2A1F45] hover:border-[#E34234] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E34234] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F3EBFA] transition-all cursor-pointer whitespace-nowrap shrink-0"
      title={`Inspect ${source?.title || sourceId} in Source Drawer`}
    >
      <FileText className="w-3.5 h-3.5 text-[#E34234] shrink-0" />
      <span className="font-mono font-semibold">{sourceId}</span>
      {label ? (
        <span className="truncate max-w-[180px]">{label}</span>
      ) : source ? (
        <span className="truncate max-w-[160px]">{source.type}</span>
      ) : null}
      {pageNumber ? <span className="font-mono text-[#B8301F] font-semibold">p.{pageNumber}</span> : null}
      {source?.isStale ? (
        <span className="text-[#E34234] font-bold ml-0.5">(Stale)</span>
      ) : null}
    </button>
  );
};

/**
 * Rule 2: Any claim anywhere links to /verification/claim/:claimId
 */
export const ClaimChip: React.FC<{
  claimId: string;
  projectId?: string;
  label?: string;
  showStatement?: boolean;
}> = ({ claimId, projectId, label, showStatement = true }) => {
  const { activeProject } = useAppStore();
  const pid = projectId || activeProject.id;
  const claim = activeProject.claims.find((c) => c.id === claimId);

  return (
    <Link
      to={`/app/project/${pid}/verification/claim/${claimId}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F3EBFA] hover:bg-[#D4FF3F] text-[#2A1F45] border-[1.5px] border-[#E34234] hover:border-[#2A1F45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E34234] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F3EBFA] transition-all whitespace-nowrap shrink-0"
    >
      <Quote className="w-3.5 h-3.5 text-[#E34234] shrink-0" />
      <span className="font-mono font-semibold">{claimId}</span>
      {showStatement && (
        <span className="truncate max-w-[180px]">{label || claim?.statement || 'Inspect Claim'}</span>
      )}
    </Link>
  );
};

/**
 * Rule 3: Any metric value links to /analysis/metric/:metricId; any ratio links to /analysis/ratio/:ratioId
 */
export const MetricChip: React.FC<{
  metricId?: string;
  ratioId?: string;
  projectId?: string;
  label?: string;
  value?: string;
}> = ({ metricId, ratioId, projectId, label, value }) => {
  const { activeProject } = useAppStore();
  const pid = projectId || activeProject.id;

  if (ratioId) {
    const ratio = activeProject.ratios.find((r) => r.id === ratioId);
    return (
      <Link
        to={`/app/project/${pid}/analysis/ratio/${ratioId}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EAF7A8] hover:bg-[#D4FF3F] text-[#2A1F45] border-[1.5px] border-[#2A1F45] hover:border-[#E34234] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E34234] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F3EBFA] transition-all whitespace-nowrap shrink-0"
      >
        <TrendingUp className="w-3.5 h-3.5 text-[#E34234] shrink-0" />
        <span>{label || ratio?.name || ratioId}</span>
        <span className="font-mono font-semibold">{value || ratio?.formattedValue}</span>
      </Link>
    );
  }

  const metric = activeProject.metrics.find((m) => m.id === metricId);
  return (
    <Link
      to={`/app/project/${pid}/analysis/metric/${metricId || 'M-REV-2024'}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F3EBFA] hover:bg-[#D4FF3F] text-[#2A1F45] border-[1.5px] border-[#2A1F45] hover:border-[#E34234] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E34234] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F3EBFA] transition-all whitespace-nowrap shrink-0"
    >
      <TrendingUp className="w-3.5 h-3.5 text-[#8A6BC2] shrink-0" />
      <span>{label || metric?.name || metricId}</span>
      <span className="font-mono font-semibold">
        {value || (metric?.value !== null && metric?.value !== undefined ? `$${metric.value.toFixed(1)}M` : 'MISSING')}
      </span>
    </Link>
  );
};

export const RatioChip: React.FC<{
  ratioId: string;
  projectId?: string;
  label?: string;
  value?: string;
}> = ({ ratioId, projectId, label, value }) => {
  return <MetricChip ratioId={ratioId} projectId={projectId} label={label} value={value} />;
};


/**
 * Rule 4: Any risk links to /risks/:riskId
 */
export const RiskChip: React.FC<{
  riskId: string;
  projectId?: string;
  label?: string;
}> = ({ riskId, projectId, label }) => {
  const { activeProject } = useAppStore();
  const pid = projectId || activeProject.id;
  const risk = activeProject.risks.find((r) => r.id === riskId);

  return (
    <Link
      to={`/app/project/${pid}/risks/${riskId}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#E34234] hover:bg-[#B8301F] text-[#F3EBFA] border-[1.5px] border-[#2A1F45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E34234] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F3EBFA] transition-all whitespace-nowrap shrink-0"
    >
      <ShieldAlert className="w-3.5 h-3.5 text-[#D4FF3F] shrink-0" />
      <span className="font-mono font-semibold">{riskId}</span>
      <span className="truncate max-w-[180px]">{label || risk?.title || 'View Risk'}</span>
    </Link>
  );
};

/**
 * Breadcrumbs + Back Navigation with Tomato Red Divider & Focus Accents
 */
export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export const Breadcrumbs: React.FC<{
  items: BreadcrumbItem[];
  backTo?: string;
}> = ({ items, backTo }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 text-sm text-[#6B5B86] mb-4 pb-2.5 border-b border-[#E34234]/35"
    >
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#E9DDF6] hover:bg-[#D4FF3F] text-[#2A1F45] border-[1.5px] border-[#E34234] font-medium transition-colors mr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E34234]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#E34234]" />
          <span>Back</span>
        </Link>
      )}
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            {idx > 0 && <ChevronRight className="w-4 h-4 text-[#E34234] shrink-0" />}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="text-[#2A1F45] hover:text-[#B8301F] underline-offset-4 hover:underline transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[#2A1F45] font-semibold">{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, actionTo, onAction }) => (
  <div className="rounded-2xl bg-[#F3EBFA] border-2 border-[#E34234]/70 p-8 text-center max-w-lg mx-auto my-6 shadow-sm">
    <FileText className="w-10 h-10 text-[#E34234] mx-auto mb-3" />
    <h3 className="font-display text-xl font-bold text-[#2A1F45] mb-2">{title}</h3>
    <div className="w-12 h-[2px] bg-[#E34234] mx-auto mb-3" />
    <p className="text-sm text-[#6B5B86] mb-4">{description}</p>
    {actionLabel && actionTo && (
      <Link
        to={actionTo}
        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] font-semibold text-sm hover:bg-[#EAF7A8] border-[1.5px] border-[#E34234] transition-colors"
      >
        {actionLabel}
      </Link>
    )}
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] font-semibold text-sm hover:bg-[#EAF7A8] border-[1.5px] border-[#E34234] transition-colors cursor-pointer"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const ErrorState: React.FC<{
  title: string;
  message: string;
  onRetry?: () => void;
}> = ({ title, message, onRetry }) => (
  <div className="rounded-2xl bg-[#F3EBFA] border-2 border-[#E34234] p-6 my-4">
    <div className="flex items-start gap-3">
      <XCircle className="w-6 h-6 text-[#B8301F] shrink-0 mt-0.5" />
      <div>
        <h3 className="font-display text-lg font-bold text-[#2A1F45]">{title}</h3>
        <p className="text-sm text-[#6B5B86] mt-1">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 px-4 py-2 rounded-full bg-[#E34234] text-[#F3EBFA] text-xs font-semibold hover:bg-[#B8301F] transition-colors cursor-pointer"
          >
            Retry Action
          </button>
        )}
      </div>
    </div>
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-6 w-full' }) => (
  <div className={`animate-pulse rounded-xl bg-[#B9A0DA]/60 border border-[#E34234]/25 ${className}`} />
);

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A1F45]/70 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[#F3EBFA] border-2 border-[#E34234] p-6 text-[#2A1F45] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-[#E34234]/50 pb-3 mb-4">
          <h3 className="font-display text-2xl font-bold text-[#2A1F45]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full bg-[#E9DDF6] hover:bg-[#D4FF3F] text-[#2A1F45] border-[1.5px] border-[#E34234] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Drawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#2A1F45]/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-full bg-[#F3EBFA] border-l-2 border-[#E34234] p-6 overflow-y-auto text-[#2A1F45] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="flex items-center justify-between border-b-2 border-[#E34234]/50 pb-4 mb-4">
            <h3 className="font-display text-2xl font-bold text-[#2A1F45]">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="p-2 rounded-full bg-[#E9DDF6] hover:bg-[#D4FF3F] text-[#2A1F45] border-[1.5px] border-[#E34234] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useAppStore();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-2xl p-4 border-2 shadow-lg flex items-start justify-between gap-3 ${
            t.variant === 'verified'
              ? 'bg-[#2A1F45] text-[#F3EBFA] border-[#D4FF3F]'
              : t.variant === 'risk'
              ? 'bg-[#B8301F] text-[#F3EBFA] border-[#E34234]'
              : 'bg-[#F3EBFA] text-[#2A1F45] border-[#E34234]'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {t.variant === 'verified' ? (
              <CheckCircle2 className="w-5 h-5 text-[#D4FF3F] shrink-0 mt-0.5" />
            ) : t.variant === 'risk' ? (
              <AlertTriangle className="w-5 h-5 text-[#D4FF3F] shrink-0 mt-0.5" />
            ) : (
              <FileText className="w-5 h-5 text-[#E34234] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-sm font-bold">{t.title}</div>
              {t.description && (
                <div className="text-xs opacity-90 mt-0.5">{t.description}</div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
