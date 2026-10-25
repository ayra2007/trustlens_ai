/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppStoreProvider, useAppStore } from './store/useAppStore';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewResearchPage } from './pages/NewResearchPage';
import { DocumentViewerPage } from './pages/DocumentViewerPage';
import {
  ProjectOverviewPage,
  PipelinePage,
  AgentDetailPage,
  AnalysisPage,
  MetricDetailPage,
  RatioDetailPage,
  VerificationPage,
  ClaimDetailPage,
  RisksPage,
  RiskDetailPage,
  ReportPage,
} from './pages/ProjectWorkspacePages';
import {
  AuditPage,
  WatchlistPage,
  ComparePage,
  ResourcesPage,
  EvaluationPage,
  WalkthroughPage,
  SettingsPage,
} from './pages/GovernancePages';

const ProtectedWorkspace: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAppStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <AppShell>{children}</AppShell>;
};

export default function App() {
  return (
    <AppStoreProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />

          {/* Protected Workspace Routes (/app/*) */}
          <Route
            path="/app/dashboard"
            element={
              <ProtectedWorkspace>
                <DashboardPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/new"
            element={
              <ProtectedWorkspace>
                <NewResearchPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/project/:projectId"
            element={
              <ProtectedWorkspace>
                <ProjectOverviewPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/project/:projectId/pipeline"
            element={
              <ProtectedWorkspace>
                <PipelinePage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/project/:projectId/pipeline/agent/:agentId"
            element={
              <ProtectedWorkspace>
                <AgentDetailPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/project/:projectId/analysis"
            element={
              <ProtectedWorkspace>
                <AnalysisPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/project/:projectId/analysis/metric/:metricId"
            element={
              <ProtectedWorkspace>
                <MetricDetailPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/project/:projectId/analysis/ratio/:ratioId"
            element={
              <ProtectedWorkspace>
                <RatioDetailPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/project/:projectId/verification"
            element={
              <ProtectedWorkspace>
                <VerificationPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/project/:projectId/verification/claim/:claimId"
            element={
              <ProtectedWorkspace>
                <ClaimDetailPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/project/:projectId/risks"
            element={
              <ProtectedWorkspace>
                <RisksPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/project/:projectId/risks/:riskId"
            element={
              <ProtectedWorkspace>
                <RiskDetailPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/project/:projectId/report"
            element={
              <ProtectedWorkspace>
                <ReportPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/project/:projectId/sources/:sourceId"
            element={
              <ProtectedWorkspace>
                <DocumentViewerPage />
              </ProtectedWorkspace>
            }
          />

          {/* Governance & Cross-Project Routes */}
          <Route
            path="/app/audit"
            element={
              <ProtectedWorkspace>
                <AuditPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/watchlist"
            element={
              <ProtectedWorkspace>
                <WatchlistPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/compare"
            element={
              <ProtectedWorkspace>
                <ComparePage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/resources"
            element={
              <ProtectedWorkspace>
                <ResourcesPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/evaluation"
            element={
              <ProtectedWorkspace>
                <EvaluationPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/walkthrough"
            element={
              <ProtectedWorkspace>
                <WalkthroughPage />
              </ProtectedWorkspace>
            }
          />
          <Route
            path="/app/settings"
            element={
              <ProtectedWorkspace>
                <SettingsPage />
              </ProtectedWorkspace>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </HashRouter>
    </AppStoreProvider>
  );
}
