import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Project,
  AuditEntry,
  WatchlistItem,
  UserProfile,
  Source,
  DataOrigin,
  WorkflowStatus,
  ReviewEvent,
  ClaimAnalystStatus,
  RiskAnalystStatus,
} from '../types';
import {
  DEFAULT_PROJECT_ID,
  createSeedProject,
  createInitialAuditLog,
  createInitialWatchlist,
  buildAuroraFinancials,
  buildAuroraSources,
  buildAuroraMetrics,
  buildAuroraRatios,
  buildAuroraClaims,
  buildAuroraRisks,
  buildAuroraAgents,
  buildAuroraReport,
  buildDefaultNistChecklist,
  buildInitialPipelineEvents,
} from '../data/seed';
import { runProjectPipelineOrchestrator } from '../agents/orchestrator';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  collection,
  query,
  where,
  onSnapshot,
  syncUserProfileToFirestore,
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  saveAuditEntryToFirestore,
  saveWatchlistItemToFirestore,
  hydrateProjectFromFirestore,
  hydrateAuditFromFirestore,
  hydrateWatchlistFromFirestore,
  handleFirestoreError,
  OperationType,
} from '../firebase';

interface SourceDrawerState {
  projectId: string;
  sourceId: string;
  pageNumber?: number;
  highlightPassageId?: string;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'verified' | 'risk';
}

interface NewProjectInput {
  companyName: string;
  ticker: string;
  sector: string;
  dataOrigin: DataOrigin;
  periods: string[];
  customSources?: Source[];
}

export interface ClaimAnalystActionPayload {
  type:
    | 'accept_flag'
    | 'mark_corrected'
    | 'dismiss'
    | 'annotate'
    | 'reverify'
    | 'feedback';
  correctedValue?: string;
  justification?: string;
  dismissReason?: string;
  annotation?: string;
  feedbackThumb?: 'up' | 'down';
  feedbackComment?: string;
}

export interface WatchlistThresholds {
  netMarginDeltaPp: number;
  revenueGrowthDeltaPct: number;
}

interface AppStoreContextValue {
  user: UserProfile | null;
  isAuthReady: boolean;
  isCloudConnected: boolean;
  projects: Project[];
  activeProjectId: string;
  activeProject: Project;
  auditEntries: AuditEntry[];
  watchlist: WatchlistItem[];
  watchlistThresholds: WatchlistThresholds;
  sourceDrawer: SourceDrawerState | null;
  toasts: ToastItem[];
  isPipelineRunning: boolean;
  completedDemoSteps: number[];
  guidedTourStep: number | null;
  uiDensity: 'comfortable' | 'compact';
  geminiModel: string;
  useFallbackClaims: boolean;
  loginAsAnalyst: (role?: 'Analyst' | 'Reviewer') => void;
  loginAsDemoAnalyst: (role?: 'Analyst' | 'Reviewer') => void;
  signInWithGoogle: (role?: 'Analyst' | 'Reviewer') => Promise<void>;
  loginWithCredentials: (email: string, name: string, role: 'Analyst' | 'Reviewer') => void;
  logout: () => void;
  setActiveProjectId: (id: string) => void;
  openSourceDrawer: (
    sourceId: string,
    projectId?: string,
    pageNumber?: number,
    highlightPassageId?: string
  ) => void;
  closeSourceDrawer: () => void;
  recordAudit: (
    action: string,
    targetType: AuditEntry['targetType'],
    targetId: string,
    targetLabel: string,
    targetRoute: string,
    details: string
  ) => void;
  addToast: (title: string, description?: string, variant?: ToastItem['variant']) => void;
  dismissToast: (id: string) => void;
  createProject: (input: NewProjectInput) => Project;
  duplicateProject: (projectId: string) => Project | null;
  deleteProject: (projectId: string) => void;
  triggerPipelineRun: (projectId: string, stepDelayMs?: number) => Promise<void>;
  runSingleAgent: (projectId: string, agentId: string) => Promise<void>;
  toggleSimulateRiskFailure: (projectId: string) => void;
  flagMetricValue: (projectId: string, metricId: string, flagged: boolean) => void;
  addMetricNote: (projectId: string, metricId: string, note: string) => void;
  recalculateRatio: (projectId: string, ratioId: string) => void;
  updateClaimDecision: (
    projectId: string,
    claimId: string,
    decision: 'Accepted' | 'Rejected' | 'Needs Revision',
    comment: string
  ) => void;
  performClaimAnalystAction: (
    projectId: string,
    claimId: string,
    payload: ClaimAnalystActionPayload
  ) => void;
  bulkUpdateClaims: (
    projectId: string,
    claimIds: string[],
    analystStatus: ClaimAnalystStatus,
    note: string
  ) => void;
  updateRiskStatus: (projectId: string, riskId: string, status: WorkflowStatus) => void;
  updateRiskAnalystDetail: (
    projectId: string,
    riskId: string,
    analystStatus: RiskAnalystStatus,
    analystNotes: string
  ) => void;
  convertHypothesisToEvidence: (
    projectId: string,
    riskId: string,
    sourceId: string,
    rationale: string
  ) => void;
  toggleNistControl: (projectId: string, controlId: string) => void;
  signOffReport: (
    projectId: string,
    decision: 'Reviewed & Attested' | 'Rejected' | 'Approved',
    comment: string,
    acknowledgedUnresolved?: boolean
  ) => void;
  requestReportRevision: (
    projectId: string,
    comment: string,
    claimIdsToReverify?: string[]
  ) => Promise<void>;
  addWatchlistCompany: (ticker: string, companyName: string, origin: DataOrigin) => void;
  removeWatchlistCompany: (id: string) => void;
  refreshWatchlistAlerts: () => void;
  updateWatchlistThresholds: (patch: Partial<WatchlistThresholds>) => void;
  toggleDemoStep: (step: number) => void;
  setGuidedTourStep: (step: number | null) => void;
  setUiDensity: (d: 'comfortable' | 'compact') => void;
  setGeminiModel: (m: string) => void;
  setUseFallbackClaims: (val: boolean) => void;
  resetStoreToSeed: () => void;
}

const STORAGE_KEY = 'trustlens_global_store_v3';

const DEFAULT_USER: UserProfile = {
  id: 'usr-senior-analyst',
  name: 'Marcus Vance',
  email: 'm.vance@trustlens-research.org',
  role: 'Analyst',
  isCloudSynced: false,
};

