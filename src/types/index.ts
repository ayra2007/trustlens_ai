export type VerificationStatus =
  | 'Verified'
  | 'Partially Supported'
  | 'Contradicted'
  | 'Unsupported';

export type WorkflowStatus =
  | 'Queued'
  | 'Processing'
  | 'Completed'
  | 'Needs Review'
  | 'Failed';

export type BadgeStatus = VerificationStatus | WorkflowStatus | 'Stale';

export type DataOrigin =
  | 'SYNTHETIC — FICTIONAL'
  | 'UPLOADED BY USER'
  | 'USER UPLOADED'
  | 'SEC EDGAR METADATA'
  | 'PUBLIC FINANCIAL FILING';

export type RiskSeverity = 'High' | 'Medium' | 'Low';
export type RiskType = 'Evidence-Backed' | 'Hypothesis' | 'Source Quality' | 'Contradiction';
export type RiskDomainCategory = 'Business' | 'Financial' | 'Data Quality';
export type EvidenceStrength = 'Strong' | 'Moderate' | 'Weak / Hypothesis' | 'Weak / Speculative';
export type ClaimAnalystStatus = 'Open' | 'Corrected' | 'Dismissed' | 'Accepted';
export type AnalystClaimStatus = ClaimAnalystStatus;
export type RiskAnalystStatus = 'Open' | 'Investigating' | 'Resolved' | 'Accepted';
export type AnalystRiskStatus = RiskAnalystStatus;

export interface Passage {
  id: string;
  pageNumber: number;
  sectionTitle: string;
  text: string;
  isPromptInjectionTest?: boolean;
}

export interface SourcePage {
  pageNumber: number;
  title: string;
  content: string;
  passages: Passage[];
}

export interface Source {
  id: string;
  projectId: string;
  title: string;
  type:
    | 'Annual Report'
    | 'Earnings Release'
    | 'Quarterly Report'
    | 'Market Report'
    | 'Analyst Note'
    | 'Test Document'
    | 'Uploaded Document'
    | 'SEC Filing';
  originLabel: DataOrigin;
  publicationDate: string | null; // null if undated
  reportingPeriodEnd: string;
  isStale: boolean;
  monthsStale?: number;
  stalenessReason?: string;
  missingDateFlag?: boolean;
  promptInjectionFlag?: boolean;
  pageCount: number;
  pages: SourcePage[];
  uploadStatus?: 'Queued' | 'Reading' | 'Extracted' | 'Unreadable';
  fileSizeKb?: number;
}

export interface PeriodFinancials {
  period: string; // e.g., 'FY2022', 'FY2023', 'FY2024', 'Q1 FY2024', etc.
  periodType: 'Annual' | 'Quarterly';
  revenue: number | null;
  cogs: number | null;
  netIncome: number | null;
  currentAssets: number | null;
  totalAssets: number | null;
  currentLiabilities: number | null;
  totalLiabilities: number | null;
  equity: number | null;
  operatingCashFlow: number | null;
  capex: number | null;
  sourceId: string;
  passageId: string;
}

export interface AlternativeMetricReport {
  sourceId: string;
  passageId: string;
  pageNumber: number;
  reportedValue: number | null;
  formattedValue: string;
  status: VerificationStatus;
  isConflicting?: boolean;
  note: string;
}

export interface Metric {
  id: string;
  projectId: string;
  key:
    | 'revenue'
    | 'cogs'
    | 'netIncome'
    | 'currentAssets'
    | 'totalAssets'
    | 'currentLiabilities'
    | 'totalLiabilities'
    | 'equity'
    | 'operatingCashFlow'
    | 'capex';
  name: string;
  unit: 'USD Millions';
  period: string;
  periodType: 'Annual' | 'Quarterly';
  value: number | null;
  priorValue: number | null;
  changePercent: number | null;
  changeNote: string;
  sourceId: string;
  passageId: string;
  pageNumber?: number;
  extractionMethod?: string;
  status: VerificationStatus;
  explanation: string;
  alternativeReports?: AlternativeMetricReport[];
  historicalSeries?: { period: string; value: number | null; sourceId?: string }[];
  flaggedByAnalyst?: boolean;
  flagReason?: string;
  analystNotes?: string[];
}

export interface RatioPeriodValue {
  period: string;
  value: number | null;
  formatted: string;
  numerator: number | null;
  denominator: number | null;
  sourceId?: string;
}

