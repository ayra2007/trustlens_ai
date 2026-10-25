import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { GlobalComplianceBanner, GlobalSourceDrawer } from '../components/layout/AppShell';
import { BrandWordmark } from '../components/layout/GlobalSearchModal';
import { SyntheticOriginTag, ToastContainer } from '../components/ui/primitives';

const ROTATING_TRUST_STATEMENTS = [
  {
    quote:
      'Every financial ratio in TrustLens is calculated by deterministic functions—never approximated by language models.',
    sub: 'Deterministic Verification Guarantee · Zero Hallucinated Arithmetic',
  },
  {
    quote:
      'Cross-document verification caught a $12.0M revenue contradiction between Aurora S2 ($552.0M) and audited S1 ($540.0M).',
    sub: 'Automated Discrepancy Detection · Page-Level Provenance',
  },
  {
    quote:
      'Missing figures like Q4 Operating Cash Flow remain explicitly null rather than silently interpolated.',
    sub: 'Transparent Uncertainty · NIST AI RMF Aligned',
  },
  {
    quote:
      'No autonomous trades or investment ratings are ever issued. Human review is required before dossier sign-off.',
    sub: 'Human-in-the-Loop Governance · Decision Support Only',
  },
];

export const AuthPage: React.FC<{ mode: 'login' | 'signup' }> = ({ mode }) => {
  const { loginWithCredentials, loginAsAnalyst, signInWithGoogle } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [statementIdx, setStatementIdx] = useState(0);
  const [name, setName] = useState(mode === 'signup' ? '' : 'Marcus Vance');
  const [email, setEmail] = useState(
    mode === 'signup' ? '' : 'm.vance@trustlens-research.org'
  );
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Analyst' | 'Reviewer'>('Analyst');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setStatementIdx((prev) => (prev + 1) % ROTATING_TRUST_STATEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const getPasswordStrength = (pwd: string): { score: number; label: string; colorClass: string } => {
    if (!pwd) return { score: 0, label: 'Enter a password', colorClass: 'bg-[#B9A0DA]' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak — add numbers & symbols', colorClass: 'bg-[#E34234]' };
    if (score === 2) return { score: 2, label: 'Moderate — add uppercase/symbols', colorClass: 'bg-[#CBB3E8]' };
    if (score === 3) return { score: 3, label: 'Strong', colorClass: 'bg-[#8A6BC2]' };
    return { score: 4, label: 'Very Strong & Compliant', colorClass: 'bg-[#D4FF3F]' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { name?: string; email?: string; password?: string } = {};

    if (mode === 'signup' && !name.trim()) {
      nextErrors.name = 'Full name is required for audit trail attribution.';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid institutional email address.';
    }
    if (!password || password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    loginWithCredentials(email, name || 'Research Analyst', role);
    const redirectTo = (location.state as { from?: string })?.from || '/app/dashboard';
    navigate(redirectTo);
  };

  const handleWorkspaceContinue = (selectedRole: 'Analyst' | 'Reviewer' = role) => {
    loginAsAnalyst(selectedRole);
    navigate('/app/dashboard');
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle(role);
    navigate('/app/dashboard');
  };

  const activeQuote = ROTATING_TRUST_STATEMENTS[statementIdx];

  return (
    <div className="min-h-screen flex flex-col bg-lavender-mesh text-[#2A1F45]">
      <GlobalComplianceBanner />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Deep-Lavender Illustration Panel with Rotating Trust Statements */}
        <div className="lg:col-span-6 bg-[#2A1F45] text-[#F3EBFA] p-8 md:p-14 flex flex-col justify-between relative overflow-hidden border-r border-[#8A6BC2]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 25% 25%, rgba(138, 107, 194, 0.5) 0%, transparent 55%), radial-gradient(circle at 80% 80%, rgba(212, 255, 63, 0.16) 0%, transparent 45%)',
            }}
          />

          <div className="relative z-10 flex items-center justify-between">
            <Link to="/">
              <BrandWordmark theme="dark" size="lg" />
            </Link>
            <SyntheticOriginTag origin="SYNTHETIC — FICTIONAL" />
          </div>

          {/* Inline SVG Governance Illustration */}
          <div className="relative z-10 my-8 space-y-6">
            <svg
              viewBox="0 0 480 200"
              className="w-full max-w-md rounded-2xl bg-[#8A6BC2]/25 border border-[#8A6BC2] p-4"
              role="img"
              aria-label="TrustLens Evidence Verification Shield"
            >
              <rect x="20" y="30" width="130" height="140" rx="14" fill="#2A1F45" stroke="#CBB3E8" strokeWidth="1.5" />
              <text x="35" y="58" fill="#D4FF3F" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono">
                SOURCE S1 (10-K)
              </text>
              <text x="35" y="82" fill="#F3EBFA" fontSize="11">Rev: $540.0M</text>
              <text x="35" y="102" fill="#F3EBFA" fontSize="11">Net Inc: $59.4M</text>
              <text x="35" y="122" fill="#CBB3E8" fontSize="10" fontFamily="JetBrains Mono">p.31 Audited</text>

              <path d="M 155 100 L 218 100" stroke="#D4FF3F" strokeWidth="2.5" className="animate-flow" />

              <circle cx="250" cy="100" r="32" fill="#D4FF3F" />
              <text x="228" y="104" fill="#2A1F45" fontSize="11" fontWeight="700" fontFamily="Playfair Display">
                VERIFY
              </text>

              <path d="M 285 100 L 340 100" stroke="#D4FF3F" strokeWidth="2.5" className="animate-flow" />

              <rect x="340" y="30" width="120" height="140" rx="14" fill="#F3EBFA" stroke="#D4FF3F" strokeWidth="2" />
              <text x="354" y="58" fill="#2A1F45" fontSize="11" fontWeight="700" fontFamily="Playfair Display">
                AUDIT TRAIL
              </text>
              <rect x="354" y="72" width="92" height="22" rx="11" fill="#D4FF3F" />
              <text x="362" y="87" fill="#2A1F45" fontSize="10" fontWeight="700">✓ C1 Verified</text>
              <rect x="354" y="102" width="92" height="22" rx="11" fill="#E34234" />
              <text x="362" y="117" fill="#F3EBFA" fontSize="10" fontWeight="700">✕ C2 Rejected</text>
              <text x="354" y="148" fill="#6B5B86" fontSize="9" fontFamily="JetBrains Mono">Human Attested</text>
            </svg>

            {/* Rotating Trust Statement */}
            <div className="rounded-2xl bg-[#8A6BC2]/30 border border-[#8A6BC2] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#D4FF3F]">
                  TRUST PRINCIPLE 0{statementIdx + 1} / 04
                </span>
                <div className="flex items-center gap-1.5">
                  {ROTATING_TRUST_STATEMENTS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setStatementIdx(i)}
                      aria-label={`Show trust statement ${i + 1}`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        i === statementIdx ? 'w-6 bg-[#D4FF3F]' : 'w-2 bg-[#8A6BC2]'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xl font-display italic text-[#F3EBFA] leading-snug">
                “{activeQuote.quote}”
              </p>
              <div className="text-xs text-[#CBB3E8] font-mono">{activeQuote.sub}</div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-[#CBB3E8] flex items-center justify-between border-t border-[#8A6BC2] pt-4">
            <span>Cloud Firestore &amp; Workspace Authentication</span>
            <Link to="/" className="text-[#D4FF3F] hover:underline font-semibold">
              ← Back to Landing Page
            </Link>
          </div>
        </div>

        {/* Right Form Panel on a Light Lavender #F3EBFA Card */}
        <div className="lg:col-span-6 p-6 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl bg-[#F3EBFA] border border-[#B9A0DA] p-8 shadow-sm space-y-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9DDF6] text-[#8A6BC2] text-xs font-mono font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Cloud Database &amp; Role-Based Access</span>
              </div>
              <h1 className="font-display text-3xl font-bold text-[#2A1F45]">
                {mode === 'login' ? 'Sign in to TrustLens' : 'Create Analyst Account'}
              </h1>
              <p className="text-sm text-[#6B5B86]">
                {mode === 'login'
                  ? 'Access your deterministic financial verification workspace and audit logs.'
                  : 'Configure your role for multi-agent research and human review sign-off.'}
              </p>
            </div>

            {/* Instant Workspace & Cloud Access */}
            <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-4 space-y-2.5">
              <div className="text-xs font-bold text-[#2A1F45]">
                Direct Workspace &amp; Cloud Sign-In
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full px-3.5 py-2.5 rounded-full bg-[#2A1F45] hover:bg-[#8A6BC2] text-[#D4FF3F] text-xs font-bold border-[1.5px] border-[#2A1F45] flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-[#D4FF3F]" />
                <span>Sign in with Google (Cloud Firestore Sync)</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleWorkspaceContinue('Analyst')}
                  className="px-3.5 py-2.5 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] text-[#2A1F45] text-xs font-bold border-[1.5px] border-[#2A1F45] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Continue as Analyst</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleWorkspaceContinue('Reviewer')}
                  className="px-3.5 py-2.5 rounded-full bg-transparent hover:bg-[#CBB3E8] text-[#2A1F45] border-[1.5px] border-[#2A1F45] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8A6BC2]" />
                  <span>Continue as Reviewer</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-bold text-[#2A1F45] mb-1">
                    Full Name (Used in Audit Trail)
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Elena Rostova, CFA"
                    className="w-full rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] px-3.5 py-2.5 text-sm text-[#2A1F45] focus:outline-none focus:border-[#8A6BC2]"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-[#B8301F] flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-bold text-[#2A1F45] mb-1">
                  Institutional Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@institution.org"
                  className="w-full rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] px-3.5 py-2.5 text-sm text-[#2A1F45] focus:outline-none focus:border-[#8A6BC2]"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-[#B8301F] flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="auth-role" className="block text-xs font-bold text-[#2A1F45] mb-1">
                  Governance Role
                </label>
                <select
                  id="auth-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'Analyst' | 'Reviewer')}
                  className="w-full rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] px-3.5 py-2.5 text-sm font-semibold text-[#2A1F45] focus:outline-none focus:border-[#8A6BC2]"
                >
                  <option value="Analyst">Analyst (Run Pipelines & Prepare Dossiers)</option>
                  <option value="Reviewer">Reviewer (Attest Claims & Sign Off Reports)</option>
                </select>
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-xs font-bold text-[#2A1F45] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full rounded-xl bg-[#E9DDF6] border border-[#B9A0DA] px-3.5 py-2.5 pr-10 text-sm text-[#2A1F45] focus:outline-none focus:border-[#8A6BC2]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5B86] hover:text-[#2A1F45] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-[#B8301F] flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.password}</span>
                  </p>
                )}

                {mode === 'signup' && (
                  <div className="mt-2 space-y-1">
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full transition-colors ${
                            strength.score >= step ? strength.colorClass : 'bg-[#B9A0DA]'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-[11px] text-[#6B5B86] font-mono">
                      Strength: {strength.label}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] text-[#2A1F45] font-bold text-sm border-[1.5px] border-[#2A1F45] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create Account & Open Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-[#B9A0DA] flex items-center justify-between text-xs text-[#6B5B86]">
              {mode === 'login' ? (
                <>
                  <span>New to TrustLens?</span>
                  <Link to="/signup" className="font-bold text-[#8A6BC2] hover:text-[#2A1F45]">
                    Create an account →
                  </Link>
                </>
              ) : (
                <>
                  <span>Already have a local profile?</span>
                  <Link to="/login" className="font-bold text-[#8A6BC2] hover:text-[#2A1F45]">
                    Sign in instead →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <GlobalSourceDrawer />
      <ToastContainer />
    </div>
  );
};
