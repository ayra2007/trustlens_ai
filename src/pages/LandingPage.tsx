import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Play,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  StatusBadge,
  SourceChip,
  ClaimChip,
  SyntheticOriginTag,
  Modal,
  ToastContainer,
} from '../components/ui/primitives';
import { GlobalComplianceBanner, GlobalSourceDrawer } from '../components/layout/AppShell';
import {
  GlobalSearchModal,
  BrandWordmark,
  ColorfulProjectName,
} from '../components/layout/GlobalSearchModal';
import { DEFAULT_PROJECT_ID } from '../data/seed';

interface FeatureDetail {
  id: string;
  title: string;
  tagline: string;
  description: string;
  miniPreview: string;
  route: string;
}

const FEATURES_LIST: FeatureDetail[] = [
  {
    id: 'doc-retrieval',
    title: 'Document Retrieval',
    tagline: 'Passage-indexed filings with staleness & date guards',
    description:
      'Ingests annual reports, quarterly releases, and market notes with page-level passage citations. Automatically flags documents older than 12 months before the reporting period end (such as S5 from March 2023) and undated uploads (S6).',
    miniPreview: 'Aurora S1 (84 pages, Feb 2025) → Indexed p.31 Operations & p.47 Supplier Risk; S5 flagged STALE.',
    route: `/app/project/${DEFAULT_PROJECT_ID}/sources/S1?page=31&highlight=S1-P1`,
  },
  {
    id: 'fin-analysis',
    title: 'Financial Analysis',
    tagline: 'Deterministic ratio computation with zero/null safety',
    description:
      'All margins, liquidity multiples, and growth rates are computed by pure deterministic TypeScript functions—never hallucinated by an LLM. Explicitly surfaces missing values (such as Q4 FY2024 Operating Cash Flow = null).',
    miniPreview: 'Gross Margin: ((540.0 - 324.0)/540.0) = 40.0% · Net Margin: 11.0% · Current Ratio: 1.67x.',
    route: `/app/project/${DEFAULT_PROJECT_ID}/analysis`,
  },
  {
    id: 'multi-agent',
    title: 'Multi-Agent Workflow',
    tagline: '5 specialized agents with inspectable input/output logs',
    description:
      'Orchestrates Retrieve, Analyze, Verify, Assess Risk, and Report agents sequentially. Every agent exposes its exact inputs, outputs, execution logs, and duration.',
    miniPreview: 'Step 1 Retrieve → Step 2 Analyze → Step 3 Verify → Step 4 Risk → Step 5 Report (Needs Review).',
    route: `/app/project/${DEFAULT_PROJECT_ID}/pipeline`,
  },
  {
    id: 'evidence-verification',
    title: 'Evidence Verification',
    tagline: 'Cross-source claim checking & contradiction detection',
    description:
      'Compares every management statement and analyst assertion against audited tables and multi-quarter sums. Classifies claims as Verified, Partially Supported, Contradicted, or Unsupported.',
    miniPreview: 'Claim C2 ("FY2024 revenue was $552.0M") → Contradicted by S1 p.31 ($540.0M) and Q1–Q4 sum.',
    route: `/app/project/${DEFAULT_PROJECT_ID}/verification`,
  },
  {
    id: 'risk-center',
    title: 'Risk Center',
    tagline: 'Separates evidence-backed risks from analyst hypotheses',
    description:
      'Catalogs operational, disclosure, and data-integrity risks by severity while explicitly distinguishing filing-backed facts (R1: 38% supplier concentration) from investigative hypotheses (R5: component cost pressure).',
    miniPreview: 'R1 High (S1 p.47 Supplier 38%) · R2 High ($12M Revenue Conflict) · R5 Medium (Hypothesis).',
    route: `/app/project/${DEFAULT_PROJECT_ID}/risks`,
  },
  {
    id: 'reports',
    title: 'Reports',
    tagline: 'Traceable executive dossiers with inline citations',
    description:
      'Compiles structured decision-support dossiers where every sentence links directly to its underlying source passage, claim verification record, and metric calculation.',
    miniPreview: '4-Section Aurora FY2024 Dossier with interactive SourceChips, ClaimChips, and Reviewer attestation.',
    route: `/app/project/${DEFAULT_PROJECT_ID}/report`,
  },
  {
    id: 'human-review',
    title: 'Human Review',
    tagline: 'Mandatory analyst/reviewer attestation before sign-off',
    description:
      'Enforces human-in-the-loop governance. Analysts and Reviewers can accept, reject, or request revision on individual claims and sign off on reports with full audit trail logging.',
    miniPreview: 'Reviewer Elena Rostova, CFA rejected Claim C2 ($552M) and escalated Risk R1.',
    route: `/app/project/${DEFAULT_PROJECT_ID}/verification/claim/C2`,
  },
  {
    id: 'watchlist',
    title: 'Watchlist',
    tagline: 'Automated threshold alerts & filing discrepancy triggers',
    description:
      'Monitors tracked entities for margin shifts, cross-document contradictions, and missing quarterly disclosures.',
    miniPreview: 'Alert: Net margin rose +0.8pp vs FY2023 · Critical: S1 vs S2 $12.0M revenue conflict.',
    route: '/app/watchlist',
  },
  {
    id: 'comparison-mode',
    title: 'Comparison Mode',
    tagline: 'Side-by-side period & project benchmarking',
    description:
      'Compare FY2022, FY2023, and FY2024 financial metrics, ratios, and claim verification rates side by side.',
    miniPreview: 'FY2022 ($410M) vs FY2023 ($468M) vs FY2024 ($540M) across 8 deterministic ratios.',
    route: '/app/compare',
  },
  {
    id: 'health-snapshot',
    title: 'Health Snapshot',
    tagline: '6 core deterministic indicators without buy/sell ratings',
    description:
      'Summarizes Gross Margin, Net Margin, Current Ratio, Debt-to-Equity, ROA, and Revenue YoY with period deltas and formula tooltips—strictly without investment advice.',
    miniPreview: 'GM 40.0% (+1.8pp) · NM 11.0% (+0.8pp) · CR 1.67x (+0.07x) · D/E 1.25x · ROA 8.9% · YoY +15.4%.',
    route: `/app/project/${DEFAULT_PROJECT_ID}/analysis/ratio/RAT-NM`,
  },
];