export interface Ratio {
  id: string;
  projectId: string;
  key:
    | 'grossMargin'
    | 'netMargin'
    | 'roa'
    | 'roe'
    | 'currentRatio'
    | 'debtToEquity'
    | 'assetTurnover'
    | 'revenueYoY'
    | 'netIncomeYoY'
    | 'revenueQoQ';
  name: string;
  category?: 'Profitability' | 'Liquidity' | 'Leverage' | 'Efficiency';
  formula: string;
  plainEnglish?: string;
  plainEnglishExplanation?: string;
  period: string;
  value: number | null;
  formattedValue: string;
  unit: '%' | 'x' | 'pp';
  priorValue: number | null;
  fy2022Value?: number | null;
  fy2022Formatted?: string;
  fy2023Value?: number | null;
  fy2023Formatted?: string;
  fy2024Value?: number | null;
  fy2024Formatted?: string;
  deltaVsPrior: number | null;
  deltaFormatted: string;
  numeratorLabel: string;
  numeratorValue: number | null;
  denominatorLabel: string;
  denominatorValue: number | null;
  sourceIds: string[];
  metricIds: string[];
  linkedClaimIds?: string[];
  stepByStep?: string[];
  assumptions?: string[];
  periodHistory?: RatioPeriodValue[];
  interpretation: string;
  interpretationLimits?: string;
  analystCorrectedNote?: string;
  lastRecalculatedAt?: string;
  status: VerificationStatus;
}

export interface ClaimCheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface VerificationResult {
  id: string;
  claimId: string;
  status: VerificationStatus;
  deterministicCheck: string;
  formulaUsed?: string;
  claimedNumericValue?: number | null;
  extractedNumericValue?: number | null;
  recalculatedNumericValue?: number | null;
  tolerancePercent?: number;
  withinTolerance?: boolean | null;
  recalculatedValue: string | null;
  reportedValue: string | null;
  discrepancyNote: string | null;
  supportingSourceIds: string[];
  supportingPassageIds: string[];
  contradictingSourceIds: string[];
  contradictingPassageIds: string[];
  checks?: ClaimCheckItem[];
  timestamp: string;
}

export interface Claim {
  id: string;
  projectId: string;
  statement: string;
  claimType?: 'numeric' | 'qualitative' | 'Numeric' | 'Qualitative';
  producingAgentId?: string;
  period?: string;
  pageNumber?: number;
  evidenceCompleteness?: number;
  evidenceCompletenessNote?: string;
  tolerancePercent?: number;
  checks?: ClaimCheckItem[];
  category:
    | 'Revenue & Growth'
    | 'Profitability'
    | 'Liquidity & Solvency'
    | 'Cash Flow'
    | 'Market Position'
    | 'Forward-Looking';
  originSourceId: string;
  originPassageId: string;
  status: VerificationStatus;
  confidenceNote: string;
  plainEnglishWhy?: string;
  verification: VerificationResult;
  relatedMetricIds: string[];
  relatedRatioIds: string[];
  relatedRiskIds: string[];
  analystStatus?: ClaimAnalystStatus;
  reviewerDecision?: 'Accepted' | 'Rejected' | 'Needs Revision' | 'Pending';
  reviewerComment?: string;
  correctedValue?: string;
  correctionJustification?: string;
  dismissReason?: string;
  annotations?: string[];
  feedbackThumb?: 'up' | 'down';
  feedbackComment?: string;
}

export interface Risk {
  id: string;
  projectId: string;
  title: string;
  category:
    | 'Supply Chain'
    | 'Data Integrity'
    | 'Source Staleness'
    | 'Disclosure Gap'
    | 'Margin Hypothesis'
    | 'Source Quality'
    | 'Security / Prompt Injection';
  businessCategory?: RiskDomainCategory;
  domainCategory?: RiskDomainCategory;
  evidenceStrength?: EvidenceStrength;
  severity: RiskSeverity;
  severityRationale?: string;
  riskType: RiskType;
  status: WorkflowStatus;
  analystStatus?: RiskAnalystStatus;
  summary: string;
  detailedAnalysis: string;
  mitigationQuestions: string[];
  sourceIds: string[];
  passageIds: string[];
  relatedClaimIds: string[];
  relatedMetricIds: string[];
  convertedFromHypothesis?: boolean;
  convertedSourceId?: string;
  conversionRationale?: string;
  analystNotes?: string;
}

export interface AgentFinding {
  id: string;
  title: string;
  detail: string;
  severity: 'info' | 'warn' | 'error' | 'warning' | 'critical';
  linkedSourceIds?: string[];
  linkedClaimIds?: string[];
  linkedMetricIds?: string[];
  sourceIds?: string[];
  claimIds?: string[];
  metricIds?: string[];
}

