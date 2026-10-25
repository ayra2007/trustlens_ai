import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  PlusCircle,
  GitBranch,
  BarChart3,
  CheckSquare,
  AlertOctagon,
  FileSpreadsheet,
  History,
  Bookmark,
  Columns,
  BookOpen,
  Award,
  PlaySquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  ExternalLink,
  AlertTriangle,
  UserCheck,
  Search,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Drawer, StatusBadge, SyntheticOriginTag, ToastContainer } from '../ui/primitives';
import {
  GlobalSearchModal,
  BrandWordmark,
  ColorfulProjectName,
} from './GlobalSearchModal';

export const GlobalComplianceBanner: React.FC = () => {
  return (
    <div
      role="region"
      aria-label="Decision support disclaimer"
      className="w-full bg-[#2A1F45] text-[#F3EBFA] border-b border-[#8A6BC2] px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 z-40"
    >
      <div className="flex items-center gap-2 font-medium">
        <ShieldCheck className="w-4 h-4 text-[#D4FF3F] shrink-0" />
        <span>
          Decision support only. No transactions are executed. Human review required.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <SyntheticOriginTag origin="SYNTHETIC — FICTIONAL" />
      </div>
    </div>
  );
};

export const GlobalSourceDrawer: React.FC = () => {
  const { sourceDrawer, closeSourceDrawer, projects } = useAppStore();
  const navigate = useNavigate();

  if (!sourceDrawer) return null;

  const project =
    projects.find((p) => p.id === sourceDrawer.projectId) || projects[0];
  const source = project?.sources.find((s) => s.id === sourceDrawer.sourceId);

  if (!source) {
    return (
      <Drawer isOpen={true} onClose={closeSourceDrawer} title="Source Not Found">
        <p className="text-sm text-[#6B5B86]">
          Requested source ({sourceDrawer.sourceId}) could not be resolved in project {project?.companyName}.
        </p>
      </Drawer>
    );
  }

  return (
    <Drawer
      isOpen={true}
      onClose={closeSourceDrawer}
      title={`${source.id}: ${source.title}`}
    >
      <div className="space-y-5">
        <div className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SyntheticOriginTag origin={source.originLabel} />
            {source.isStale ? (
              <StatusBadge status="Partially Supported" />
            ) : source.missingDateFlag || source.promptInjectionFlag ? (
              <StatusBadge status="Contradicted" />
            ) : (
              <StatusBadge status="Verified" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#B9A0DA]">
            <div>
              <span className="text-[#6B5B86] block">Document Type</span>
              <span className="font-semibold text-[#2A1F45]">{source.type}</span>
            </div>
            <div>
              <span className="text-[#6B5B86] block">Publication Date</span>
              <span className="font-mono font-semibold text-[#2A1F45]">
                {source.publicationDate || 'MISSING (Undated — Flagged)'}
              </span>
            </div>
            <div>
              <span className="text-[#6B5B86] block">Reporting Period End</span>
              <span className="font-mono text-[#2A1F45]">{source.reportingPeriodEnd}</span>
            </div>
            <div>
              <span className="text-[#6B5B86] block">Total Pages</span>
              <span className="font-mono text-[#2A1F45]">{source.pageCount} pages</span>
            </div>
          </div>

          {source.isStale && (
            <div className="rounded-xl bg-[#EAF7A8] border border-[#8A6BC2] p-2.5 text-xs text-[#2A1F45] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#8A6BC2] shrink-0 mt-0.5" />
              <span>
                <strong>Stale Source Warning:</strong> {source.stalenessReason}
              </span>
            </div>
          )}

          {source.missingDateFlag && (
            <div className="rounded-xl bg-[#E34234] border border-[#B8301F] p-2.5 text-xs text-[#F3EBFA] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D4FF3F] shrink-0 mt-0.5" />
              <span>
                <strong>Provenance Flag:</strong> Missing publication date. Claims relying solely on this document cannot be marked Verified.
              </span>
            </div>
          )}

          {source.promptInjectionFlag && (
            <div className="rounded-xl bg-[#B8301F] border border-[#E34234] p-2.5 text-xs text-[#F3EBFA] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D4FF3F] shrink-0 mt-0.5" />
              <span>
                <strong>Prompt-Injection Quarantine Active:</strong> Adversarial instruction string detected and isolated as untrusted text.
              </span>
            </div>
          )}
        </div>

        <div>
          <h4 className="font-display text-base font-bold text-[#2A1F45] mb-2">
            Indexed Pages & Cited Passages ({source.pages.length} indexed pages)
          </h4>
          <div className="space-y-3">
            {source.pages.map((pg) => (
              <div
                key={pg.pageNumber}
                className="rounded-2xl bg-[#E9DDF6] border border-[#B9A0DA] p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#8A6BC2]">
                    Page {pg.pageNumber} · {pg.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const firstPassage = pg.passages[0]?.id || '';
                      closeSourceDrawer();
                      navigate(
                        `/app/project/${project.id}/sources/${source.id}?page=${pg.pageNumber}&highlight=${firstPassage}`
                      );
                    }}
                    className="px-3 py-1 rounded-full border-[1.5px] border-[#2A1F45] text-xs font-semibold text-[#2A1F45] hover:bg-[#D4FF3F] cursor-pointer"
                  >
                    Open Page {pg.pageNumber}
                  </button>
                </div>
                {pg.passages.map((pas) => {
                  const isHighlighted = sourceDrawer.highlightPassageId === pas.id;
                  return (
                    <div
                      key={pas.id}
                      className={`rounded-xl p-2.5 text-xs border transition-colors ${
                        isHighlighted
                          ? 'bg-[#EAF7A8] border-[#2A1F45] text-[#2A1F45]'
                          : 'bg-[#F3EBFA] border-[#B9A0DA] text-[#2A1F45]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-[#8A6BC2]">{pas.id}</span>
                        <span className="font-semibold">{pas.sectionTitle}</span>
                      </div>
                      <p className="leading-relaxed">{pas.text}</p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-[#B9A0DA] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeSourceDrawer}
            className="px-4 py-2 rounded-full border-[1.5px] border-[#2A1F45] bg-[#E9DDF6] text-[#2A1F45] text-xs font-semibold hover:bg-[#CBB3E8] cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              const targetPage = sourceDrawer.pageNumber || source.pages[0]?.pageNumber || 1;
              const targetHighlight =
                sourceDrawer.highlightPassageId || source.pages[0]?.passages[0]?.id || '';
              closeSourceDrawer();
              navigate(
                `/app/project/${project.id}/sources/${source.id}?page=${targetPage}&highlight=${targetHighlight}`
              );
            }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold hover:bg-[#EAF7A8] border-[1.5px] border-[#2A1F45] cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open full document</span>
          </button>
        </div>
      </div>
    </Drawer>
  );
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isCloudConnected, activeProject, projects, setActiveProjectId, logout, loginAsAnalyst } =
    useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  const pid = activeProject.id;

  const primaryNav = [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/new', label: 'New Research', icon: PlusCircle },
    { to: `/app/project/${pid}`, label: 'Project Overview', icon: FileText, exact: true },
    { to: `/app/project/${pid}/pipeline`, label: 'Agent Pipeline', icon: GitBranch },
    { to: `/app/project/${pid}/analysis`, label: 'Financial Analysis', icon: BarChart3 },
    { to: `/app/project/${pid}/verification`, label: 'Verification & Claims', icon: CheckSquare },
    { to: `/app/project/${pid}/risks`, label: 'Risk Center', icon: AlertOctagon },
    { to: `/app/project/${pid}/report`, label: 'Research Report', icon: FileSpreadsheet },
  ];

  const governanceNav = [
    { to: '/app/watchlist', label: 'Watchlist & Alerts', icon: Bookmark },
    { to: '/app/compare', label: 'Comparison Mode', icon: Columns },
    { to: '/app/audit', label: 'Audit Trail', icon: History },
    { to: '/app/evaluation', label: 'System Evaluation', icon: Award },
    { to: '/app/resources', label: 'Trust & Resources', icon: BookOpen },
    { to: '/app/walkthrough', label: 'Guided Walkthrough', icon: PlaySquare },
    { to: '/app/settings', label: 'Workspace Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-lavender-mesh text-[#2A1F45]">
      <GlobalComplianceBanner />

      <div className="flex-1 flex min-h-0">
        {/* Collapsible Sidebar in Deep/Dark Lavender */}
        <aside
          className={`${
            collapsed ? 'w-20' : 'w-64'
          } shrink-0 bg-[#2A1F45] text-[#F3EBFA] border-r border-[#8A6BC2] flex flex-col justify-between transition-all duration-200`}
        >
          <div className="p-4 space-y-5">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="flex items-center gap-2.5 whitespace-nowrap overflow-hidden"
              >
                <BrandWordmark theme="dark" collapsed={collapsed} size="sm" />
              </Link>
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="p-1.5 rounded-full bg-[#8A6BC2]/40 hover:bg-[#8A6BC2] text-[#F3EBFA] cursor-pointer"
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Active Project Selector */}
            {!collapsed && (
              <div className="rounded-2xl bg-[#8A6BC2]/30 border border-[#D4FF3F]/50 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="active-project-select"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#D4FF3F]"
                  >
                    Active Research Dossier
                  </label>
                  <span className="w-2 h-2 rounded-full bg-[#E34234]" />
                </div>
                <select
                  id="active-project-select"
                  value={activeProject.id}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setActiveProjectId(nextId);
                    if (location.pathname.includes('/app/project/')) {
                      navigate(`/app/project/${nextId}`);
                    }
                  }}
                  className="w-full rounded-xl bg-[#2A1F45] text-[#EAF7A8] border border-[#8A6BC2] px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#D4FF3F]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.ticker} — {p.companyName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <nav aria-label="Primary Workspace Navigation" className="space-y-1">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-[#D4FF3F] text-[#2A1F45]'
                          : 'text-[#E9DDF6] hover:bg-[#8A6BC2]/40 hover:text-[#F3EBFA]'
                      }`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-[#8A6BC2]/40">
              {!collapsed && (
                <div className="px-3 pb-1.5 text-[11px] font-semibold text-[#CBB3E8]">
                  Governance & Tools
                </div>
              )}
              <nav aria-label="Governance Navigation" className="space-y-1">
                {governanceNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                          isActive
                            ? 'bg-[#D4FF3F] text-[#2A1F45]'
                            : 'text-[#E9DDF6] hover:bg-[#8A6BC2]/40 hover:text-[#F3EBFA]'
                        }`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="p-4 border-t border-[#8A6BC2]/40">
            {user ? (
              <div className="flex items-center justify-between gap-2">
                {!collapsed && (
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#F3EBFA] truncate">{user.name}</div>
                    <div className="text-[11px] text-[#D4FF3F] font-mono">
                      {user.role} {isCloudConnected ? '· Cloud DB' : ''}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title="Sign out"
                  className="p-2 rounded-full bg-[#8A6BC2]/40 hover:bg-[#E34234] text-[#F3EBFA] transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => loginAsAnalyst('Analyst')}
                className="w-full px-3 py-2 rounded-full bg-[#D4FF3F] text-[#2A1F45] text-xs font-bold cursor-pointer"
              >
                {collapsed ? 'Sign In' : 'Resume Analyst Session'}
              </button>
            )}
          </div>
        </aside>

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar in Deep Lavender #8A6BC2 */}
          <header className="bg-[#2A1F45] text-[#F3EBFA] border-b border-[#8A6BC2] px-6 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <ColorfulProjectName
                companyName={activeProject.companyName}
                ticker={activeProject.ticker}
                theme="dark"
                size="sm"
              />
              <StatusBadge status={activeProject.status} />
            </div>

            {/* Global Ctrl+K Search Bar Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Open Global Cross-Referenced Search (Ctrl+K)"
              className="flex items-center justify-between gap-4 px-4 py-1.5 rounded-full bg-[#8A6BC2]/35 hover:bg-[#8A6BC2]/60 border-[1.5px] border-[#CBB3E8] text-[#F3EBFA] text-xs transition-colors cursor-pointer min-w-[230px] md:min-w-[310px]"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-[#D4FF3F] shrink-0" />
                <span className="text-[#E9DDF6] truncate">
                  Search claims, sources, metrics, risks...
                </span>
              </span>
              <kbd className="px-2 py-0.5 rounded-full bg-[#2A1F45] text-[#D4FF3F] border border-[#8A6BC2] font-mono text-[10px] font-bold shrink-0">
                Ctrl+K
              </kbd>
            </button>

            <div className="hidden 2xl:flex items-center gap-4 text-xs font-medium text-[#F3EBFA]">
              <Link
                to={`/app/project/${pid}/sources/S1?page=31&highlight=S1-P1`}
                className="hover:text-[#D4FF3F] transition-colors whitespace-nowrap shrink-0"
              >
                S1 Audited Report
              </Link>
              <Link
                to={`/app/project/${pid}/verification/claim/C2`}
                className="hover:text-[#D4FF3F] transition-colors whitespace-nowrap shrink-0"
              >
                C2 Conflict ($540M vs $552M)
              </Link>
              <Link
                to={`/app/project/${pid}/risks/R1`}
                className="hover:text-[#D4FF3F] transition-colors whitespace-nowrap shrink-0"
              >
                R1 Supplier Risk (38%)
              </Link>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() =>
                  loginAsAnalyst(user?.role === 'Reviewer' ? 'Analyst' : 'Reviewer')
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] border-[#F3EBFA] bg-[#8A6BC2]/40 hover:bg-[#8A6BC2] text-[#F3EBFA] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Switch active human review role"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#D4FF3F]" />
                <span>Role: {user?.role || 'Analyst'}</span>
              </button>
              <Link
                to="/app/new"
                className="px-4 py-1.5 rounded-full bg-[#D4FF3F] hover:bg-[#EAF7A8] text-[#2A1F45] text-xs font-bold transition-colors whitespace-nowrap shrink-0"
              >
                + New Research
              </Link>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 md:p-8 max-w-[1440px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <GlobalSourceDrawer />
      <ToastContainer />
    </div>
  );
};