const AGENT_STEPS = [
  {
    step: 1,
    id: 'agent-retrieve',
    role: 'Retrieve',
    title: '1. Retrieve & Validate Provenance',
    summary: 'Indexes source passages, checks publication dates, flags staleness (>12m), and quarantines prompt injections.',
    inputs: 'Raw filings (S1–S4), Market reports (S5), Analyst notes (S6), Adversarial test docs (S7)',
    outputs: '14 Passage-level citations, S5 Staleness flag, S6 Missing-date flag, S7 Injection quarantine',
    auroraExample:
      'In Aurora Dynamics (AURD), Retrieve indexed S1 p.31 & p.47, flagged S5 (March 2023) as stale relative to Dec 31, 2024, and quarantined S7 p.1 override instructions.',
    route: `/app/project/${DEFAULT_PROJECT_ID}/pipeline/agent/agent-retrieve`,
  },
  {
    step: 2,
    id: 'agent-analyze',
    role: 'Analyze',
    title: '2. Deterministic Financial Analysis',
    summary: 'Extracts structured tables and computes margins, liquidity ratios, and YoY/QoQ growth deterministically.',
    inputs: 'Audited FY2022–FY2024 annual tables & Q1–Q4 FY2024 quarterly series',
    outputs: '12 Metrics + 8 Ratios (Gross Margin 40.0%, Net Margin 11.0%, Current Ratio 1.67x, D/E 1.25x, ROA 8.9%)',
    auroraExample:
      'Recalculated FY2024 revenue from quarters ($120M + $128M + $137M + $155M = $540.0M), computed Net Margin = 59.4 / 540.0 = 11.0%, and explicitly preserved Q4 OCF = null.',
    route: `/app/project/${DEFAULT_PROJECT_ID}/pipeline/agent/agent-analyze`,
  },
  {
    step: 3,
    id: 'agent-verify',
    role: 'Verify',
    title: '3. Cross-Source Evidence Verification',
    summary: 'Audits every claim against deterministic calculations and primary filing passages.',
    inputs: '9 Claims (C1–C9) extracted across S1, S2, S5, and S6',
    outputs: '3 Verified (C1, C4, C6), 3 Partially Supported (C7, C8, C9), 2 Contradicted (C2, C3), 1 Unsupported (C5)',
    auroraExample:
      'Exposed that S2 press release claim of $552.0M revenue (C2) and 18% growth (C3) is contradicted by audited S1 p.31 ($540.0M and 15.4% YoY growth).',
    route: `/app/project/${DEFAULT_PROJECT_ID}/pipeline/agent/agent-verify`,
  },
  {
    step: 4,
    id: 'agent-risk',
    role: 'Assess Risk',
    title: '4. Risk & Hypothesis Separation',
    summary: 'Synthesizes evidence-backed operational/disclosure risks and labels speculative hypotheses clearly.',
    inputs: 'Item 1A Risk Factors (S1 p.47), Verification discrepancies, Procurement commentary (S4 p.14)',
    outputs: '6 Risk Cards (R1–R6) categorized by High/Medium/Low severity and Evidence vs Hypothesis type',
    auroraExample:
      'Logged evidence-backed High Risk R1 (38% single supplier Helios MicroSystems on S1 p.47) alongside clearly labeled Hypothesis R5 (potential magnet cost margin pressure).',
    route: `/app/project/${DEFAULT_PROJECT_ID}/pipeline/agent/agent-risk`,
  },
  {
    step: 5,
    id: 'agent-report',
    role: 'Report',
    title: '5. Traceable Dossier & Human Review Gate',
    summary: 'Compiles an interactive executive report where every claim and metric is clickable, gated by human review.',
    inputs: 'Verified metrics, ratio tables, claim verification matrix, and risk register',
    outputs: 'Traceable 4-section dossier held in "Needs Review" until human reviewer attestation',
    auroraExample:
      'Generated the Aurora FY2024 dossier with zero buy/sell recommendations and routed Claim C2 & Risk R1 to human review.',
    route: `/app/project/${DEFAULT_PROJECT_ID}/pipeline/agent/agent-report`,
  },
];

const TRUST_CARDS = [
  {
    id: 'evidence-backed',
    title: 'Evidence-Backed Verification',
    summary: 'Every claim requires a primary passage citation and deterministic math check before earning a Verified badge.',
    sectionHash: 'evidence-backed',
  },
  {
    id: 'transparent-uncertainty',
    title: 'Transparent Uncertainty & Null Handling',
    summary: 'Missing data (like Q4 Operating Cash Flow = null) is surfaced explicitly—never interpolated or guessed.',
    sectionHash: 'transparent-uncertainty',
  },
  {
    id: 'traceable-sources',
    title: 'Page-Level Traceable Sources',
    summary: 'Click any SourceChip anywhere in the app to inspect publication dates, staleness flags, and highlighted passages.',
    sectionHash: 'traceable-sources',
  },
  {
    id: 'human-review',
    title: 'Mandatory Human Review Gate',
    summary: 'Reports remain in Draft / Needs Review status until an authenticated Analyst or Reviewer attests to the findings.',
    sectionHash: 'human-review',
  },
  {
    id: 'no-autonomous-trades',
    title: 'Zero Autonomous Trades or Ratings',
    summary: 'Strictly decision-support infrastructure. No buy/sell/hold ratings or trade execution APIs exist.',
    sectionHash: 'no-autonomous-trades',
  },
  {
    id: 'prompt-injection-guard',
    title: 'Adversarial Prompt-Injection Guard',
    summary: 'Untrusted document text (such as S7 p.1 override instructions) is quarantined and never executed as system instructions.',
    sectionHash: 'prompt-injection-guard',
  },
];

const EXTERNAL_RESOURCES = [
  {
    id: 'sec-edgar',
    name: 'SEC EDGAR Filing Architecture',
    badge: 'Primary Regulatory Filings',
    purpose: 'Provides structured authoritative corporate disclosures (Form 10-K, Form 10-Q, Form 8-K) for public issuers.',
    usage: 'TrustLens models its passage citation hierarchy and live metadata fetch adapter in the New Research wizard on EDGAR standards.',
    limitations: 'Browser CORS policies may restrict direct client-side EDGAR binary downloads without a server header; unaudited 8-K press releases can conflict with audited 10-K schedules.',
  },
  {
    id: 'finqa',
    name: 'FinQA Numerical Reasoning Benchmark',
    badge: 'Deterministic Math Grounding',
    purpose: 'Academic benchmark evaluating multi-step numerical reasoning over hybrid financial tables and text passages.',
    usage: 'Inspires our strict separation between table extraction and pure TypeScript deterministic ratio functions (Gross Margin, Net Margin, ROA, ROE, Current Ratio, D/E).',
    limitations: 'Free-form generative models frequently make rounding or denominator errors; TrustLens eliminates this by executing all arithmetic in tested code.',
  },
  {
    id: 'nist-ai-rmf',
    name: 'NIST AI Risk Management Framework (AI RMF 1.0)',
    badge: 'Governance & Auditability',
    purpose: 'Establishes Govern, Map, Measure, and Manage functions for trustworthy socio-technical AI systems.',
    usage: 'Shapes our immutable AuditEntry log, human reviewer sign-off workflow, staleness detection, and adversarial prompt-injection quarantine.',
    limitations: 'Framework compliance requires active human oversight—automated checks complement but never replace qualified financial review.',
  },
];

