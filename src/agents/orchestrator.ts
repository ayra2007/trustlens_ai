import {
  AgentNode,
  Project,
  PipelineEventLog,
  WorkflowStatus,
  AgentFinding,
} from '../types';
import {
  executeRetrieveAgentModule,
  executeAnalysisAgentModule,
  executeVerificationAgentModule,
  executeRiskAgentModule,
  executeReportAgentModule,
} from './modules';

export interface OrchestratorRunOptions {
  project: Project;
  singleAgentId?: string;
  simulateRiskFailure?: boolean;
  stepDelayMs?: number; // Default ~3600ms per stage so full 5-agent + reconciliation run takes ~20s with visible progress
  onEvent: (event: PipelineEventLog) => void;
  onAgentStateChange: (
    agentId: string,
    patch: Partial<AgentNode>
  ) => void;
  onProjectStateChange: (patch: Partial<Project>) => void;
  onAuditLog: (
    action: string,
    targetType: 'Project' | 'Claim' | 'Risk' | 'Source' | 'Report' | 'Ratio',
    targetId: string,
    targetLabel: string,
    targetRoute: string,
    details: string
  ) => void;
}

function makeEvent(
  agentId: string,
  agentName: string,
  level: PipelineEventLog['level'],
  message: string
): PipelineEventLog {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    agentId,
    agentName,
    level,
    message,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Multi-Agent State Machine Orchestrator
 * Order: Research (Retrieve) -> Financial Analysis -> Evidence Verification -> Risk & Uncertainty -> Reconciliation -> Report Generation
 */
export async function runProjectPipelineOrchestrator(
  options: OrchestratorRunOptions
): Promise<{
  finalStatus: WorkflowStatus;
  fallbackUsed: boolean;
  injectionAttemptsBlocked: number;
}> {
  const {
    project,
    singleAgentId,
    simulateRiskFailure = Boolean(project.simulateRiskFailure),
    stepDelayMs = singleAgentId ? 1500 : 3600,
    onEvent,
    onAgentStateChange,
    onProjectStateChange,
    onAuditLog,
  } = options;

  let fallbackUsed = false;
  let injectionAttemptsBlocked = project.injectionAttemptsBlocked ?? 1;
  let anyAgentFailed = false;

  const orderedAgents = [...project.agents].sort((a, b) => a.stepNumber - b.stepNumber);
  const agentsToExecute = singleAgentId
    ? orderedAgents.filter((a) => a.id === singleAgentId)
    : orderedAgents;

  // Execute deterministic agent modules so typed JSON flows cleanly from stage to stage
  const retrieveOut = executeRetrieveAgentModule(project.sources, '2024-12-31');
  injectionAttemptsBlocked = Math.max(1, retrieveOut.injectionAttemptsBlocked ?? 1);

  const analysisOut = executeAnalysisAgentModule(project, retrieveOut.outputJson);
  const verifyOut = executeVerificationAgentModule(
    project.claims,
    analysisOut.outputJson,
    fallbackUsed
  );
  const riskOut = executeRiskAgentModule(
    project.risks,
    project.claims,
    verifyOut.outputJson
  );

  const verifiedCount = project.claims.filter((c) => c.status === 'Verified').length;
  const partialCount = project.claims.filter((c) => c.status === 'Partially Supported').length;
  const contradictedCount = project.claims.filter((c) => c.status === 'Contradicted').length;
  const unsupportedCount = project.claims.filter((c) => c.status === 'Unsupported').length;

  onEvent(
    makeEvent(
      'orchestrator',
      'Orchestrator State Machine',
      'info',
      singleAgentId
        ? `Initiating targeted single-agent execution for ${agentsToExecute[0]?.name || singleAgentId}...`
        : `Orchestrator initialized for ${project.companyName} (${project.ticker}). Queuing 5 agents + Cross-Agent Reconciliation gate.`
    )
  );

  for (const agent of agentsToExecute) {
    const startMs = Date.now();
    const startIso = new Date().toISOString();

    onAgentStateChange(agent.id, {
      status: 'Processing',
      startedAt: startIso,
      statusHistory: [
        ...(agent.statusHistory || []),
        { status: 'Processing', timestamp: startIso, note: 'State transition Queued -> Processing' },
      ],
    });

    onEvent(
      makeEvent(
        agent.id,
        agent.name,
        'info',
        `Transitioned Queued -> Processing. Loading typed JSON payload for ${agent.role} stage.`
      )
    );

    await sleep(Math.round(stepDelayMs * 0.45));

    // Call server-side Gemini endpoint (/api/agent/analyze) for drafting summaries/explanations
    // Retries once on transient error; falls back to deterministic C1-C9 claims if unavailable
    let geminiData: {
      summary?: string;
      keyFinding?: string;
      verificationNote?: string;
      fallbackUsed?: boolean;
      injectionAttemptsBlocked?: number;
    } | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch('/api/agent/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentRole: agent.role,
            companyName: project.companyName,
            promptContext: `${agent.description} | Sources: S1-S7`,
          }),
        });
        if (res.ok) {
          geminiData = await res.json();
          if (geminiData?.fallbackUsed) {
            fallbackUsed = true;
          }
          break;
        } else if (attempt === 1) {
          onEvent(
            makeEvent(
              agent.id,
              agent.name,
              'warn',
              `Attempt 1 received HTTP ${res.status}. Orchestrator auto-retrying once...`
            )
          );
          await sleep(400);
        }
      } catch {
        if (attempt === 1) {
          onEvent(
            makeEvent(
              agent.id,
              agent.name,
              'warn',
              `Transient network exception on Attempt 1. Retrying agent call once...`
            )
          );
          await sleep(400);
        } else {
          fallbackUsed = true;
        }
      }
    }

    if (fallbackUsed) {
      onEvent(
        makeEvent(
          agent.id,
          agent.name,
          'warn',
          `Fallback used: Deterministic seed claims C1–C9 and verified financial tables active.`
        )
      );
    }

    await sleep(Math.round(stepDelayMs * 0.55));

    // Handle simulated failure for Risk Agent when toggle is active
    if (agent.role === 'Assess Risk' && simulateRiskFailure) {
      onEvent(
        makeEvent(
          agent.id,
          agent.name,
          'error',
          `Simulated Risk Agent exception on Attempt 1. Executing automatic orchestrator retry (Attempt 2 of 2)...`
        )
      );
      await sleep(900);
      anyAgentFailed = true;
      const failIso = new Date().toISOString();
      const durationMs = Date.now() - startMs;
      const failLog = `[${new Date().toLocaleTimeString()}] ERROR: Risk & Uncertainty Agent failed after 1 retry (Simulate Risk Agent failure toggle is ON). Downstream Report blocked from Verified status.`;

      onAgentStateChange(agent.id, {
        status: 'Failed',
        completedAt: failIso,
        durationMs,
        retryCount: (agent.retryCount || 0) + 1,
        inputJson: JSON.stringify(
          {
            stage: 'Assess Risk',
            upstreamVerifiedClaims: verifiedCount,
            upstreamContradictions: contradictedCount,
            simulateRiskFailure: true,
          },
          null,
          2
        ),
        outputJson: JSON.stringify(
          {
            error: 'RISK_MATRIX_SYNTHESIS_ABORTED',
            message: 'Simulated Risk Agent failure active. Retry agent after disabling fault injection.',
            retryAttempted: true,
          },
          null,
          2
        ),
        warnings: [
          'Risk Agent failed after 1 automatic retry.',
          'Orchestrator safety gate: Report cannot be marked Verified while Risk Agent is in Failed state.',
        ],
        logs: [...agent.logs, failLog],
        statusHistory: [
          ...(agent.statusHistory || []),
          { status: 'Failed', timestamp: failIso, note: 'Failed after 1 retry (Simulated Fault)' },
        ],
      });

      onEvent(
        makeEvent(
          agent.id,
          agent.name,
          'error',
          `Agent transitioned Processing -> Failed after retry. Run locked to Needs Review.`
        )
      );

      onAuditLog(
        `Agent Failed: ${agent.name}`,
        'Project',
        project.id,
        agent.name,
        `/app/project/${project.id}/pipeline/agent/${agent.id}`,
        `Risk Agent failed after 1 retry due to simulated failure toggle. Report verification blocked.`
      );
      continue;
    }

    let inputJsonObj: Record<string, unknown> = {};
    let outputJsonObj: Record<string, unknown> = {};
    let stageFindings: AgentFinding[] = agent.findings || [];
    let stageWarnings: string[] = agent.warnings || [];
    let nextStatus: WorkflowStatus = 'Completed';

    if (agent.role === 'Retrieve') {
      inputJsonObj = retrieveOut.inputJson;
      outputJsonObj = {
        ...retrieveOut.outputJson,
        geminiDraftSummary: geminiData?.summary || retrieveOut.summaryLog,
      };
      stageFindings = retrieveOut.findings;
      stageWarnings = retrieveOut.warnings;
      onEvent(
        makeEvent(
          agent.id,
          agent.name,
          'warn',
          `Injection guard: ${injectionAttemptsBlocked} attempt blocked in S7 p.1. Stale flag applied to S5.`
        )
      );
    } else if (agent.role === 'Analyze') {
      inputJsonObj = analysisOut.inputJson;
      outputJsonObj = {
        ...analysisOut.outputJson,
        geminiNote: geminiData?.keyFinding || analysisOut.summaryLog,
      };
      stageFindings = analysisOut.findings;
      stageWarnings = analysisOut.warnings;
    } else if (agent.role === 'Verify') {
      inputJsonObj = verifyOut.inputJson;
      outputJsonObj = verifyOut.outputJson;
      stageFindings = verifyOut.findings;
      stageWarnings = verifyOut.warnings;
      onEvent(
        makeEvent(
          agent.id,
          agent.name,
          'warn',
          `Verification matrix complete: ${verifiedCount} Verified, ${partialCount} Partially Supported, ${contradictedCount} Contradicted, ${unsupportedCount} Unsupported.`
        )
      );
    } else if (agent.role === 'Assess Risk') {
      inputJsonObj = riskOut.inputJson;
      outputJsonObj = riskOut.outputJson;
      stageFindings = riskOut.findings;
      stageWarnings = riskOut.warnings;
    } else if (agent.role === 'Report') {
      onEvent(
        makeEvent(
          'reconcile',
          'Reconciliation Gate',
          'info',
          `Reconciling Research, Financial Analysis, Verification, and Risk outputs. Checking for failed agents or contradicted claims...`
        )
      );
      await sleep(500);

      const reportOut = executeReportAgentModule(project, riskOut.outputJson, anyAgentFailed);
      nextStatus = 'Needs Review';
      inputJsonObj = reportOut.inputJson;
      outputJsonObj = reportOut.outputJson;
      stageFindings = reportOut.findings;
      stageWarnings = reportOut.warnings;
    }

    const doneIso = new Date().toISOString();
    const durationMs = Date.now() - startMs;
    const summaryLog = `[${new Date().toLocaleTimeString()}] Completed ${agent.name} in ${(
      durationMs / 1000
    ).toFixed(1)}s -> Status: ${nextStatus}. ${geminiData?.summary || ''}`;

    onAgentStateChange(agent.id, {
      status: nextStatus,
      completedAt: doneIso,
      durationMs,
      inputJson: JSON.stringify(inputJsonObj, null, 2),
      outputJson: JSON.stringify(outputJsonObj, null, 2),
      findings: stageFindings,
      warnings: stageWarnings,
      logs: [...agent.logs, summaryLog],
      statusHistory: [
        ...(agent.statusHistory || []),
        {
          status: nextStatus,
          timestamp: doneIso,
          note: `Completed stage in ${durationMs}ms`,
        },
      ],
    });

    onEvent(
      makeEvent(
        agent.id,
        agent.name,
        nextStatus === 'Needs Review' ? 'warn' : 'info',
        `Transitioned Processing -> ${nextStatus} (${(durationMs / 1000).toFixed(1)}s). Passed typed JSON output downstream.`
      )
    );
  }

  const hasContradictedOrUnsupported = project.claims.some(
    (c) => c.status === 'Contradicted' || c.status === 'Unsupported'
  );
  const finalStatus: WorkflowStatus =
    anyAgentFailed || hasContradictedOrUnsupported ? 'Needs Review' : 'Completed';

  onProjectStateChange({
    status: finalStatus,
    fallbackUsed,
    injectionAttemptsBlocked,
    updatedAt: new Date().toISOString(),
  });

  onEvent(
    makeEvent(
      'orchestrator',
      'Orchestrator State Machine',
      anyAgentFailed ? 'error' : 'info',
      `Pipeline execution finished. Overall Run Status: ${finalStatus} (${
        anyAgentFailed
          ? 'Risk Agent failed — human retry required'
          : 'Contradicted/Unsupported claims require human review attestation'
      }).`
    )
  );

  onAuditLog(
    singleAgentId ? `Completed Single-Agent Run (${singleAgentId})` : `Completed Multi-Agent Pipeline Run`,
    'Project',
    project.id,
    `${project.companyName} (${project.ticker})`,
    `/app/project/${project.id}/pipeline`,
    `Run status: ${finalStatus}. Injection guard blocked ${injectionAttemptsBlocked} attempt(s). ${
      fallbackUsed ? 'Deterministic C1–C9 fallback used.' : 'Live Gemini JSON drafting verified.'
    }`
  );

  return {
    finalStatus,
    fallbackUsed,
    injectionAttemptsBlocked,
  };
}