export interface AgentStatusHistoryItem {
  status: WorkflowStatus;
  timestamp: string;
  note: string;
}

export interface AgentNode {
  id: string;
  projectId: string;
  stepNumber: number;
  name: string;
  role: 'Retrieve' | 'Analyze' | 'Verify' | 'Assess Risk' | 'Reconcile' | 'Report';
  status: WorkflowStatus;
  description: string;
  inputs: string[];
  outputs: string[];
  inputJson?: string;
  outputJson?: string;
  findings?: AgentFinding[];
  warnings?: string[];
  statusHistory?: AgentStatusHistoryItem[];
  retryCount?: number;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  logs: string[];
  auroraExample: string;
}

export interface PipelineEventLog {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  level: 'info' | 'warn' | 'error' | 'warning' | 'security';
  message: string;
}

export interface NistMitigationItem {
  id: string;
  controlCode: string;
  nistControl?: string;
  category?: 'GOVERN' | 'MAP' | 'MEASURE' | 'MANAGE';
  title: string;
  description: string;
  completed: boolean;
  linkedRiskIds: string[];
}

export interface ReviewEvent {
  id: string;
  projectId: string;
  targetType: 'Claim' | 'Risk' | 'Report' | 'Source' | 'Metric';
  targetId: string;
  reviewerName: string;
  reviewerRole: 'Analyst' | 'Reviewer';
  decision: 'Accepted' | 'Approved' | 'Flagged' | 'Rejected' | 'Needs Review' | 'Corrected';
  notes: string;
  timestamp: string;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  citedSourceIds: string[];
  citedClaimIds: string[];
  citedMetricIds: string[];
  citedRiskIds: string[];
}

export interface ReportVersion {
  versionNumber: number;
  createdAt: string;
  status: string;
  author: string;
  changeSummary: string;
  reverifiedClaimIds: string[];
  executiveSummarySnapshot: string;
  unresolvedClaimIdsSnapshot: string[];
}

export interface Report {
  id: string;
  projectId: string;
  title: string;
  generatedAt: string;
  versionNumber?: number;
  versions?: ReportVersion[];
  reviewStatus: 'Draft — Needs Review' | 'Under Human Review' | 'Reviewed & Attested' | 'Rejected' | 'Approved';
  reviewerSignOff?: {
    name: string;
    role: string;
    timestamp: string;
    comment: string;
  };
  executiveSummary: string;
  sections: ReportSection[];
}

export interface Project {
  id: string;
  companyName: string;
  ticker: string;
  sector: string;
  fiscalYearEnd: string;
  dataOrigin: DataOrigin;
  periods: string[];
  status: WorkflowStatus;
  reviewerStatus: 'Needs Review' | 'In Review' | 'Approved' | 'Changes Requested';
  createdAt: string;
  updatedAt: string;
  financials: PeriodFinancials[];
  sources: Source[];
  metrics: Metric[];
  ratios: Ratio[];
  claims: Claim[];
  risks: Risk[];
  agents: AgentNode[];
  report: Report;
  reviews: ReviewEvent[];
  pipelineEvents?: PipelineEventLog[];
  simulateRiskFailure?: boolean;
  injectionAttemptsBlocked?: number;
  fallbackUsed?: boolean;
  fallbackNotice?: string;
  nistChecklist?: NistMitigationItem[];
}

export interface AuditEntry {
  id: string;
  projectId?: string;
  timestamp: string;
  actor: string;
  actorRole: 'Analyst' | 'Reviewer' | 'System Orchestrator';
  action: string;
  category?: string;
  beforeValue?: string;
  afterValue?: string;
  targetType:
    | 'Project'
    | 'Source'
    | 'Metric'
    | 'Ratio'
    | 'Claim'
    | 'Risk'
    | 'Agent'
    | 'Report'
    | 'Auth'
    | 'Watchlist'
    | 'Settings';
  targetId: string;
  targetLabel: string;
  targetRoute: string;
  details: string;
}

export interface WatchlistItem {
  id: string;
  projectId: string;
  companyName: string;
  ticker: string;
  dataOrigin: DataOrigin;
  alertHeadline: string;
  alertDetail: string;
  severity: 'Info' | 'Warning' | 'Critical';
  targetRoute: string;
  addedAt: string;
  trackedRatioIds: string[];
  latestPeriod?: string;
  lastCheckedAt?: string;
  triggerRule?: string;
  thresholdUsed?: string;
  valuesCompared?: string;
  metricId?: string;
  ratioId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Analyst' | 'Reviewer';
  isCloudSynced?: boolean;
}