export const LandingPage: React.FC = () => {
  const { loginAsAnalyst, triggerPipelineRun } = useAppStore();
  const navigate = useNavigate();
  const [selectedStep, setSelectedStep] = useState<number>(3);
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetail | null>(null);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({
    'sec-edgar': true,
    finqa: false,
    'nist-ai-rmf': false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLaunchLivePipeline = () => {
    loginAsAnalyst('Analyst');
    navigate(`/app/project/${DEFAULT_PROJECT_ID}/pipeline`);
    setTimeout(() => {
      triggerPipelineRun(DEFAULT_PROJECT_ID);
    }, 200);
  };

  const currentStepObj = AGENT_STEPS.find((s) => s.step === selectedStep) || AGENT_STEPS[2];

  return (
    <div className="min-h-screen flex flex-col bg-lavender-mesh text-[#2A1F45]">
      <GlobalComplianceBanner />

      {/* Sticky Magazine-Style Navigation with Vibrant Gradient */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md text-[#F3EBFA] border-b border-[#8A6BC2] px-6 md:px-12 py-3.5 flex items-center justify-between gap-6"
        style={{
          background:
            'linear-gradient(90deg, #2A1F45 0%, #8A6BC2 55%, #2A1F45 100%)',
        }}
      >
        <Link to="/" className="whitespace-nowrap shrink-0">
          <BrandWordmark theme="dark" size="md" />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-[#F3EBFA]">
          <button
            type="button"
            onClick={() => scrollToSection('features')}
            className="hover:text-[#D4FF3F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            10 Capabilities
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-[#D4FF3F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            How it Works
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('trust')}
            className="hover:text-[#D4FF3F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Trust
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('resources')}
            className="hover:text-[#D4FF3F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Resources
          </button>
          <Link
            to="/login"
            className="hover:text-[#D4FF3F] transition-colors whitespace-nowrap shrink-0"
          >
            Login
          </Link>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#2A1F45] hover:bg-[#8A6BC2] text-[#F3EBFA] border-[1.5px] border-[#D4FF3F] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[#D4FF3F]" />
            <span className="hidden sm:inline text-[#EAF7A8]">Search Dossier</span>
            <kbd className="px-1.5 py-0.5 rounded-full bg-[#D4FF3F] text-[#2A1F45] font-mono text-[10px] font-extrabold">
              Ctrl+K
            </kbd>
          </button>
          <Link
            to="/signup"
            className="px-5 py-2 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] text-[#2A1F45] border-[1.5px] border-[#2A1F45] text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* HERO SECTION: Magazine Layout with Multi-Color Mesh + Glossy 3D Interlocked Ribbon/Torus SVG */}
      <section
        className="relative overflow-hidden border-b border-[#2A1F45]/35 py-12 md:py-16 px-6 md:px-12"
        style={{
          background:
            'radial-gradient(circle at 15% 22%, rgba(212, 255, 63, 0.38) 0%, transparent 42%), radial-gradient(circle at 82% 28%, rgba(227, 66, 52, 0.28) 0%, transparent 46%), radial-gradient(circle at 52% 75%, rgba(138, 107, 194, 0.55) 0%, transparent 50%), linear-gradient(135deg, #CBB3E8 0%, #8A6BC2 48%, #EAF7A8 100%)',
        }}
      >
        <div className="max-w-[1440px] mx-auto relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Editorial Column: Small Magazine Kicker, Large Playfair Display Headline, Pill CTAs */}
          <div className="lg:col-span-5 space-y-6 z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] border-2 border-[#E34234] text-[11px] font-mono uppercase tracking-[0.14em] font-extrabold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#E34234]" />
                <span>EVERY CLAIM BACKED BY PROOF · ZERO HALLUCINATED MATH</span>
              </div>
            </div>

            <h1
              className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#2A1F45] leading-[1.04]"
              style={{ textWrap: 'balance' }}
            >
              Financial research you can{' '}
              <span className="italic font-extrabold px-2.5 py-0.5 rounded-2xl bg-[#2A1F45] text-[#D4FF3F] border-2 border-[#E34234] inline-block">
                actually
              </span>{' '}
              <span className="bg-gradient-to-r from-[#B8301F] via-[#E34234] to-[#2A1F45] bg-clip-text text-transparent font-extrabold">
                trust
              </span>
            </h1>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#2A1F45] border-l-4 border-[#D4FF3F] shadow-sm">
              <span className="font-display italic font-bold text-sm md:text-base bg-gradient-to-r from-[#D4FF3F] via-[#EAF7A8] to-[#F3EBFA] bg-clip-text text-transparent">
                “Every claim backed by proof. Every number traced to its source passage.”
              </span>
            </div>

            <p className="text-base text-[#2A1F45] font-medium max-w-md leading-relaxed">
              A workspace for deterministic financial ratios, cross-source contradiction detection, and page-indexed provenance—with mandatory human review.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* Primary CTA: Solid Chartreuse Pill with Dark Lavender Text */}
              <Link
                to="/signup"
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] text-[#2A1F45] border-2 border-[#2A1F45] font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer whitespace-nowrap shadow-md"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Secondary CTA: Deep Lavender & Tomato Accented Pill Button */}
              <button
                type="button"
                onClick={handleLaunchLivePipeline}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#2A1F45] hover:bg-[#8A6BC2] text-[#F3EBFA] border-2 border-[#E34234] font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer whitespace-nowrap shadow-md"
              >
                <Play className="w-3.5 h-3.5 text-[#D4FF3F] fill-[#D4FF3F]" />
                <span>Run Live Pipeline</span>
              </button>
            </div>

            <div className="pt-3 p-3.5 rounded-2xl bg-[#2A1F45] border-2 border-[#8A6BC2] flex flex-wrap items-center justify-between gap-3 shadow-md">
              <ColorfulProjectName
                companyName="Aurora Dynamics"
                ticker="AURD"
                theme="dark"
                size="sm"
              />
              <SyntheticOriginTag origin="SYNTHETIC — FICTIONAL" />
            </div>
          </div>

          {/* Center / Right: Glossy 3D Interlocked Ribbon/Torus Shapes in Lavender & Tomato Red + Chartreuse Sphere & Orbit Ring + 5 Agent Nodes */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <svg
              viewBox="0 0 620 520"
              className="w-full h-auto max-w-[580px]"
              role="img"
              aria-label="Glossy 3D interlocked lavender and tomato red torus ribbons with deep tomato shadows, muted chartreuse glowing highlights, orbit ring, and five multi-agent verification nodes"
            >
              <defs>
                {/* Deep 3D Volumetric Shadow Filter with Tomato Red & Dark Lavender Depth */}
                <filter id="tomatoDeepShadow" x="-20%" y="-20%" width="145%" height="145%">
                  <feDropShadow dx="6" dy="14" stdDeviation="9" floodColor="#2A1F45" floodOpacity="0.58" />
                  <feDropShadow dx="-3" dy="6" stdDeviation="6" floodColor="#B8301F" floodOpacity="0.48" />
                </filter>

                {/* Subtle Muted Chartreuse #EAF7A8 Glowing Highlight Filter */}
                <filter id="chartreuseSoftGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blurGlow" />
                  <feMerge>
                    <feMergeNode in="blurGlow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Ambient Halo Filter for Glowing Orbs */}
                <filter id="orbAmbientGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="halo" />
                  <feMerge>
                    <feMergeNode in="halo" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Intensified 3D Tomato Red Tube Gradient with Richer Core & Rim Contrast */}
                <linearGradient id="tomato3D" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EAF7A8" stopOpacity="0.45" />
                  <stop offset="12%" stopColor="#E34234" />
                  <stop offset="42%" stopColor="#E34234" />
                  <stop offset="72%" stopColor="#B8301F" />
                  <stop offset="92%" stopColor="#2A1F45" />
                  <stop offset="100%" stopColor="#B8301F" />
                </linearGradient>

                {/* Deep Tomato Red #E34234 / #B8301F Under-Shadow & Occlusion Gradient */}
                <linearGradient id="tomatoDeepShadowGrad" x1="0%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="#B8301F" stopOpacity="0.88" />
                  <stop offset="45%" stopColor="#E34234" stopOpacity="0.72" />
                  <stop offset="80%" stopColor="#2A1F45" stopOpacity="0.92" />
                  <stop offset="100%" stopColor="#B8301F" stopOpacity="0.85" />
                </linearGradient>

                {/* Glossy 3D Tomato Specular Highlight with Muted Chartreuse #EAF7A8 Rim */}
                <linearGradient id="tomatoHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EAF7A8" stopOpacity="0.9" />
                  <stop offset="28%" stopColor="#F3EBFA" stopOpacity="0.75" />
                  <stop offset="65%" stopColor="#E34234" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#B8301F" stopOpacity="0" />
                </linearGradient>

                {/* Intensified 3D Lavender Tube Gradient with Tomato Red Subsurface Shadow */}
                <linearGradient id="lavender3D" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EAF7A8" stopOpacity="0.5" />
                  <stop offset="14%" stopColor="#F3EBFA" />
                  <stop offset="38%" stopColor="#CBB3E8" />
                  <stop offset="68%" stopColor="#8A6BC2" />
                  <stop offset="88%" stopColor="#B8301F" />
                  <stop offset="100%" stopColor="#2A1F45" />
                </linearGradient>

                {/* Glossy Lavender Specular Highlight with Muted Chartreuse #EAF7A8 Glow */}
                <linearGradient id="lavenderHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#EAF7A8" stopOpacity="0.92" />
                  <stop offset="35%" stopColor="#F3EBFA" stopOpacity="0.82" />
                  <stop offset="75%" stopColor="#CBB3E8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#8A6BC2" stopOpacity="0" />
                </linearGradient>

                {/* Pure Muted Chartreuse #EAF7A8 Specular Edge Glint */}
                <linearGradient id="chartreuseEdgeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EAF7A8" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#D4FF3F" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#EAF7A8" stopOpacity="0" />
                </linearGradient>

                {/* Glossy 3D Chartreuse Sphere Gradient */}
                <radialGradient id="chartreuseSphere" cx="32%" cy="28%" r="68%">
                  <stop offset="0%" stopColor="#EAF7A8" />
                  <stop offset="38%" stopColor="#D4FF3F" />
                  <stop offset="78%" stopColor="#8A6BC2" />
                  <stop offset="100%" stopColor="#2A1F45" />
                </radialGradient>

                {/* Ambient Tomato + Chartreuse Backlight Radial Aura */}
                <radialGradient id="heroRibbonAura" cx="52%" cy="48%" r="48%">
                  <stop offset="0%" stopColor="#E34234" stopOpacity="0.28" />
                  <stop offset="55%" stopColor="#8A6BC2" stopOpacity="0.18" />
                  <stop offset="85%" stopColor="#EAF7A8" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#CBB3E8" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Soft Ambient 3D Backlight Aura Behind Interlocked Ribbons */}
              <ellipse cx="335" cy="255" rx="220" ry="195" fill="url(#heroRibbonAura)" />

              {/* Bottom Left Chartreuse Glowing Orb with Muted Chartreuse #EAF7A8 Outer Halo */}
              <circle
                cx="155"
                cy="465"
                r="64"
                fill="none"
                stroke="#EAF7A8"
                strokeWidth="3"
                opacity="0.55"
                filter="url(#orbAmbientGlow)"
              />
              <circle cx="155" cy="465" r="58" fill="url(#chartreuseSphere)" filter="url(#tomatoDeepShadow)" />
              <ellipse
                cx="136"
                cy="444"
                rx="18"
                ry="10"
                transform="rotate(-28 136 444)"
                fill="#EAF7A8"
                 opacity="0.85"
                filter="url(#chartreuseSoftGlow)"
              />

              {/* Back Segment of Thin Chartreuse Orbit Ring with Muted Chartreuse Glow */}
              <ellipse
                cx="310"
                cy="255"
                rx="235"
                ry="88"
                transform="rotate(-24 310 255)"
                fill="none"
                stroke="#EAF7A8"
                strokeWidth="4"
                opacity="0.35"
                filter="url(#chartreuseSoftGlow)"
              />
              <ellipse
                cx="310"
                cy="255"
                rx="235"
                ry="88"
                transform="rotate(-24 310 255)"
                fill="none"
                stroke="#D4FF3F"
                strokeWidth="2"
                strokeDasharray="8 4"
              />

              {/* === LAYER 1: 3D Glossy Tomato Red Interlocked Torus Loop 1 (Upper/Right Loop) === */}
              {/* Deep Tomato Red #E34234 / #B8301F Extruded 3D Under-Shadow */}
              <path
                d="M 181 49 C 241 129, 421 104, 431 214 C 441 314, 296 374, 271 464"
                fill="none"
                stroke="url(#tomatoDeepShadowGrad)"
                strokeWidth="80"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* Main Sculpted Tomato Red 3D Cylinder */}
              <path
                d="M 175 40 C 235 120, 415 95, 425 205 C 435 305, 290 365, 265 455"
                fill="none"
                stroke="url(#tomato3D)"
                strokeWidth="72"
                strokeLinecap="round"
                filter="url(#tomatoDeepShadow)"
              />
              {/* Deep Core Shadow Along Inner Edge of Tomato Loop 1 */}
              <path
                d="M 168 48 C 228 128, 404 106, 414 212 C 424 308, 282 368, 258 456"
                fill="none"
                stroke="#B8301F"
                strokeWidth="12"
                strokeLinecap="round"
                opacity="0.7"
              />
              {/* Primary Specular Gloss Line on Tomato Loop 1 */}
              <path
                d="M 185 45 C 242 122, 405 100, 415 205 C 423 295, 295 355, 272 445"
                fill="none"
                stroke="url(#tomatoHighlight)"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Glowing Muted Chartreuse #EAF7A8 Rim Highlight on Tomato Loop 1 */}
              <path
                d="M 188 42 C 245 116, 398 96, 418 192"
                fill="none"
                stroke="url(#chartreuseEdgeGlow)"
                strokeWidth="4.5"
                strokeLinecap="round"
                filter="url(#chartreuseSoftGlow)"
              />

              {/* === LAYER 2: 3D Glossy Lavender Interlocked Ribbon/Torus (Weaving Through Tomato Loop) === */}
              {/* Deep Tomato Red #E34234 Cast Shadow Under Lavender Ribbon */}
              <path
                d="M 262 35 C 287 150, 227 245, 322 305 C 412 362, 492 395, 512 490"
                fill="none"
                stroke="url(#tomatoDeepShadowGrad)"
                strokeWidth="82"
                strokeLinecap="round"
                opacity="0.78"
              />
              {/* Main Sculpted Lavender 3D Cylinder */}
              <path
                d="M 255 25 C 280 140, 220 235, 315 295 C 405 352, 485 385, 505 480"
                fill="none"
                stroke="url(#lavender3D)"
                strokeWidth="76"
                strokeLinecap="round"
                filter="url(#tomatoDeepShadow)"
              />
              {/* Tomato Red #E34234 Reflected Bounce Shadow Along Lower Edge of Lavender Ribbon */}
              <path
                d="M 248 34 C 272 146, 212 242, 307 303 C 397 360, 477 392, 497 484"
                fill="none"
                stroke="#E34234"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.45"
              />
              {/* Primary Specular Gloss Line on Lavender Ribbon */}
              <path
                d="M 263 32 C 286 140, 232 230, 322 288 C 408 344, 480 380, 498 470"
                fill="none"
                stroke="url(#lavenderHighlight)"
                strokeWidth="18"
                strokeLinecap="round"
              />
              {/* Subtle Glowing Muted Chartreuse #EAF7A8 Crest Highlight on Lavender Ribbon */}
              <path
                d="M 266 30 C 288 135, 238 224, 326 282 C 395 326, 455 360, 488 438"
                fill="none"
                stroke="url(#chartreuseEdgeGlow)"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#chartreuseSoftGlow)"
              />

              {/* === LAYER 3: 3D Glossy Tomato Red Lower Interlocking Ring Overpass === */}
              {/* Deep Tomato Red #E34234 / #2A1F45 Cast Shadow Over Lavender Intersection */}
              <path
                d="M 231 473 C 201 383, 351 323, 401 413 C 431 466, 361 513, 311 483"
                fill="none"
                stroke="url(#tomatoDeepShadowGrad)"
                strokeWidth="74"
                strokeLinecap="round"
                opacity="0.88"
              />
              {/* Main Tomato Red Lower Ring Overpass */}
              <path
                d="M 225 465 C 195 375, 345 315, 395 405 C 425 458, 355 505, 305 475"
                fill="none"
                stroke="url(#tomato3D)"
                strokeWidth="66"
                strokeLinecap="round"
                filter="url(#tomatoDeepShadow)"
              />
              {/* Specular Gloss + Muted Chartreuse #EAF7A8 Rim on Lower Overpass */}
              <path
                d="M 232 458 C 205 380, 342 325, 388 405"
                fill="none"
                stroke="url(#tomatoHighlight)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 235 452 C 212 382, 338 330, 382 398"
                fill="none"
                stroke="#EAF7A8"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.85"
                filter="url(#chartreuseSoftGlow)"
              />

              {/* === LAYER 4: 3D Glossy Lavender Center Arch Overpass === */}
              {/* Deep Tomato Red #E34234 / #B8301F Contact Shadow Beneath Arch Overpass */}
              <path
                d="M 301 244 C 371 194, 476 264, 491 379"
                fill="none"
                stroke="url(#tomatoDeepShadowGrad)"
                strokeWidth="74"
                strokeLinecap="round"
                opacity="0.82"
              />
              {/* Main Lavender Center Arch Overpass */}
              <path
                d="M 295 235 C 365 185, 470 255, 485 370"
                fill="none"
                stroke="url(#lavender3D)"
                strokeWidth="68"
                strokeLinecap="round"
                filter="url(#tomatoDeepShadow)"
              />
              {/* Specular Gloss + Glowing Muted Chartreuse #EAF7A8 Highlight on Center Arch */}
              <path
                d="M 302 228 C 368 185, 462 252, 476 362"
                fill="none"
                stroke="url(#lavenderHighlight)"
                strokeWidth="15"
                strokeLinecap="round"
              />
              <path
                d="M 306 224 C 366 186, 454 246, 470 348"
                fill="none"
                stroke="#EAF7A8"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.9"
                filter="url(#chartreuseSoftGlow)"
              />

              {/* Front Segment of Thin Chartreuse Orbit Ring + Glowing Muted Chartreuse #EAF7A8 Aura */}
              <path
                d="M 96 352 C 165 415, 395 320, 524 158"
                fill="none"
                stroke="#EAF7A8"
                strokeWidth="6"
                opacity="0.5"
                filter="url(#chartreuseSoftGlow)"
              />
              <path
                d="M 96 352 C 165 415, 395 320, 524 158"
                fill="none"
                stroke="#D4FF3F"
                strokeWidth="2.5"
              />
              <path
                d="M 96 352 C 165 415, 395 320, 524 158"
                fill="none"
                stroke="#2A1F45"
                strokeWidth="1.5"
                className="animate-flow"
              />

              {/* Floating Glossy Chartreuse Sphere on Orbit Ring with Muted Chartreuse #EAF7A8 Glow */}
              <circle
                cx="490"
                cy="115"
                r="33"
                fill="none"
                stroke="#EAF7A8"
                strokeWidth="2.5"
                opacity="0.65"
                filter="url(#orbAmbientGlow)"
              />
              <circle cx="490" cy="115" r="28" fill="url(#chartreuseSphere)" filter="url(#tomatoDeepShadow)" />
              <circle
                cx="480"
                cy="105"
                r="8"
                fill="#EAF7A8"
                opacity="0.95"
                filter="url(#chartreuseSoftGlow)"
              />

              {/* 5 Interactive Multi-Agent Nodes Integrated Along the Orbit & Ribbons */}
              {[
                { x: 30, y: 70, step: 1, label: '01. Retrieve', sub: 'S1–S7 Provenance' },
                { x: 30, y: 145, step: 2, label: '02. Analyze', sub: 'Deterministic Math' },
                { x: 30, y: 220, step: 3, label: '03. Verify', sub: 'C1–C9 Cross-Check' },
                { x: 30, y: 295, step: 4, label: '04. Assess Risk', sub: 'R1–R6 & Hypotheses' },
                { x: 30, y: 370, step: 5, label: '05. Report', sub: 'Human Review Gate' },
              ].map((node) => {
                const isSelected = selectedStep === node.step;
                return (
                  <g
                    key={node.label}
                    onClick={() => setSelectedStep(node.step)}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <rect
                        x={node.x - 3}
                        y={node.y - 3}
                        width="154"
                        height="58"
                        rx="29"
                        fill="none"
                        stroke="#EAF7A8"
                        strokeWidth="2.5"
                        filter="url(#chartreuseSoftGlow)"
                      />
                    )}
                    <rect
                      x={node.x}
                      y={node.y}
                      width="148"
                      height="52"
                      rx="26"
                      fill={isSelected ? '#D4FF3F' : '#F3EBFA'}
                      stroke="#2A1F45"
                      strokeWidth="1.5"
                    />
                    <text
                      x={node.x + 20}
                      y={node.y + 23}
                      fill="#2A1F45"
                      fontSize="12"
                      fontWeight="700"
                      fontFamily="Playfair Display, Georgia, serif"
                    >
                      {node.label}
                    </text>
                    <text
                      x={node.x + 20}
                      y={node.y + 39}
                      fill="#6B5B86"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {node.sub}
                    </text>
                  </g>
                );
              })}

              {/* Interactive Report Dossier Pill Badge at Bottom Right */}
              <g
                onClick={() => navigate(`/app/project/${DEFAULT_PROJECT_ID}/report`)}
                className="cursor-pointer"
              >
                <rect
                  x="385"
                  y="425"
                  width="215"
                  height="68"
                  rx="34"
                  fill="#2A1F45"
                  stroke="#EAF7A8"
                  strokeWidth="2.5"
                  filter="url(#tomatoDeepShadow)"
                />
                <text
                  x="412"
                  y="453"
                  fill="#D4FF3F"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="Playfair Display, Georgia, serif"
                >
                  AURD FY2024 Dossier →
                </text>
                <text
                  x="412"
                  y="473"
                  fill="#EAF7A8"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  S1 $540M vs S2 $552M Caught
                </text>
              </g>
            </svg>
          </div>

          {/* Right Editorial Micro-Column (Magazine Layout Details) */}
          <div className="lg:col-span-2 flex lg:flex-col justify-between gap-6 border-t lg:border-t-0 lg:border-l border-[#2A1F45]/25 pt-6 lg:pt-0 lg:pl-6 text-xs text-[#2A1F45]">
            <div className="space-y-3">
              <div className="font-mono uppercase tracking-[0.16em] text-[11px] font-semibold">
                SOURCES
                <br />
                RATIOS
                <br />
                GOVERNANCE
              </div>
              <div className="w-6 h-[1.5px] bg-[#2A1F45]" />
              <p className="text-[11px] uppercase tracking-wider text-[#6B5B86] leading-relaxed">
                A DETERMINISTIC VERIFICATION ARCHITECTURE FOR INSTITUTIONAL RESEARCH.
              </p>
            </div>

            <div className="space-y-4 font-mono">
              <div>
                <div className="text-2xl font-display font-bold text-[#2A1F45]">15.4%</div>
                <div className="w-6 h-[1.5px] bg-[#2A1F45] my-1" />
                <div className="text-2xl font-display font-bold text-[#B8301F]">18.0%</div>
                <div className="text-[10px] uppercase tracking-widest text-[#6B5B86] mt-1">
                  AUDITED VS S2 CLAIM
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to={`/app/project/${DEFAULT_PROJECT_ID}/pipeline`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] border-[#2A1F45] text-[11px] font-bold uppercase tracking-wider hover:bg-[#D4FF3F] transition-colors"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE VERIFICATION STRIP: Shows real contradiction S1 $540.0M vs S2 $552.0M */}
      <section
        className="border-b border-[#2A1F45]/30 py-6 px-6 md:px-12"
        style={{
          background:
            'linear-gradient(90deg, #2A1F45 0%, #8A6BC2 50%, #2A1F45 100%)',
        }}
      >
        <div
          className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-2xl border-2 border-[#D4FF3F] p-5 shadow-lg"
          style={{
            background:
              'linear-gradient(135deg, #CBB3E8 0%, #EAF7A8 55%, #CBB3E8 100%)',
          }}
        >
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono font-bold uppercase px-3 py-0.5 rounded-full bg-[#2A1F45] text-[#D4FF3F] border border-[#E34234]">
                Live Verification Alert · Cross-Filing Contradiction Caught
              </span>
              <StatusBadge status="Contradicted" />
              <SyntheticOriginTag origin="SYNTHETIC — FICTIONAL" />
            </div>
            <p className="text-sm md:text-base font-bold text-[#2A1F45]">
              Preliminary Press Release <SourceChip sourceId="S2" pageNumber={1} highlightPassageId="S2-P1" /> claims FY2024 revenue of{' '}
              <span className="font-mono font-extrabold text-[#B8301F] underline">$552.0M (+18.0% YoY)</span>, directly contradicting Audited Annual Report{' '}
              <SourceChip sourceId="S1" pageNumber={31} highlightPassageId="S1-P1" /> and the Q1–Q4 sum of{' '}
              <span className="font-mono font-extrabold text-[#2A1F45]">$540.0M (+15.4% YoY)</span>.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <ClaimChip claimId="C2" label="Inspect Claim C2" />
            <Link
              to={`/app/project/${DEFAULT_PROJECT_ID}/verification/claim/C2`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#E34234] hover:bg-[#B8301F] text-[#F3EBFA] border-2 border-[#2A1F45] text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
            >
              <span>Open Verification Proof</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D4FF3F]" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS: 5 Clickable Step Cards + Inline Detail Panel */}
      <section
        id="how-it-works"
        className="py-16 md:py-20 px-6 md:px-12 w-full border-b border-[#2A1F45]/30"
        style={{
          background:
            'radial-gradient(circle at 12% 30%, rgba(212, 255, 63, 0.32) 0%, transparent 44%), radial-gradient(circle at 88% 70%, rgba(227, 66, 52, 0.24) 0%, transparent 42%), linear-gradient(135deg, #CBB3E8 0%, #8A6BC2 52%, #CBB3E8 100%)',
        }}
      >
        <div className="max-w-[1440px] mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold mb-2">
                <span>MULTI-AGENT ORCHESTRATION ENGINE</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-[#2A1F45]">
                How the 5-Agent Verification Pipeline Works
              </h2>
              <p className="text-base text-[#2A1F45] font-medium mt-1">
                Click any agent stage below to inspect its deterministic inputs, outputs, and live Aurora Dynamics (AURD) findings.
              </p>
            </div>
            <Link
              to={`/app/project/${DEFAULT_PROJECT_ID}/pipeline`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] border-2 border-[#2A1F45] text-xs font-bold uppercase tracking-wider text-[#2A1F45] shadow-sm"
            >
              <span>Open Full Pipeline View</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 5 Clickable Step Cards with Vibrant Distinct Color Gradients */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {AGENT_STEPS.map((agent, idx) => {
              const active = selectedStep === agent.step;
              const stepThemes = [
                'linear-gradient(145deg, #2A1F45 0%, #8A6BC2 100%)',
                'linear-gradient(145deg, #D4FF3F 0%, #EAF7A8 100%)',
                'linear-gradient(145deg, #E34234 0%, #B8301F 100%)',
                'linear-gradient(145deg, #8A6BC2 0%, #2A1F45 100%)',
                'linear-gradient(145deg, #EAF7A8 0%, #CBB3E8 100%)',
              ];
              const isLightCard = idx === 1 || idx === 4;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedStep(agent.step)}
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, #2A1F45 0%, #B8301F 100%)'
                      : stepThemes[idx % stepThemes.length],
                  }}
                  className={`text-left rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between shadow-md ${
                    active
                      ? 'text-[#F3EBFA] border-[#D4FF3F] scale-[1.02]'
                      : isLightCard
                      ? 'text-[#2A1F45] border-[#2A1F45] hover:border-[#E34234]'
                      : 'text-[#F3EBFA] border-[#D4FF3F]/60 hover:border-[#D4FF3F]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`font-mono text-xs font-bold px-3 py-1 rounded-full border ${
                          active
                            ? 'bg-[#D4FF3F] text-[#2A1F45] border-[#2A1F45]'
                            : isLightCard
                            ? 'bg-[#2A1F45] text-[#D4FF3F] border-[#E34234]'
                            : 'bg-[#D4FF3F] text-[#2A1F45] border-[#2A1F45]'
                        }`}
                      >
                        Step 0{agent.step} · {agent.role}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold mb-1.5">{agent.title}</h3>
                    <p
                      className={`text-xs leading-relaxed ${
                        active
                          ? 'text-[#EAF7A8]'
                          : isLightCard
                          ? 'text-[#2A1F45]/90 font-medium'
                          : 'text-[#E9DDF6]'
                      }`}
                    >
                      {agent.summary}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-current/25 flex items-center justify-between text-xs font-bold">
                    <span className={active ? 'text-[#D4FF3F]' : isLightCard ? 'text-[#B8301F]' : 'text-[#D4FF3F]'}>
                      {active ? 'Inspecting Details Below' : 'Click to Expand'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Inline Expanded Detail Panel */}
          <div
            className="rounded-2xl border-2 border-[#2A1F45] p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shadow-xl"
            style={{
              background:
                'linear-gradient(135deg, #CBB3E8 0%, #EAF7A8 50%, #CBB3E8 100%)',
            }}
          >
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3.5 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] border-[1.5px] border-[#E34234] font-mono text-xs font-bold">
                  Active Stage: {currentStepObj.role}
                </span>
                <StatusBadge status={currentStepObj.role === 'Report' ? 'Needs Review' : 'Completed'} />
                <SyntheticOriginTag origin="SYNTHETIC — FICTIONAL" />
              </div>
              <h3 className="font-display text-2xl font-bold text-[#2A1F45]">{currentStepObj.title}</h3>
              <p className="text-sm text-[#2A1F45] font-medium">{currentStepObj.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl bg-[#2A1F45] text-[#F3EBFA] border-2 border-[#8A6BC2] p-4">
                  <div className="text-xs font-mono font-bold text-[#D4FF3F] mb-1">AGENT INPUTS</div>
                  <div className="text-xs text-[#E9DDF6] font-medium">{currentStepObj.inputs}</div>
                </div>
                <div className="rounded-xl bg-[#D4FF3F] border-2 border-[#2A1F45] p-4">
                  <div className="text-xs font-mono font-bold text-[#B8301F] mb-1">VERIFIED OUTPUTS</div>
                  <div className="text-xs text-[#2A1F45] font-bold">{currentStepObj.outputs}</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl bg-[#2A1F45] text-[#F3EBFA] border-2 border-[#E34234] p-5 space-y-4 shadow-lg">
              <div className="text-xs font-mono font-bold text-[#D4FF3F]">
                AURORA DYNAMICS (AURD) EXAMPLE
              </div>
              <p className="text-xs leading-relaxed text-[#E9DDF6]">
                {currentStepObj.auroraExample}
              </p>
              <Link
                to={currentStepObj.route}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] text-[#2A1F45] text-xs font-bold transition-colors"
              >
                <span>See it live in Workspace</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID: 10 Integrated Verification Capabilities with Rich Multi-Color Cards */}
      <section
        id="features"
        className="py-16 md:py-20 border-b border-[#8A6BC2] px-6 md:px-12"
        style={{
          background:
            'radial-gradient(circle at 18% 22%, rgba(227, 66, 52, 0.32) 0%, transparent 42%), radial-gradient(circle at 84% 26%, rgba(212, 255, 63, 0.26) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(138, 107, 194, 0.55) 0%, transparent 50%), linear-gradient(135deg, #2A1F45 0%, #8A6BC2 52%, #2A1F45 100%)',
        }}
      >
        <div className="max-w-[1440px] mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4FF3F] text-[#2A1F45] border-[1.5px] border-[#E34234] font-mono text-xs font-extrabold uppercase tracking-wider">
                <span>10 CORE MODULES · FULL-SPECTRUM AUDIT</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#F3EBFA] via-[#D4FF3F] to-[#EAF7A8] bg-clip-text text-transparent">
                10 Integrated Verification Capabilities
              </h2>
              <p className="text-base text-[#E9DDF6]">
                Click any colorful capability card below to preview how it operates on the{' '}
                <span className="font-bold text-[#D4FF3F]">Aurora Dynamics (AURD)</span> dataset and jump directly into the live module.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#E34234] hover:bg-[#B8301F] text-[#F3EBFA] border-2 border-[#D4FF3F] text-xs font-bold cursor-pointer self-start md:self-auto"
            >
              <Search className="w-3.5 h-3.5 text-[#D4FF3F]" />
              <span>Search All 10 Modules (Ctrl+K)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {FEATURES_LIST.map((feat, idx) => {
              // 10 distinct vibrant jewel/editorial color combinations from the locked palette
              const cardStyles: {
                bg: string;
                border: string;
                badgeBg: string;
                badgeText: string;
                titleText: string;
                bodyText: string;
                previewBg: string;
                previewText: string;
                ctaBg: string;
                ctaText: string;
              }[] = [
                // 01 Document Retrieval: Deep Lavender -> Royal Lavender with Chartreuse accents
                {
                  bg: 'linear-gradient(145deg, #2A1F45 0%, #8A6BC2 100%)',
                  border: 'border-[#D4FF3F]',
                  badgeBg: 'bg-[#D4FF3F]',
                  badgeText: 'text-[#2A1F45]',
                  titleText: 'text-[#D4FF3F]',
                  bodyText: 'text-[#F3EBFA]',
                  previewBg: 'bg-[#2A1F45]/80 border-[#B9A0DA]',
                  previewText: 'text-[#EAF7A8]',
                  ctaBg: 'bg-[#D4FF3F]',
                  ctaText: 'text-[#2A1F45]',
                },
                // 02 Financial Analysis: Chartreuse -> Muted Chartreuse with Dark Lavender & Tomato
                {
                  bg: 'linear-gradient(145deg, #D4FF3F 0%, #EAF7A8 100%)',
                  border: 'border-[#2A1F45]',
                  badgeBg: 'bg-[#2A1F45]',
                  badgeText: 'text-[#D4FF3F]',
                  titleText: 'text-[#2A1F45]',
                  bodyText: 'text-[#2A1F45]',
                  previewBg: 'bg-[#2A1F45] border-[#E34234]',
                  previewText: 'text-[#D4FF3F]',
                  ctaBg: 'bg-[#E34234]',
                  ctaText: 'text-[#F3EBFA]',
                },
                // 03 Multi-Agent Workflow: Tomato Red -> Deep Tomato with Chartreuse highlight
                {
                  bg: 'linear-gradient(145deg, #E34234 0%, #B8301F 100%)',
                  border: 'border-[#EAF7A8]',
                  badgeBg: 'bg-[#2A1F45]',
                  badgeText: 'text-[#D4FF3F]',
                  titleText: 'text-[#EAF7A8]',
                  bodyText: 'text-[#F3EBFA]',
                  previewBg: 'bg-[#2A1F45]/85 border-[#D4FF3F]',
                  previewText: 'text-[#EAF7A8]',
                  ctaBg: 'bg-[#D4FF3F]',
                  ctaText: 'text-[#2A1F45]',
                },
                // 04 Evidence Verification: Lavender -> Muted Chartreuse with Tomato & Dark Lavender
                {
                  bg: 'linear-gradient(145deg, #CBB3E8 0%, #EAF7A8 100%)',
                  border: 'border-[#E34234]',
                  badgeBg: 'bg-[#E34234]',
                  badgeText: 'text-[#F3EBFA]',
                  titleText: 'text-[#2A1F45]',
                  bodyText: 'text-[#2A1F45]',
                  previewBg: 'bg-[#2A1F45] border-[#8A6BC2]',
                  previewText: 'text-[#EAF7A8]',
                  ctaBg: 'bg-[#2A1F45]',
                  ctaText: 'text-[#D4FF3F]',
                },
                // 05 Risk Center: Dark Lavender -> Deep Tomato Red with Chartreuse
                {
                  bg: 'linear-gradient(145deg, #2A1F45 0%, #B8301F 100%)',
                  border: 'border-[#D4FF3F]',
                  badgeBg: 'bg-[#E34234]',
                  badgeText: 'text-[#F3EBFA]',
                  titleText: 'text-[#D4FF3F]',
                  bodyText: 'text-[#F3EBFA]',
                  previewBg: 'bg-[#2A1F45]/90 border-[#E34234]',
                  previewText: 'text-[#EAF7A8]',
                  ctaBg: 'bg-[#D4FF3F]',
                  ctaText: 'text-[#2A1F45]',
                },
                // 06 Reports: Royal Lavender -> Lavender with Chartreuse & Dark Lavender
                {
                  bg: 'linear-gradient(145deg, #8A6BC2 0%, #CBB3E8 100%)',
                  border: 'border-[#D4FF3F]',
                  badgeBg: 'bg-[#2A1F45]',
                  badgeText: 'text-[#D4FF3F]',
                  titleText: 'text-[#2A1F45]',
                  bodyText: 'text-[#2A1F45]',
                  previewBg: 'bg-[#2A1F45] border-[#D4FF3F]',
                  previewText: 'text-[#EAF7A8]',
                  ctaBg: 'bg-[#D4FF3F]',
                  ctaText: 'text-[#2A1F45]',
                },
                // 07 Human Review: Muted Chartreuse -> Chartreuse with Tomato & Dark Lavender
                {
                  bg: 'linear-gradient(145deg, #EAF7A8 0%, #D4FF3F 100%)',
                  border: 'border-[#E34234]',
                  badgeBg: 'bg-[#B8301F]',
                  badgeText: 'text-[#F3EBFA]',
                  titleText: 'text-[#2A1F45]',
                  bodyText: 'text-[#2A1F45]',
                  previewBg: 'bg-[#2A1F45] border-[#8A6BC2]',
                  previewText: 'text-[#D4FF3F]',
                  ctaBg: 'bg-[#2A1F45]',
                  ctaText: 'text-[#D4FF3F]',
                },
                // 08 Watchlist: Deep Tomato -> Royal Lavender with Chartreuse
                {
                  bg: 'linear-gradient(145deg, #B8301F 0%, #8A6BC2 100%)',
                  border: 'border-[#EAF7A8]',
                  badgeBg: 'bg-[#D4FF3F]',
                  badgeText: 'text-[#2A1F45]',
                  titleText: 'text-[#EAF7A8]',
                  bodyText: 'text-[#F3EBFA]',
                  previewBg: 'bg-[#2A1F45]/85 border-[#EAF7A8]',
                  previewText: 'text-[#D4FF3F]',
                  ctaBg: 'bg-[#EAF7A8]',
                  ctaText: 'text-[#2A1F45]',
                },
                // 09 Comparison Mode: Dark Lavender -> Royal Lavender -> Chartreuse tint
                {
                  bg: 'linear-gradient(145deg, #2A1F45 0%, #8A6BC2 70%, #B8301F 100%)',
                  border: 'border-[#D4FF3F]',
                  badgeBg: 'bg-[#D4FF3F]',
                  badgeText: 'text-[#2A1F45]',
                  titleText: 'text-[#D4FF3F]',
                  bodyText: 'text-[#F3EBFA]',
                  previewBg: 'bg-[#2A1F45]/85 border-[#CBB3E8]',
                  previewText: 'text-[#EAF7A8]',
                  ctaBg: 'bg-[#E34234]',
                  ctaText: 'text-[#F3EBFA]',
                },
                // 10 Health Snapshot: Lavender -> Chartreuse with Tomato & Dark Lavender
                {
                  bg: 'linear-gradient(145deg, #CBB3E8 0%, #D4FF3F 100%)',
                  border: 'border-[#2A1F45]',
                  badgeBg: 'bg-[#2A1F45]',
                  badgeText: 'text-[#D4FF3F]',
                  titleText: 'text-[#2A1F45]',
                  bodyText: 'text-[#2A1F45]',
                  previewBg: 'bg-[#2A1F45] border-[#E34234]',
                  previewText: 'text-[#D4FF3F]',
                  ctaBg: 'bg-[#B8301F]',
                  ctaText: 'text-[#F3EBFA]',
                },
              ];

              const theme = cardStyles[idx % cardStyles.length];
              const numStr = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;

              return (
                <button
                  key={feat.id}
                  type="button"
                  onClick={() => setSelectedFeature(feat)}
                  style={{ background: theme.bg }}
                  className={`text-left rounded-2xl border-2 ${theme.border} p-5 transition-all hover:-translate-y-1 shadow-lg cursor-pointer flex flex-col justify-between gap-4`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
                      >
                        {numStr} · MODULE
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D4FF3F] border border-[#2A1F45]" />
                    </div>
                    <h3 className={`font-display text-lg font-bold leading-snug ${theme.titleText}`}>
                      {feat.title}
                    </h3>
                    <p className={`text-xs font-medium leading-relaxed ${theme.bodyText}`}>
                      {feat.tagline}
                    </p>
                    <div className={`rounded-xl p-2.5 border text-[11px] font-mono leading-snug ${theme.previewBg} ${theme.previewText}`}>
                      {feat.miniPreview}
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-[#2A1F45] ${theme.ctaBg} ${theme.ctaText}`}
                    >
                      <span>Preview & Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUST & RESPONSIBLE AI SECTION: 6 Colorful Cards linking to /app/resources#section */}
      <section
        id="trust"
        className="py-16 md:py-20 px-6 md:px-12 w-full border-b border-[#2A1F45]/30"
        style={{
          background:
            'radial-gradient(circle at 20% 25%, rgba(212, 255, 63, 0.35) 0%, transparent 45%), radial-gradient(circle at 80% 75%, rgba(227, 66, 52, 0.25) 0%, transparent 45%), linear-gradient(135deg, #CBB3E8 0%, #8A6BC2 50%, #EAF7A8 100%)',
        }}
      >
        <div className="max-w-[1440px] mx-auto space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold">
              <span>NIST AI RMF 1.0 · EPISTEMIC HUMILITY</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[#2A1F45]">
              Trust & Responsible Financial AI Architecture
            </h2>
            <p className="text-base text-[#2A1F45] font-medium">
              Designed around epistemic humility, deterministic arithmetic, and mandatory human accountability. Click any card to inspect its technical specification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TRUST_CARDS.map((card, i) => {
              const trustBgs = [
                'linear-gradient(135deg, #2A1F45 0%, #8A6BC2 100%)',
                'linear-gradient(135deg, #D4FF3F 0%, #EAF7A8 100%)',
                'linear-gradient(135deg, #E34234 0%, #B8301F 100%)',
                'linear-gradient(135deg, #CBB3E8 0%, #EAF7A8 100%)',
                'linear-gradient(135deg, #8A6BC2 0%, #2A1F45 100%)',
                'linear-gradient(135deg, #2A1F45 0%, #B8301F 100%)',
              ];
              const isLight = i === 1 || i === 3;
              return (
                <Link
                  key={card.id}
                  to={`/app/resources#${card.sectionHash}`}
                  style={{ background: trustBgs[i % trustBgs.length] }}
                  className={`rounded-2xl border-2 p-6 transition-all hover:-translate-y-1 shadow-lg flex flex-col justify-between ${
                    isLight
                      ? 'text-[#2A1F45] border-[#2A1F45]'
                      : 'text-[#F3EBFA] border-[#D4FF3F]'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-0.5 rounded-full font-mono text-xs font-extrabold ${
                          isLight
                            ? 'bg-[#2A1F45] text-[#D4FF3F]'
                            : 'bg-[#D4FF3F] text-[#2A1F45]'
                        }`}
                      >
                        PRINCIPLE 0{i + 1}
                      </span>
                      <ShieldCheck
                        className={`w-5 h-5 ${isLight ? 'text-[#B8301F]' : 'text-[#D4FF3F]'}`}
                      />
                    </div>
                    <h3
                      className={`font-display text-xl font-bold ${
                        isLight ? 'text-[#2A1F45]' : 'text-[#EAF7A8]'
                      }`}
                    >
                      {card.title}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed ${
                        isLight ? 'text-[#2A1F45]/90 font-medium' : 'text-[#E9DDF6]'
                      }`}
                    >
                      {card.summary}
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-current/25 flex items-center justify-between text-xs font-bold">
                    <span className={isLight ? 'text-[#B8301F]' : 'text-[#D4FF3F]'}>
                      Read Governance Standard
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* THREE RESOURCES SECTION: SEC EDGAR, FinQA, NIST */}
      <section
        id="resources"
        className="py-16 md:py-20 text-[#F3EBFA] px-6 md:px-12"
        style={{
          background:
            'radial-gradient(circle at 80% 20%, rgba(212, 255, 63, 0.22) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(227, 66, 52, 0.28) 0%, transparent 45%), linear-gradient(135deg, #2A1F45 0%, #8A6BC2 50%, #2A1F45 100%)',
        }}
      >
        <div className="max-w-[1440px] mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-[#D4FF3F]">
                Foundational Standards & Benchmarks
              </h2>
              <p className="text-base text-[#E9DDF6] mt-1">
                Expand each standard below to review its purpose, usage inside TrustLens, and known operational limitations.
              </p>
            </div>
            <Link
              to="/app/resources"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4FF3F] text-[#2A1F45] border-2 border-[#E34234] text-xs font-bold hover:bg-[#EAF7A8]"
            >
              <span>Open Full Resources Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {EXTERNAL_RESOURCES.map((res, rIdx) => {
              const isExpanded = !!expandedResources[res.id];
              const resGradients = [
                'linear-gradient(135deg, #CBB3E8 0%, #EAF7A8 100%)',
                'linear-gradient(135deg, #D4FF3F 0%, #CBB3E8 100%)',
                'linear-gradient(135deg, #EAF7A8 0%, #CBB3E8 100%)',
              ];
              return (
                <div
                  key={res.id}
                  style={{ background: resGradients[rIdx % resGradients.length] }}
                  className="rounded-2xl text-[#2A1F45] border-2 border-[#D4FF3F] p-6 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] font-mono text-xs font-bold">
                        {res.badge}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedResources((prev) => ({ ...prev, [res.id]: !prev[res.id] }))
                        }
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#B8301F] hover:text-[#2A1F45] cursor-pointer"
                      >
                        <span>{isExpanded ? 'Collapse' : 'Expand Details'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <h3 className="font-display text-xl font-bold text-[#2A1F45]">{res.name}</h3>
                    <p className="text-sm text-[#2A1F45] font-medium">{res.purpose}</p>

                    {isExpanded && (
                      <div className="pt-3 border-t border-[#2A1F45]/25 space-y-3 text-xs">
                        <div className="rounded-xl bg-[#2A1F45] text-[#F3EBFA] p-3">
                          <strong className="block text-[#D4FF3F] mb-0.5">
                            How TrustLens Uses It:
                          </strong>
                          <span className="text-[#E9DDF6]">{res.usage}</span>
                        </div>
                        <div className="rounded-xl bg-[#E34234] text-[#F3EBFA] p-3">
                          <strong className="block text-[#D4FF3F] mb-0.5">
                            Known Limitations & Safeguards:
                          </strong>
                          <span className="text-[#F3EBFA]">{res.limitations}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#2A1F45]/25 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedResources((prev) => ({ ...prev, [res.id]: !prev[res.id] }))
                      }
                      className="text-xs font-bold text-[#2A1F45] hover:text-[#B8301F] cursor-pointer"
                    >
                      {isExpanded ? 'Hide breakdown' : 'Show Usage & Limitations'}
                    </button>
                    <Link
                      to="/app/resources"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#2A1F45] text-[#D4FF3F] text-xs font-bold hover:bg-[#8A6BC2]"
                    >
                      <span>Learn more</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Preview Modal */}
      <Modal
        isOpen={!!selectedFeature}
        onClose={() => setSelectedFeature(null)}
        title={selectedFeature?.title || 'Capability Preview'}
      >
        {selectedFeature && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <SyntheticOriginTag origin="SYNTHETIC — FICTIONAL" />
              <StatusBadge status="Verified" />
            </div>
            <p className="text-sm text-[#2A1F45] font-medium leading-relaxed">
              {selectedFeature.description}
            </p>
            <div className="rounded-2xl bg-[#2A1F45] border-2 border-[#8A6BC2] p-4">
              <div className="text-xs font-mono font-bold text-[#D4FF3F] mb-1">
                LIVE MINI PREVIEW (AURORA DYNAMICS)
              </div>
              <div className="text-xs font-mono text-[#EAF7A8]">
                {selectedFeature.miniPreview}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedFeature(null)}
                className="px-4 py-2 rounded-full border-[1.5px] border-[#2A1F45] bg-[#CBB3E8] text-[#2A1F45] text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <Link
                to={selectedFeature.route}
                onClick={() => setSelectedFeature(null)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] border-[1.5px] border-[#2A1F45] text-xs font-bold hover:bg-[#EAF7A8]"
              >
                <span>Open in app</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* FOOTER */}
      <footer className="bg-[#2A1F45] text-[#F3EBFA] border-t border-[#8A6BC2] py-12 px-6 md:px-12">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-3">
            <BrandWordmark theme="dark" size="lg" />
            <p className="text-xs text-[#CBB3E8] leading-relaxed max-w-md">
              Decision support only. No transactions are executed. Human review required. Built for transparent financial verification, deterministic ratio auditing, and source provenance.
            </p>
            <div className="pt-1">
              <SyntheticOriginTag origin="SYNTHETIC — FICTIONAL" />
            </div>
          </div>

          <div className="md:col-span-4 space-y-2 text-xs">
            <div className="font-bold text-[#D4FF3F] mb-2">Workspace Modules</div>
            <div className="grid grid-cols-2 gap-2 text-[#E9DDF6]">
              <Link to="/app/dashboard" className="hover:text-[#D4FF3F]">Dashboard</Link>
              <Link to="/app/new" className="hover:text-[#D4FF3F]">New Research</Link>
              <Link to={`/app/project/${DEFAULT_PROJECT_ID}/pipeline`} className="hover:text-[#D4FF3F]">Agent Pipeline</Link>
              <Link to={`/app/project/${DEFAULT_PROJECT_ID}/verification`} className="hover:text-[#D4FF3F]">Claim Verification</Link>
              <Link to={`/app/project/${DEFAULT_PROJECT_ID}/risks`} className="hover:text-[#D4FF3F]">Risk Center</Link>
              <Link to="/app/audit" className="hover:text-[#D4FF3F]">Audit Log</Link>
            </div>
          </div>

          <div className="md:col-span-3 space-y-2 text-xs">
            <div className="font-bold text-[#D4FF3F] mb-2">Synthetic Data Notice</div>
            <p className="text-[#CBB3E8] leading-relaxed">
              Aurora Dynamics Ltd. (ticker AURD) and all associated filings S1–S7 are 100% synthetic and fictional, designed to validate cross-document contradiction detection.
            </p>
          </div>
        </div>
      </footer>

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <GlobalSourceDrawer />
      <ToastContainer />
    </div>
  );
};
