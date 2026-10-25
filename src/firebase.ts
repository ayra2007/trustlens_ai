import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Project, AuditEntry, WatchlistItem, UserProfile } from './types';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return cleaned || `id-${Date.now()}`;
}

function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined) {
    return null as unknown as T;
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v !== undefined) {
      result[k] = stripUndefinedDeep(v);
    }
  }
  return result as T;
}

export async function syncUserProfileToFirestore(
  fbUser: FirebaseUser,
  preferredRole: 'Analyst' | 'Reviewer' = 'Analyst'
): Promise<UserProfile> {
  const uid = sanitizeId(fbUser.uid);
  const userRef = doc(db, 'users', uid);
  const privateRef = doc(db, 'users', uid, 'private', 'info');
  const displayName = (fbUser.displayName || fbUser.email?.split('@')[0] || 'Research Analyst').slice(0, 120);
  const email = (fbUser.email || 'analyst@trustlens-research.org').slice(0, 254);

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const batch = writeBatch(db);
      const isAdminEmail = email === 'ayrasuthar24@gmail.com';
      const initialRole: 'Analyst' | 'Reviewer' = isAdminEmail ? preferredRole : 'Analyst';

      batch.set(userRef, {
        uid,
        name: displayName,
        role: initialRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(privateRef, {
        uid,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      return {
        id: uid,
        name: displayName,
        email,
        role: initialRole,
        isCloudSynced: true,
      };
    } else {
      const data = snap.data();
      const currentRole: 'Analyst' | 'Reviewer' =
        data.role === 'Reviewer' ? 'Reviewer' : 'Analyst';
      return {
        id: uid,
        name: data.name || displayName,
        email,
        role: currentRole,
        isCloudSynced: true,
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    return {
      id: uid,
      name: displayName,
      email,
      role: preferredRole,
      isCloudSynced: true,
    };
  }
}

export async function saveProjectToFirestore(project: Project, ownerId: string): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const projectId = sanitizeId(project.id);
  const projRef = doc(db, 'projects', projectId);

  const workspaceData = stripUndefinedDeep({
    periods: project.periods || ['FY2022', 'FY2023', 'FY2024'],
    financials: project.financials || [],
    sources: project.sources || [],
    metrics: project.metrics || [],
    ratios: project.ratios || [],
    claims: project.claims || [],
    risks: project.risks || [],
    agents: project.agents || [],
    report: project.report,
    reviews: project.reviews || [],
    pipelineEvents: (project.pipelineEvents || []).slice(0, 80),
    nistChecklist: project.nistChecklist || [],
    simulateRiskFailure: Boolean(project.simulateRiskFailure),
    injectionAttemptsBlocked: project.injectionAttemptsBlocked ?? 1,
    fallbackUsed: Boolean(project.fallbackUsed),
    createdAtIso: project.createdAt,
    updatedAtIso: project.updatedAt,
  });

  try {
    const existingSnap = await getDoc(projRef);
    if (!existingSnap.exists()) {
      await setDoc(projRef, {
        id: projectId,
        ownerId: sanitizeId(ownerId),
        companyName: (project.companyName || 'Research Target').slice(0, 200),
        ticker: (project.ticker || 'TICK').slice(0, 20),
        sector: (project.sector || 'Technology').slice(0, 120),
        fiscalYearEnd: (project.fiscalYearEnd || 'Dec 31').slice(0, 40),
        dataOrigin: (project.dataOrigin || 'SYNTHETIC — FICTIONAL').slice(0, 80),
        status: project.status,
        reviewerStatus: project.reviewerStatus,
        workspaceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingData = existingSnap.data();
      // Respect Reviewer Lock unless transitioning to Needs Review
      if (
        existingData.reviewerStatus === 'Approved' &&
        project.reviewerStatus !== 'Needs Review' &&
        auth.currentUser.email !== 'ayrasuthar24@gmail.com'
      ) {
        return;
      }
      await setDoc(projRef, {
        id: existingData.id,
        ownerId: existingData.ownerId,
        companyName: (project.companyName || 'Research Target').slice(0, 200),
        ticker: (project.ticker || 'TICK').slice(0, 20),
        sector: (project.sector || 'Technology').slice(0, 120),
        fiscalYearEnd: (project.fiscalYearEnd || 'Dec 31').slice(0, 40),
        dataOrigin: (project.dataOrigin || 'SYNTHETIC — FICTIONAL').slice(0, 80),
        status: project.status,
        reviewerStatus: project.reviewerStatus,
        workspaceData,
        createdAt: existingData.createdAt,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `projects/${projectId}`);
  }
}

export async function deleteProjectFromFirestore(projectId: string): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const cleanId = sanitizeId(projectId);
  try {
    await deleteDoc(doc(db, 'projects', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${cleanId}`);
  }
}

export async function saveAuditEntryToFirestore(
  entry: AuditEntry,
  ownerId: string
): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const auditId = sanitizeId(entry.id);
  const auditRef = doc(db, 'auditEntries', auditId);

  try {
    const existingSnap = await getDoc(auditRef);
    if (existingSnap.exists()) return; // Append-only collection

    await setDoc(auditRef, {
      id: auditId,
      ownerId: sanitizeId(ownerId),
      actor: (entry.actor || 'Research Analyst').slice(0, 120),
      actorRole: entry.actorRole,
      action: (entry.action || 'Action recorded').slice(0, 300),
      targetType: entry.targetType,
      targetId: sanitizeId(entry.targetId || 'target'),
      targetLabel: (entry.targetLabel || 'Target').slice(0, 200),
      targetRoute: (entry.targetRoute || '/app/dashboard').slice(0, 300),
      details: (entry.details || 'Recorded in governance log.').slice(0, 1000),
      eventTimestamp: (entry.timestamp || new Date().toISOString()).slice(0, 64),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `auditEntries/${auditId}`);
  }
}

export async function saveWatchlistItemToFirestore(
  item: WatchlistItem,
  ownerId: string
): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const itemId = sanitizeId(item.id);
  const wlRef = doc(db, 'watchlist', itemId);

  try {
    const existingSnap = await getDoc(wlRef);
    const trackedStr = (item.trackedRatioIds || []).join(',').slice(0, 200);
    if (!existingSnap.exists()) {
      await setDoc(wlRef, {
        id: itemId,
        ownerId: sanitizeId(ownerId),
        projectId: sanitizeId(item.projectId),
        companyName: (item.companyName || 'Company').slice(0, 200),
        ticker: (item.ticker || 'TICK').slice(0, 20),
        dataOrigin: (item.dataOrigin || 'SYNTHETIC — FICTIONAL').slice(0, 80),
        alertHeadline: (item.alertHeadline || 'Alert').slice(0, 300),
        alertDetail: (item.alertDetail || 'Detail').slice(0, 600),
        severity: item.severity,
        targetRoute: (item.targetRoute || '/app/dashboard').slice(0, 300),
        addedAt: (item.addedAt || new Date().toISOString()).slice(0, 64),
        trackedRatioIds: trackedStr,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingData = existingSnap.data();
      await setDoc(wlRef, {
        id: existingData.id,
        ownerId: existingData.ownerId,
        projectId: existingData.projectId,
        companyName: existingData.companyName,
        ticker: existingData.ticker,
        dataOrigin: existingData.dataOrigin,
        alertHeadline: (item.alertHeadline || 'Alert').slice(0, 300),
        alertDetail: (item.alertDetail || 'Detail').slice(0, 600),
        severity: item.severity,
        targetRoute: (item.targetRoute || '/app/dashboard').slice(0, 300),
        addedAt: existingData.addedAt,
        trackedRatioIds: trackedStr,
        createdAt: existingData.createdAt,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `watchlist/${itemId}`);
  }
}

export function hydrateProjectFromFirestore(data: Record<string, unknown>): Project {
  const ws = (data.workspaceData as Record<string, unknown>) || {};
  return {
    id: String(data.id || ''),
    companyName: String(data.companyName || ''),
    ticker: String(data.ticker || ''),
    sector: String(data.sector || ''),
    fiscalYearEnd: String(data.fiscalYearEnd || 'Dec 31'),
    dataOrigin: (data.dataOrigin as Project['dataOrigin']) || 'SYNTHETIC — FICTIONAL',
    periods: (ws.periods as string[]) || ['FY2022', 'FY2023', 'FY2024'],
    status: (data.status as Project['status']) || 'Needs Review',
    reviewerStatus: (data.reviewerStatus as Project['reviewerStatus']) || 'Needs Review',
    createdAt: String(ws.createdAtIso || new Date().toISOString()),
    updatedAt: String(ws.updatedAtIso || new Date().toISOString()),
    financials: (ws.financials as Project['financials']) || [],
    sources: (ws.sources as Project['sources']) || [],
    metrics: (ws.metrics as Project['metrics']) || [],
    ratios: (ws.ratios as Project['ratios']) || [],
    claims: (ws.claims as Project['claims']) || [],
    risks: (ws.risks as Project['risks']) || [],
    agents: (ws.agents as Project['agents']) || [],
    report: (ws.report as Project['report']) || {
      id: 'rep-default',
      projectId: String(data.id || ''),
      title: 'Research Report',
      generatedAt: new Date().toISOString(),
      reviewStatus: 'Draft — Needs Review',
      executiveSummary: '',
      sections: [],
    },
    reviews: (ws.reviews as Project['reviews']) || [],
    pipelineEvents: (ws.pipelineEvents as Project['pipelineEvents']) || [],
    nistChecklist: (ws.nistChecklist as Project['nistChecklist']) || [],
    simulateRiskFailure: Boolean(ws.simulateRiskFailure),
    injectionAttemptsBlocked: Number(ws.injectionAttemptsBlocked ?? 1),
    fallbackUsed: Boolean(ws.fallbackUsed),
  };
}

export function hydrateAuditFromFirestore(data: Record<string, unknown>): AuditEntry {
  return {
    id: String(data.id || ''),
    timestamp: String(data.eventTimestamp || new Date().toISOString()),
    actor: String(data.actor || 'Research Analyst'),
    actorRole: (data.actorRole as AuditEntry['actorRole']) || 'Analyst',
    action: String(data.action || ''),
    targetType: (data.targetType as AuditEntry['targetType']) || 'Project',
    targetId: String(data.targetId || ''),
    targetLabel: String(data.targetLabel || ''),
    targetRoute: String(data.targetRoute || '/app/dashboard'),
    details: String(data.details || ''),
  };
}

export function hydrateWatchlistFromFirestore(data: Record<string, unknown>): WatchlistItem {
  const ratioStr = String(data.trackedRatioIds || '');
  return {
    id: String(data.id || ''),
    projectId: String(data.projectId || ''),
    companyName: String(data.companyName || ''),
    ticker: String(data.ticker || ''),
    dataOrigin: (data.dataOrigin as WatchlistItem['dataOrigin']) || 'SYNTHETIC — FICTIONAL',
    alertHeadline: String(data.alertHeadline || ''),
    alertDetail: String(data.alertDetail || ''),
    severity: (data.severity as WatchlistItem['severity']) || 'Info',
    targetRoute: String(data.targetRoute || '/app/dashboard'),
    addedAt: String(data.addedAt || new Date().toISOString()),
    trackedRatioIds: ratioStr ? ratioStr.split(',').filter(Boolean) : [],
  };
}

export {
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  collection,
  query,
  where,
  onSnapshot,
};