const AppStoreContext = createContext<AppStoreContextValue | undefined>(undefined);

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.user ?? DEFAULT_USER;
      }
    } catch {
      // ignore
    }
    return DEFAULT_USER;
  });

  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const hasSeededCloudRef = useRef<boolean>(false);

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
          return parsed.projects;
        }
      }
    } catch {
      // ignore
    }
    return [createSeedProject()];
  });

  const [activeProjectId, setActiveProjectIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeProjectId) return parsed.activeProjectId;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PROJECT_ID;
  });

  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.auditEntries) && parsed.auditEntries.length > 0) {
          return parsed.auditEntries;
        }
      }
    } catch {
      // ignore
    }
    return createInitialAuditLog();
  });

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.watchlist) && parsed.watchlist.length > 0) {
          return parsed.watchlist;
        }
      }
    } catch {
      // ignore
    }
    return createInitialWatchlist();
  });

  const [sourceDrawer, setSourceDrawer] = useState<SourceDrawerState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isPipelineRunning, setIsPipelineRunning] = useState<boolean>(false);
  const [watchlistThresholds, setWatchlistThresholds] = useState<WatchlistThresholds>({
    netMarginDeltaPp: 0.5,
    revenueGrowthDeltaPct: 2.0,
  });
  const [completedDemoSteps, setCompletedDemoSteps] = useState<number[]>([1, 2, 3]);
  const [guidedTourStep, setGuidedTourStep] = useState<number | null>(null);
  const [uiDensity, setUiDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-2.5-flash');
  const [useFallbackClaims, setUseFallbackClaims] = useState<boolean>(true);

  // Persist local cache as instant fallback
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user,
          projects,
          activeProjectId,
          auditEntries,
          watchlist,
        })
      );
    } catch {
      // storage quota fallback
    }
  }, [user, projects, activeProjectId, auditEntries, watchlist]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.emailVerified) {
        try {
          const syncedProfile = await syncUserProfileToFirestore(fbUser, user?.role || 'Analyst');
          setUser(syncedProfile);
          setIsCloudConnected(true);
        } catch {
          setIsCloudConnected(false);
        }
      } else {
        setIsCloudConnected(false);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  // Subscribe to Firestore collections when authenticated with verified email
  useEffect(() => {
    if (!isAuthReady || !auth.currentUser || !auth.currentUser.emailVerified) {
      return;
    }

    const uid = auth.currentUser.uid;
    const projectsQuery = query(collection(db, 'projects'), where('ownerId', '==', uid));
    const auditsQuery = query(collection(db, 'auditEntries'), where('ownerId', '==', uid));
    const watchlistQuery = query(collection(db, 'watchlist'), where('ownerId', '==', uid));

    const unsubProjects = onSnapshot(
      projectsQuery,
      async (snapshot) => {
        if (snapshot.empty && !hasSeededCloudRef.current) {
          hasSeededCloudRef.current = true;
          const seedProj = createSeedProject();
          await saveProjectToFirestore(seedProj, uid);
          const seedAudits = createInitialAuditLog();
          for (const aud of seedAudits) {
            await saveAuditEntryToFirestore(aud, uid);
          }
          const seedWatchlist = createInitialWatchlist();
          for (const wl of seedWatchlist) {
            await saveWatchlistItemToFirestore(wl, uid);
          }
          return;
        }
        if (!snapshot.empty) {
          const loadedProjects = snapshot.docs.map((docSnap) =>
            hydrateProjectFromFirestore(docSnap.data())
          );
          setProjects(loadedProjects);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'projects');
      }
    );

    const unsubAudits = onSnapshot(
      auditsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedAudits = snapshot.docs
            .map((docSnap) => hydrateAuditFromFirestore(docSnap.data()))
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          setAuditEntries(loadedAudits);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'auditEntries');
      }
    );

    const unsubWatchlist = onSnapshot(
      watchlistQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedWatchlist = snapshot.docs.map((docSnap) =>
            hydrateWatchlistFromFirestore(docSnap.data())
          );
          setWatchlist(loadedWatchlist);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'watchlist');
      }
    );

    return () => {
      unsubProjects();
      unsubAudits();
      unsubWatchlist();
    };
  }, [isAuthReady, isCloudConnected]);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || createSeedProject();

  const persistProjectUpdate = useCallback((updatedProj: Project) => {
    if (auth.currentUser && auth.currentUser.emailVerified) {
      void saveProjectToFirestore(updatedProj, auth.currentUser.uid);
    }
  }, []);

  const addToast = useCallback(
    (title: string, description?: string, variant: ToastItem['variant'] = 'default') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const recordAudit = useCallback(
    (
      action: string,
      targetType: AuditEntry['targetType'],
      targetId: string,
      targetLabel: string,
      targetRoute: string,
      details: string
    ) => {
      const entry: AuditEntry = {
        id: `AUD-${Date.now().toString().slice(-5)}-${Math.random().toString(36).slice(2, 4)}`,
        timestamp: new Date().toISOString(),
        actor: user?.name || 'Marcus Vance',
        actorRole: user?.role || 'Analyst',
        action,
        targetType,
        targetId,
        targetLabel,
        targetRoute,
        details,
      };
      setAuditEntries((prev) => [entry, ...prev]);
      if (auth.currentUser && auth.currentUser.emailVerified) {
        void saveAuditEntryToFirestore(entry, auth.currentUser.uid);
      }
    },
    [user]
  );

  const loginAsAnalyst = useCallback(
    (role: 'Analyst' | 'Reviewer' = 'Analyst') => {
      const profile: UserProfile = {
        id: auth.currentUser?.uid || 'usr-senior-analyst',
        name:
          auth.currentUser?.displayName ||
          (role === 'Reviewer' ? 'Elena Rostova, CFA' : 'Marcus Vance'),
        email:
          auth.currentUser?.email ||
          (role === 'Reviewer'
            ? 'e.rostova@trustlens-research.org'
            : 'm.vance@trustlens-research.org'),
        role,
        isCloudSynced: Boolean(auth.currentUser?.emailVerified),
      };
      setUser(profile);
      recordAudit(
        `Activated ${role} Workspace Session`,
        'Auth',
        profile.id,
        profile.name,
        '/app/dashboard',
        `Session active with role=${role}.`
      );
      addToast(`Signed in as ${profile.name}`, `Role: ${role}`, 'verified');
    },
    [recordAudit, addToast]
  );

  const signInWithGoogle = useCallback(
    async (role: 'Analyst' | 'Reviewer' = 'Analyst') => {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const synced = await syncUserProfileToFirestore(result.user, role);
        setUser(synced);
        setIsCloudConnected(true);
        recordAudit(
          `Authenticated via Google Cloud Auth (${synced.role})`,
          'Auth',
          synced.id,
          synced.name,
          '/app/dashboard',
          `Verified cloud database session for ${synced.email}.`
        );
        addToast(
          `Connected as ${synced.name}`,
          `Cloud Firestore database synced (${synced.role})`,
          'verified'
        );
      } catch (error) {
        addToast(
          'Google Sign-In Cancelled or Blocked',
          error instanceof Error ? error.message : 'Unable to complete popup authentication.',
          'risk'
        );
      }
    },
    [recordAudit, addToast]
  );

  const loginWithCredentials = useCallback(
    (email: string, name: string, role: 'Analyst' | 'Reviewer') => {
      const newProfile: UserProfile = {
        id: auth.currentUser?.uid || `usr-${Date.now().toString(36)}`,
        name: name.trim() || email.split('@')[0],
        email: email.trim(),
        role,
        isCloudSynced: Boolean(auth.currentUser?.emailVerified),
      };
      setUser(newProfile);
      recordAudit(
        `Authenticated User (${role})`,
        'Auth',
        newProfile.id,
        newProfile.name,
        '/app/dashboard',
        `Authenticated session for ${newProfile.email}.`
      );
      addToast(`Welcome, ${newProfile.name}`, `Signed in as ${role}`, 'verified');
    },
    [recordAudit, addToast]
  );

  const logout = useCallback(() => {
    if (user) {
      recordAudit(
        'Signed out of session',
        'Auth',
        user.id,
        user.name,
        '/login',
        'User logged out.'
      );
    }
    if (auth.currentUser) {
      void firebaseSignOut(auth);
    }
    setUser(null);
    setIsCloudConnected(false);
    addToast('Signed out', 'Session ended.');
  }, [user, recordAudit, addToast]);

  const setActiveProjectId = useCallback((id: string) => {
    setActiveProjectIdState(id);
  }, []);

  const openSourceDrawer = useCallback(
    (sourceId: string, projectId?: string, pageNumber?: number, highlightPassageId?: string) => {
      const targetProjId = projectId || activeProject.id;
      setSourceDrawer({
        projectId: targetProjId,
        sourceId,
        pageNumber,
        highlightPassageId,
      });
      recordAudit(
        `Inspected Source ${sourceId} in Drawer`,
        'Source',
        sourceId,
        `Source ${sourceId}`,
        `/app/project/${targetProjId}/sources/${sourceId}${pageNumber ? `?page=${pageNumber}` : ''}${
          highlightPassageId ? `&highlight=${highlightPassageId}` : ''
        }`,
        `Opened source provenance drawer${highlightPassageId ? ` highlighting passage ${highlightPassageId}` : ''}.`
      );
    },
    [activeProject.id, recordAudit]
  );

  const closeSourceDrawer = useCallback(() => {
    setSourceDrawer(null);
  }, []);

  const createProject = useCallback(
    (input: NewProjectInput): Project => {
      const cleanTicker = input.ticker.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'ent';
      const newId = `proj-${cleanTicker}-${Date.now().toString().slice(-4)}`;
      const financials = buildAuroraFinancials();
      const baseSources = buildAuroraSources(newId);
      const mergedSources =
        input.customSources && input.customSources.length > 0
          ? [...input.customSources.map((s) => ({ ...s, projectId: newId })), ...baseSources]
          : baseSources;

      const newProj: Project = {
        id: newId,
        companyName: input.companyName,
        ticker: input.ticker.toUpperCase(),
        sector: input.sector || 'Industrial Technology',
        fiscalYearEnd: 'Dec 31',
        dataOrigin: input.dataOrigin,
        periods: input.periods.length > 0 ? input.periods : ['FY2022', 'FY2023', 'FY2024'],
        status: 'Processing',
        reviewerStatus: 'Needs Review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        financials,
        sources: mergedSources,
        metrics: buildAuroraMetrics(financials, newId),
        ratios: buildAuroraRatios(financials, newId),
        claims: buildAuroraClaims(newId),
        risks: buildAuroraRisks(newId),
        agents: buildAuroraAgents(newId),
        report: buildAuroraReport(newId),
        reviews: [],
        pipelineEvents: buildInitialPipelineEvents(),
        injectionAttemptsBlocked: 1,
        fallbackUsed: true,
        simulateRiskFailure: false,
        nistChecklist: buildDefaultNistChecklist(),
      };

      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectIdState(newId);
      persistProjectUpdate(newProj);

      recordAudit(
        `Created Research Project: ${newProj.companyName} (${newProj.ticker})`,
        'Project',
        newId,
        `${newProj.companyName} (${newProj.ticker})`,
        `/app/project/${newId}/pipeline`,
        `Initialized with ${newProj.periods.length} periods and ${newProj.sources.length} sources (${newProj.dataOrigin}).`
      );
      addToast(
        `Project ${newProj.ticker} Created`,
        'Starting 5-agent verification pipeline...',
        'verified'
      );
      return newProj;
    },
    [persistProjectUpdate, recordAudit, addToast]
  );

  const duplicateProject = useCallback(
    (projectId: string): Project | null => {
      const orig = projects.find((p) => p.id === projectId);
      if (!orig) return null;
      const copyId = `${orig.id}-copy-${Date.now().toString().slice(-3)}`;
      const now = new Date().toISOString();
      const copy: Project = {
        ...JSON.parse(JSON.stringify(orig)),
        id: copyId,
        companyName: `${orig.companyName} (Copy)`,
        createdAt: now,
        updatedAt: now,
      };
      setProjects((prev) => [copy, ...prev]);
      persistProjectUpdate(copy);
      recordAudit(
        `Duplicated Project ${orig.ticker}`,
        'Project',
        copyId,
        copy.companyName,
        `/app/project/${copyId}`,
        `Cloned from ${orig.id}.`
      );
      addToast('Project Duplicated', `Created ${copy.companyName}`, 'verified');
      return copy;
    },
    [projects, persistProjectUpdate, recordAudit, addToast]
  );

  const deleteProject = useCallback(
    (projectId: string) => {
      const target = projects.find((p) => p.id === projectId);
      if (!target) return;
      if (projects.length <= 1) {
        addToast(
          'Cannot Delete Last Project',
          'At least one project must remain in the workspace.',
          'risk'
        );
        return;
      }
      const remaining = projects.filter((p) => p.id !== projectId);
      setProjects(remaining);
      if (activeProjectId === projectId) {
        setActiveProjectIdState(remaining[0].id);
      }
      if (auth.currentUser && auth.currentUser.emailVerified) {
        void deleteProjectFromFirestore(projectId);
      }
      recordAudit(
        `Deleted Project ${target.companyName} (${target.ticker})`,
        'Project',
        projectId,
        target.companyName,
        '/app/dashboard',
        'Removed project from workspace database.'
      );
      addToast('Project Deleted', `${target.companyName} removed.`, 'default');
    },
    [projects, activeProjectId, recordAudit, addToast]
  );

  const triggerPipelineRun = useCallback(
    async (projectId: string, stepDelayMs = 3600) => {
      const target = projects.find((p) => p.id === projectId);
      if (!target || isPipelineRunning) return;

      setIsPipelineRunning(true);

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                status: 'Processing',
                agents: p.agents.map((a) => ({
                  ...a,
                  status: 'Queued' as WorkflowStatus,
                })),
              }
            : p
        )
      );

      recordAudit(
        `Started 5-Agent Pipeline Run for ${target.ticker}`,
        'Project',
        projectId,
        `${target.companyName} Pipeline`,
        `/app/project/${projectId}/pipeline`,
        'Executing Research -> Financial Analysis -> Verification -> Risk -> Reconciliation -> Report.'
      );

      addToast(
        'Orchestrator Pipeline Started',
        'Running 5-agent state machine (~20s with live progress)...',
        'verified'
      );

      try {
        const result = await runProjectPipelineOrchestrator({
          project: target,
          simulateRiskFailure: Boolean(target.simulateRiskFailure),
          stepDelayMs,
          onEvent: (evt) => {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === projectId
                  ? {
                      ...p,
                      pipelineEvents: [evt, ...(p.pipelineEvents || [])],
                    }
                  : p
              )
            );
          },
          onAgentStateChange: (agentId, patch) => {
            setProjects((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                return {
                  ...p,
                  updatedAt: new Date().toISOString(),
                  agents: p.agents.map((a) => (a.id === agentId ? { ...a, ...patch } : a)),
                };
              })
            );
          },
          onProjectStateChange: (patch) => {
            setProjects((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                const merged = { ...p, ...patch };
                persistProjectUpdate(merged);
                return merged;
              })
            );
          },
          onAuditLog: (action, targetType, targetId, targetLabel, targetRoute, details) => {
            recordAudit(action, targetType, targetId, targetLabel, targetRoute, details);
          },
        });

        addToast(
          result.finalStatus === 'Needs Review'
            ? 'Pipeline Finished — Needs Human Review'
            : 'Pipeline Completed',
          target.simulateRiskFailure
            ? 'Risk Agent failed (simulated). Retry agent or disable simulation.'
            : 'All 5 agents & Reconciliation finished. Ready for human review.',
          target.simulateRiskFailure ? 'risk' : 'verified'
        );
      } finally {
        setIsPipelineRunning(false);
      }
    },
    [projects, isPipelineRunning, persistProjectUpdate, recordAudit, addToast]
  );

  const runSingleAgent = useCallback(
    async (projectId: string, agentId: string) => {
      const target = projects.find((p) => p.id === projectId);
      if (!target || isPipelineRunning) return;
      const agent = target.agents.find((a) => a.id === agentId);
      if (!agent) return;

      setIsPipelineRunning(true);

      const shouldClearSimFail = agent.role === 'Assess Risk' && agent.status === 'Failed';

      if (shouldClearSimFail) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, simulateRiskFailure: false } : p))
        );
      }

      addToast(`Running ${agent.name}`, 'Executing targeted single-agent run...', 'verified');

      try {
        await runProjectPipelineOrchestrator({
          project: {
            ...target,
            simulateRiskFailure: shouldClearSimFail ? false : Boolean(target.simulateRiskFailure),
          },
          singleAgentId: agentId,
          simulateRiskFailure: shouldClearSimFail ? false : Boolean(target.simulateRiskFailure),
          stepDelayMs: 1400,
          onEvent: (evt) => {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === projectId
                  ? {
                      ...p,
                      pipelineEvents: [evt, ...(p.pipelineEvents || [])],
                    }
                  : p
              )
            );
          },
          onAgentStateChange: (aId, patch) => {
            setProjects((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                return {
                  ...p,
                  updatedAt: new Date().toISOString(),
                  agents: p.agents.map((a) => (a.id === aId ? { ...a, ...patch } : a)),
                };
              })
            );
          },
          onProjectStateChange: (patch) => {
            setProjects((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                const merged = { ...p, ...patch };
                persistProjectUpdate(merged);
                return merged;
              })
            );
          },
          onAuditLog: (action, targetType, targetId, targetLabel, targetRoute, details) => {
            recordAudit(action, targetType, targetId, targetLabel, targetRoute, details);
          },
        });

        addToast(
          `${agent.name} Completed`,
          'Updated typed JSON output and audit trail.',
          'verified'
        );
      } finally {
        setIsPipelineRunning(false);
      }
    },
    [projects, isPipelineRunning, persistProjectUpdate, recordAudit, addToast]
  );

  const toggleSimulateRiskFailure = useCallback(
    (projectId: string) => {
      const target = projects.find((p) => p.id === projectId);
      if (!target) return;
      const nextSimState = !target.simulateRiskFailure;
      const nowIso = new Date().toISOString();

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const updated: Project = {
            ...p,
            simulateRiskFailure: nextSimState,
            status: 'Needs Review',
            updatedAt: nowIso,
            report: {
              ...p.report,
              reviewStatus: 'Draft — Needs Review',
            },
            pipelineEvents: [
              {
                id: `evt-sim-${Date.now()}`,
                timestamp: nowIso,
                agentId: 'agent-risk',
                agentName: 'Risk & Uncertainty Assessment Agent',
                level: nextSimState ? 'error' : 'info',
                message: nextSimState
                  ? 'Simulate Risk Agent failure ENABLED: Risk Agent set to Failed; Report blocked from Verified status.'
                  : 'Simulate Risk Agent failure DISABLED: Risk Agent restored to Completed.',
              },
              ...(p.pipelineEvents || []),
            ],
            agents: p.agents.map((a) => {
              if (a.role !== 'Assess Risk') return a;
              return {
                ...a,
                status: nextSimState
                  ? ('Failed' as WorkflowStatus)
                  : ('Completed' as WorkflowStatus),
                statusHistory: [
                  ...(a.statusHistory || []),
                  {
                    status: nextSimState ? 'Failed' : 'Completed',
                    timestamp: nowIso,
                    note: nextSimState
                      ? 'Simulated Risk Agent failure toggled ON'
                      : 'Simulated Risk Agent failure toggled OFF',
                  },
                ],
                logs: [
                  ...a.logs,
                  nextSimState
                    ? `[${new Date().toLocaleTimeString()}] FAULT INJECTED: Risk Agent set to Failed. Report blocked from Verified status.`
                    : `[${new Date().toLocaleTimeString()}] FAULT CLEARED: Risk Agent restored to Completed.`,
                ],
              };
            }),
          };
          persistProjectUpdate(updated);
          return updated;
        })
      );

      recordAudit(
        nextSimState
          ? 'Enabled Simulate Risk Agent Failure'
          : 'Disabled Simulate Risk Agent Failure',
        'Project',
        projectId,
        'Risk & Uncertainty Agent',
        `/app/project/${projectId}/pipeline`,
        nextSimState
          ? 'Risk Agent forced to Failed state; Report blocked from Verified status.'
          : 'Risk Agent restored to Completed.'
      );

      addToast(
        nextSimState ? 'Risk Agent Failure Simulated' : 'Risk Agent Restored',
        nextSimState
          ? 'Risk Agent is now Failed. Click "Retry agent" to recover.'
          : 'Fault simulation disabled.',
        nextSimState ? 'risk' : 'verified'
      );
    },
    [projects, persistProjectUpdate, recordAudit, addToast]
  );

  const flagMetricValue = useCallback(
    (projectId: string, metricId: string, flagged: boolean) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const updated: Project = {
            ...p,
            updatedAt: new Date().toISOString(),
            metrics: p.metrics.map((m) =>
              m.id === metricId ? { ...m, flaggedByAnalyst: flagged } : m
            ),
          };
          persistProjectUpdate(updated);
          return updated;
        })
      );
      recordAudit(
        flagged ? `Flagged Metric ${metricId} for Audit` : `Cleared Flag on Metric ${metricId}`,
        'Project',
        metricId,
        metricId,
        `/app/project/${projectId}/analysis/metric/${metricId}`,
        flagged
          ? 'Analyst flagged metric value for secondary provenance check.'
          : 'Analyst cleared flag on metric value.'
      );
      addToast(
        flagged ? `Metric ${metricId} Flagged` : `Metric ${metricId} Unflagged`,
        'Recorded in global audit trail.',
        flagged ? 'risk' : 'verified'
      );
    },
    [persistProjectUpdate, recordAudit, addToast]
  );

  const addMetricNote = useCallback(
    (projectId: string, metricId: string, note: string) => {
      if (!note.trim()) return;
      const stamped = `[${new Date().toLocaleTimeString()} — ${user?.name || 'Analyst'}]: ${note.trim()}`;
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const updated: Project = {
            ...p,
            updatedAt: new Date().toISOString(),
            metrics: p.metrics.map((m) =>
              m.id === metricId
                ? { ...m, analystNotes: [...(m.analystNotes || []), stamped] }
                : m
            ),
          };
          persistProjectUpdate(updated);
          return updated;
        })
      );
      recordAudit(
        `Added Analyst Note to Metric ${metricId}`,
        'Project',
        metricId,
        metricId,
        `/app/project/${projectId}/analysis/metric/${metricId}`,
        note.trim()
      );
      addToast('Metric Note Saved', note.trim(), 'verified');
    },
    [user, persistProjectUpdate, recordAudit, addToast]
  );

  const recalculateRatio = useCallback(
    (projectId: string, ratioId: string) => {
      const target = projects.find((p) => p.id === projectId);
      if (!target) return;
      const freshRatios = buildAuroraRatios(target.financials, projectId);
      const nowIso = new Date().toISOString();

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const updated: Project = {
            ...p,
            updatedAt: nowIso,
            ratios: p.ratios.map((r) => {
              if (r.id !== ratioId) return r;
              const fresh = freshRatios.find((fr) => fr.id === ratioId) || r;
              return {
                ...fresh,
                analystCorrectedNote: r.analystCorrectedNote,
                lastRecalculatedAt: nowIso,
              };
            }),
          };
          persistProjectUpdate(updated);
          return updated;
        })
      );

      recordAudit(
        `Recalculated Deterministic Ratio ${ratioId}`,
        'Ratio',
        ratioId,
        ratioId,
        `/app/project/${projectId}/analysis/ratio/${ratioId}`,
        'Re-executed deterministic TypeScript calculation function from src/lib/calculations.'
      );
      addToast(
        'Deterministic Ratio Recalculated',
        `Verified ${ratioId} from audited inputs.`,
        'verified'
      );
    },
    [projects, persistProjectUpdate, recordAudit, addToast]
  );

  const updateClaimDecision = useCallback(
    (
      projectId: string,
      claimId: string,
      decision: 'Accepted' | 'Rejected' | 'Needs Revision',
      comment: string
    ) => {
      const analystStatusMap: Record<
        'Accepted' | 'Rejected' | 'Needs Revision',
        ClaimAnalystStatus
      > = {
        Accepted: 'Accepted',
        Rejected: 'Dismissed',
        'Needs Revision': 'Open',
      };
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const updated: Project = {
            ...p,
            updatedAt: new Date().toISOString(),
            claims: p.claims.map((c) =>
              c.id === claimId
                ? {
                    ...c,
                    reviewerDecision: decision,
                    reviewerComment: comment,
                    analystStatus: analystStatusMap[decision],
                  }
                : c
            ),
          };
          persistProjectUpdate(updated);
          return updated;
        })
      );
      recordAudit(
        `Reviewer Marked Claim ${claimId} as ${decision}`,
        'Claim',
        claimId,
        `Claim ${claimId}`,
        `/app/project/${projectId}/verification/claim/${claimId}`,
        comment || `Updated human review decision to ${decision}.`
      );
      addToast(`Claim ${claimId} ${decision}`, comment || 'Recorded in audit log.', 'verified');
    },
    [persistProjectUpdate, recordAudit, addToast]
  );

  const performClaimAnalystAction = useCallback(
    (projectId: string, claimId: string, payload: ClaimAnalystActionPayload) => {
      const nowIso = new Date().toISOString();
      const actorName = user?.name || 'Marcus Vance';
      const actorRole = user?.role || 'Analyst';

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const targetClaim = p.claims.find((c) => c.id === claimId);
          if (!targetClaim) return p;

          let updatedClaims = [...p.claims];
          let updatedRatios = [...p.ratios];
          let updatedReport = { ...p.report };
          let updatedReviews = [...p.reviews];

          if (payload.type === 'accept_flag') {
            updatedClaims = updatedClaims.map((c) =>
              c.id === claimId
                ? {
                    ...c,
                    analystStatus: 'Accepted',
                    reviewerDecision: 'Accepted',
                    reviewerComment:
                      payload.justification || 'Analyst accepted verification finding.',
                  }
                : c
            );
            const rev: ReviewEvent = {
              id: `REV-${Date.now().toString().slice(-4)}`,
              projectId,
              targetType: 'Claim',
              targetId: claimId,
              reviewerName: actorName,
              reviewerRole: actorRole,
              decision: 'Accepted',
              notes: payload.justification || 'Accepted verification finding.',
              timestamp: nowIso,
            };
            updatedReviews = [rev, ...updatedReviews];
          } else if (payload.type === 'mark_corrected') {
            const corrVal =
              payload.correctedValue?.trim() ||
              targetClaim.verification.recalculatedValue ||
              'Corrected';
            const justif =
              payload.justification?.trim() || 'Corrected to match audited S1 figure.';
            updatedClaims = updatedClaims.map((c) =>
              c.id === claimId
                ? {
                    ...c,
                    analystStatus: 'Corrected',
                    correctedValue: corrVal,
                    correctionJustification: justif,
                    reviewerDecision: 'Accepted',
                    reviewerComment: `ANALYST-CORRECTED to ${corrVal}: ${justif}`,
                  }
                : c
            );
            updatedRatios = updatedRatios.map((r) =>
              targetClaim.relatedRatioIds.includes(r.id)
                ? {
                    ...r,
                    analystCorrectedNote: `Analyst-corrected via ${claimId} (${corrVal}): ${justif}`,
                  }
                : r
            );
            updatedReport = {
              ...updatedReport,
              executiveSummary: updatedReport.executiveSummary.includes('[ANALYST-CORRECTED')
                ? updatedReport.executiveSummary
                : `${updatedReport.executiveSummary} [ANALYST-CORRECTED ${claimId} -> ${corrVal}: ${justif}]`,
            };
            const rev: ReviewEvent = {
              id: `REV-${Date.now().toString().slice(-4)}`,
              projectId,
              targetType: 'Claim',
              targetId: claimId,
              reviewerName: actorName,
              reviewerRole: actorRole,
              decision: 'Accepted',
              notes: `Marked Corrected (${corrVal}): ${justif}`,
              timestamp: nowIso,
            };
            updatedReviews = [rev, ...updatedReviews];
          } else if (payload.type === 'dismiss') {
            const reason =
              payload.dismissReason?.trim() || 'Dismissed by analyst with justification.';
            updatedClaims = updatedClaims.map((c) =>
              c.id === claimId
                ? {
                    ...c,
                    analystStatus: 'Dismissed',
                    dismissReason: reason,
                    reviewerDecision: 'Rejected',
                    reviewerComment: `Dismissed: ${reason}`,
                  }
                : c
            );
            const rev: ReviewEvent = {
              id: `REV-${Date.now().toString().slice(-4)}`,
              projectId,
              targetType: 'Claim',
              targetId: claimId,
              reviewerName: actorName,
              reviewerRole: actorRole,
              decision: 'Rejected',
              notes: `Dismissed: ${reason}`,
              timestamp: nowIso,
            };
            updatedReviews = [rev, ...updatedReviews];
          } else if (payload.type === 'annotate' && payload.annotation?.trim()) {
            const noteLine = `[${new Date().toLocaleTimeString()} — ${actorName}]: ${payload.annotation.trim()}`;
            updatedClaims = updatedClaims.map((c) =>
              c.id === claimId
                ? {
                    ...c,
                    annotations: [...(c.annotations || []), noteLine],
                  }
                : c
            );
          } else if (payload.type === 'reverify') {
            updatedClaims = updatedClaims.map((c) =>
              c.id === claimId
                ? {
                    ...c,
                    verification: {
                      ...c.verification,
                      timestamp: nowIso,
                    },
                  }
                : c
            );
          } else if (payload.type === 'feedback') {
            updatedClaims = updatedClaims.map((c) =>
              c.id === claimId
                ? {
                    ...c,
                    feedbackThumb: payload.feedbackThumb,
                    feedbackComment: payload.feedbackComment,
                  }
                : c
            );
          }

          const updated: Project = {
            ...p,
            updatedAt: nowIso,
            claims: updatedClaims,
            ratios: updatedRatios,
            report: updatedReport,
            reviews: updatedReviews,
          };
          persistProjectUpdate(updated);
          return updated;
        })
      );

      recordAudit(
        `Claim ${claimId} Action: ${payload.type.toUpperCase()}`,
        'Claim',
        claimId,
        `Claim ${claimId}`,
        `/app/project/${projectId}/verification/claim/${claimId}`,
        payload.correctedValue
          ? `Analyst-corrected value=${payload.correctedValue} (${payload.justification || ''})`
          : payload.dismissReason ||
              payload.annotation ||
              payload.feedbackComment ||
              `Executed ${payload.type}`
      );

      addToast(
        `Claim ${claimId} Updated`,
        payload.type === 'mark_corrected'
          ? `Marked analyst-corrected (${payload.correctedValue}); updated Report, Ratios & Audit Log.`
          : `Recorded ${payload.type.replace('_', ' ')} in audit log.`,
        'verified'
      );
    },
    [user, persistProjectUpdate, recordAudit, addToast]
  );

  const bulkUpdateClaims = useCallback(
    (projectId: string, claimIds: string[], analystStatus: ClaimAnalystStatus, note: string) => {
      if (claimIds.length === 0) return;
      const nowIso = new Date().toISOString();
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const updated: Project = {
            ...p,
            updatedAt: nowIso,
            claims: p.claims.map((c) =>
              claimIds.includes(c.id)
                ? {
                    ...c,
                    analystStatus,
                    reviewerDecision:
                      analystStatus === 'Accepted' || analystStatus === 'Corrected'
                        ? 'Accepted'
                        : analystStatus === 'Dismissed'
                        ? 'Rejected'
                        : 'Needs Revision',
                    reviewerComment: note || `Bulk updated to ${analystStatus}`,
                  }
                : c
            ),
          };
          persistProjectUpdate(updated);
          return updated;
        })
      );

      recordAudit(
        `Bulk Updated ${claimIds.length} Claims to ${analystStatus}`,
        'Claim',
        claimIds.join(','),
        `${claimIds.length} Claims (${claimIds.join(', ')})`,
        `/app/project/${projectId}/verification`,
        note || `Bulk status set to ${analystStatus}.`
      );
      addToast(`Updated ${claimIds.length} Claims`, `Status set to ${analystStatus}.`, 'verified');
    },
    [persistProjectUpdate, recordAudit, addToast]
  );

  const updateRiskStatus = useCallback(
    (projectId: string, riskId: string, status: WorkflowStatus) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const updated: Project = {
            ...p,
            updatedAt: new Date().toISOString(),
            risks: p.risks.map((r) => (r.id === riskId ? { ...r, status } : r)),
          };
          persistProjectUpdate(updated);
          return updated;
        })
      );
      recordAudit(
        `Updated Risk ${riskId} Status to ${status}`,
        'Risk',
        riskId,
        `Risk ${riskId}`,
        `/app/project/${projectId}/risks/${riskId}`,
        `Risk workflow state changed to ${status}.`
      );
      addToast(`Risk ${riskId} Updated`, `New status: ${status}`, 'default');
    },
    [persistProjectUpdate, recordAudit, addToast]
  );

  const updateRiskAnalystDetail = useCallback(
    (
      projectId: string,
      riskId: string,
      analystStatus: RiskAnalystStatus,
      analystNotes: string
    ) => {
      const workflowMap: Record<RiskAnalystStatus, WorkflowStatus> = {
        Open: 'Needs Review',
        Investigating: 'Processing',
        Resolved: 'Completed',
        Accepted: 'Completed',
      };
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const updated: Project = {
            ...p,
            updatedAt: new Date().toISOString(),
            risks: p.risks.map((r) =>
              r.id === riskId
                ? {
                    ...r,
                    analystStatus,
                    analystNotes,
                    status: workflowMap[analystStatus],
                  }
                : r
            ),
          };
          persistProjectUpdate(updated);
          return updated;
        })
      );
      recordAudit(
        `Updated Risk ${riskId} Analyst Status to ${analystStatus}`,
        'Risk',
        riskId,
        `Risk ${riskId}`,
        `/app/project/${projectId}/risks/${riskId}`,
        analystNotes || `Analyst status set to ${analystStatus}.`
      );
      addToast(`Risk ${riskId} Saved`, `Status: ${analystStatus}`, 'verified');
    },
    [persistProjectUpdate, recordAudit, addToast]
  );

  const convertHypothesisToEvidence = useCallback(
    (projectId: string, riskId: string, sourceId: string, rationale: string) => {
      const nowIso = new Date().toISOString();
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const updated: Project = {
            ...p,
            updatedAt: nowIso,
            risks: p.risks.map((r) => {
              if (r.id !== riskId) return r;
              const nextSources = r.sourceIds.includes(sourceId)
                ? r.sourceIds
                : [...r.sourceIds, sourceId];
              return {
                ...r,
                riskType: 'Evidence-Backed',
                evidenceStrength: 'Strong',
                convertedFromHypothesis: true,
                convertedSourceId: sourceId,
                sourceIds: nextSources,
                status: 'Completed',
                analystStatus: 'Accepted',
                summary: r.summary.replace(
                  /HYPOTHESIS — not supported by evidence yet:?/i,
                  `[CONVERTED TO EVIDENCE-BACKED via ${sourceId}]`
                ),
                analystNotes: `${
                  r.analystNotes ? r.analystNotes + ' | ' : ''
                }Converted to Evidence-Backed with source ${sourceId}: ${rationale}`,
              };
            }),
          };
          persistProjectUpdate(updated);
          return updated;
        })
      );

      recordAudit(
        `Converted Hypothesis ${riskId} to Evidence-Backed Risk`,
        'Risk',
        riskId,
        `Risk ${riskId}`,
        `/app/project/${projectId}/risks/${riskId}`,
        `Attached corroborating source ${sourceId}. Rationale: ${rationale}`
      );
      addToast(
        `Hypothesis ${riskId} Converted`,
        `Upgraded to Evidence-Backed with Source ${sourceId}.`,
        'verified'
      );
    },
    [persistProjectUpdate, recordAudit, addToast]
  );

  const toggleNistControl = useCallback(
    (projectId: string, controlId: string) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const updated: Project = {
            ...p,
            updatedAt: new Date().toISOString(),
            nistChecklist: (p.nistChecklist || []).map((item) =>
              item.id === controlId ? { ...item, completed: !item.completed } : item
            ),
          };
          persistProjectUpdate(updated);
          return updated;
        })
      );
      recordAudit(
        `Toggled NIST Mitigation Control ${controlId}`,
        'Risk',
        controlId,
        controlId,
        `/app/project/${projectId}/risks`,
        `Updated NIST AI RMF mitigation control checklist state.`
      );
    },
    [persistProjectUpdate, recordAudit]
  );

  const signOffReport = useCallback(
    (
      projectId: string,
      decision: 'Reviewed & Attested' | 'Rejected' | 'Approved',
      comment: string,
      _acknowledgedUnresolved?: boolean
    ) => {
      const normalizedStatus =
        decision === 'Approved' ? 'Reviewed & Attested' : decision;
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const updated: Project = {
            ...p,
            status: normalizedStatus === 'Reviewed & Attested' ? 'Completed' : 'Needs Review',
            reviewerStatus:
              normalizedStatus === 'Reviewed & Attested' ? 'Approved' : 'Changes Requested',
            updatedAt: new Date().toISOString(),
            report: {
              ...p.report,
              reviewStatus: normalizedStatus,
              reviewerSignOff: {
                name: user?.name || 'Elena Rostova, CFA',
                role: user?.role || 'Reviewer',
                timestamp: new Date().toISOString(),
                comment,
              },
            },
          };
          persistProjectUpdate(updated);
          return updated;
        })
      );
      recordAudit(
        `Report ${normalizedStatus}`,
        'Report',
        projectId,
        `Report (${projectId})`,
        `/app/project/${projectId}/report`,
        comment || `Human review sign-off: ${normalizedStatus}`
      );
      addToast(
        `Report ${normalizedStatus}`,
        'Recorded human reviewer sign-off in audit trail.',
        normalizedStatus === 'Reviewed & Attested' ? 'verified' : 'risk'
      );
    },
    [user, persistProjectUpdate, recordAudit, addToast]
  );

  const requestReportRevision = useCallback(
    async (projectId: string, comment: string, claimIdsToReverify: string[] = []) => {
      const nowIso = new Date().toISOString();
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const nextVerNum = (p.report.versionNumber || 1) + 1;
          const currentVersions = p.report.versions || [
            {
              versionNumber: 1,
              createdAt: p.report.generatedAt,
              status: p.report.reviewStatus,
              author: 'Report Generation Agent',
              changeSummary: 'Initial 12-section research dossier compiled from verified findings.',
              reverifiedClaimIds: p.claims.map((c) => c.id),
              executiveSummarySnapshot: p.report.executiveSummary,
              unresolvedClaimIdsSnapshot: ['C2', 'C3', 'C5', 'C7', 'C8'],
            },
          ];
          const newVer = {
            versionNumber: nextVerNum,
            createdAt: nowIso,
            status: 'Draft — Needs Review',
            author: user?.name || 'Marcus Vance',
            changeSummary: comment || `Revision v${nextVerNum} requested with claim re-verification.`,
            reverifiedClaimIds:
              claimIdsToReverify.length > 0 ? claimIdsToReverify : p.claims.map((c) => c.id),
            executiveSummarySnapshot: p.report.executiveSummary,
            unresolvedClaimIdsSnapshot: p.claims
              .filter((c) => c.status !== 'Verified')
              .map((c) => c.id),
          };
          const updated: Project = {
            ...p,
            status: 'Needs Review',
            reviewerStatus: 'Changes Requested',
            updatedAt: nowIso,
            report: {
              ...p.report,
              versionNumber: nextVerNum,
              versions: [newVer, ...currentVersions],
              reviewStatus: 'Draft — Needs Review',
            },
          };
          persistProjectUpdate(updated);
          return updated;
        })
      );
      recordAudit(
        `Requested Report Revision & Claim Re-Verification`,
        'Report',
        projectId,
        `Report (${projectId})`,
        `/app/project/${projectId}/report`,
        comment || 'Created new report version and queued claim re-verification.'
      );
      addToast('Report Revision Created', 'Published new dossier version and logged audit event.', 'verified');
    },
    [user, persistProjectUpdate, recordAudit, addToast]
  );

  const addWatchlistCompany = useCallback(
    (ticker: string, companyName: string, origin: DataOrigin) => {
      const cleanTicker = ticker.trim().toUpperCase();
      if (!cleanTicker) return;
      const newItem: WatchlistItem = {
        id: `WL-${Date.now().toString().slice(-4)}`,
        projectId: activeProject.id,
        companyName: companyName.trim() || `${cleanTicker} Corp.`,
        ticker: cleanTicker,
        dataOrigin: origin,
        alertHeadline: `Stored data diff check initialized for ${cleanTicker}`,
        alertDetail: `Monitoring Net Margin (±${watchlistThresholds.netMarginDeltaPp}pp) and Revenue YoY (±${watchlistThresholds.revenueGrowthDeltaPct}%).`,
        severity: 'Info',
        targetRoute: `/app/project/${activeProject.id}/analysis`,
        addedAt: new Date().toISOString(),
        trackedRatioIds: ['RAT-NM', 'RAT-REV-YOY'],
        latestPeriod: 'FY2024',
        lastCheckedAt: new Date().toISOString(),
        triggerRule: `Net Margin delta >= ${watchlistThresholds.netMarginDeltaPp}pp`,
        thresholdUsed: `${watchlistThresholds.netMarginDeltaPp}pp / ${watchlistThresholds.revenueGrowthDeltaPct}%`,
        valuesCompared: 'Stored FY2024 vs FY2023 baseline',
      };
      setWatchlist((prev) => [newItem, ...prev]);
      if (auth.currentUser && auth.currentUser.emailVerified) {
        void saveWatchlistItemToFirestore(newItem, auth.currentUser.uid);
      }
      recordAudit(
        `Added ${cleanTicker} to Watchlist`,
        'Watchlist',
        newItem.id,
        `${newItem.companyName} (${cleanTicker})`,
        '/app/watchlist',
        newItem.alertDetail
      );
      addToast(`Added ${cleanTicker} to Watchlist`, 'Stored data-diff alert rule active.', 'verified');
    },
    [activeProject.id, watchlistThresholds, recordAudit, addToast]
  );

  const removeWatchlistCompany = useCallback(
    (id: string) => {
      setWatchlist((prev) => prev.filter((w) => w.id !== id));
      addToast('Watchlist Item Removed', `Removed alert ${id}.`, 'default');
    },
    [addToast]
  );

  const refreshWatchlistAlerts = useCallback(() => {
    const nowIso = new Date().toISOString();
    setWatchlist((prev) =>
      prev.map((w) => ({
        ...w,
        lastCheckedAt: nowIso,
      }))
    );
    addToast('Watchlist Checks Refreshed', 'Evaluated stored financials against current thresholds.', 'verified');
  }, [addToast]);

  const updateWatchlistThresholds = useCallback(
    (patch: Partial<WatchlistThresholds>) => {
      setWatchlistThresholds((prev) => ({ ...prev, ...patch }));
      addToast('Watchlist Thresholds Updated', 'Updated deterministic diff alert thresholds.', 'verified');
    },
    [addToast]
  );

  const toggleDemoStep = useCallback((step: number) => {
    setCompletedDemoSteps((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]
    );
  }, []);

  const resetStoreToSeed = useCallback(() => {
    const seed = createSeedProject();
    setProjects([seed]);
    setActiveProjectIdState(DEFAULT_PROJECT_ID);
    const seedAudits = createInitialAuditLog();
    setAuditEntries(seedAudits);
    const seedWatchlist = createInitialWatchlist();
    setWatchlist(seedWatchlist);
    localStorage.removeItem(STORAGE_KEY);
    if (auth.currentUser && auth.currentUser.emailVerified) {
      void saveProjectToFirestore(seed, auth.currentUser.uid);
      for (const wl of seedWatchlist) {
        void saveWatchlistItemToFirestore(wl, auth.currentUser.uid);
      }
    }
    addToast(
      'Workspace Reset',
      'Restored baseline Aurora Dynamics research dataset.',
      'verified'
    );
  }, [addToast]);

  return (
    <AppStoreContext.Provider
      value={{
        user,
        isAuthReady,
        isCloudConnected,
        projects,
        activeProjectId,
        activeProject,
        auditEntries,
        watchlist,
        watchlistThresholds,
        sourceDrawer,
        toasts,
        isPipelineRunning,
        completedDemoSteps,
        guidedTourStep,
        uiDensity,
        geminiModel,
        useFallbackClaims,
        loginAsAnalyst,
        loginAsDemoAnalyst: loginAsAnalyst,
        signInWithGoogle,
        loginWithCredentials,
        logout,
        setActiveProjectId,
        openSourceDrawer,
        closeSourceDrawer,
        recordAudit,
        addToast,
        dismissToast,
        createProject,
        duplicateProject,
        deleteProject,
        triggerPipelineRun,
        runSingleAgent,
        toggleSimulateRiskFailure,
        flagMetricValue,
        addMetricNote,
        recalculateRatio,
        updateClaimDecision,
        performClaimAnalystAction,
        bulkUpdateClaims,
        updateRiskStatus,
        updateRiskAnalystDetail,
        convertHypothesisToEvidence,
        toggleNistControl,
        signOffReport,
        requestReportRevision,
        addWatchlistCompany,
        removeWatchlistCompany,
        refreshWatchlistAlerts,
        updateWatchlistThresholds,
        toggleDemoStep,
        setGuidedTourStep,
        setUiDensity,
        setGeminiModel,
        setUseFallbackClaims,
        resetStoreToSeed,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
};

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppStoreProvider');
  return ctx;
}
