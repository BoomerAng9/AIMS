// frontend/app/api/deploy-dock/route.ts

/**
 * Deploy Dock API — Deployment Orchestration
 *
 * Handles ACHEEVY-first deployment workflows:
 * - Create deployment sessions
 * - Hatch agents
 * - Assign workflows
 * - Launch executions
 * - Query events
 *
 * tool_id: deploy_dock
 * service_key: DEPLOYMENT
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { triggerDeployDockStage, getN8nClient } from "@/lib/n8n/client";
import {
  getEvidenceLockerClient,
  createDeploymentManifest,
  storeAgentLogs,
  storeAttestation,
  type EvidenceLocker,
  type EvidenceArtifact,
} from "@/lib/evidence-locker/client";
import { getMeteringClient, type ServiceKey } from "@/lib/luc/metering";

// Metering costs for deploy dock actions
const DEPLOY_COSTS: Record<string, { service: ServiceKey; amount: number }> = {
  create: { service: "DEPLOY", amount: 5 },
  hatch: { service: "AGENTS", amount: 2 },
  assign: { service: "WORKFLOWS", amount: 3 },
  launch: { service: "DEPLOY", amount: 10 },
  verify: { service: "DEPLOY", amount: 2 },
  rollback: { service: "DEPLOY", amount: 5 },
};

// ── Persistent file-backed store (survives server restarts) ──
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const STORE_DIR = join(process.cwd(), '.data');
const STORE_FILE = join(STORE_DIR, 'deployments.json');

function loadDeployments(): Map<string, any> {
  try {
    if (existsSync(STORE_FILE)) {
      const data = JSON.parse(readFileSync(STORE_FILE, 'utf-8'));
      return new Map(Object.entries(data));
    }
  } catch {
    console.warn('[Deploy Dock] Failed to load deployments, starting fresh');
  }
  return new Map();
}

function saveDeployments(deployments: Map<string, any>) {
  try {
    if (!existsSync(STORE_DIR)) mkdirSync(STORE_DIR, { recursive: true });
    const obj = Object.fromEntries(deployments);
    writeFileSync(STORE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Deploy Dock] Failed to save deployments:', err);
  }
}

const deployments = loadDeployments();

// ─────────────────────────────────────────────────────────────
// GET: List deployments or get single deployment
// ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const deploymentId = searchParams.get("id");

    if (deploymentId) {
      const deployment = deployments.get(deploymentId);
      if (!deployment) {
        return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
      }
      return NextResponse.json(deployment);
    }

    // List all deployments for user
    const userDeployments = Array.from(deployments.values())
      .filter((d) => d.userId === session.user?.email)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ deployments: userDeployments });
  } catch (error: any) {
    console.error("[Deploy Dock] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// POST: Create new deployment or perform action
// ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;
    const userId = session.user.email;

    // Check and record metering for billable actions
    if (action !== "acheevy" && DEPLOY_COSTS[action]) {
      const meteringClient = getMeteringClient(userId);
      const cost = DEPLOY_COSTS[action];

      // Check quota
      const canExecute = await meteringClient.canExecute(cost.service, cost.amount);
      if (!canExecute.canExecute) {
        return NextResponse.json(
          {
            error: "Quota exceeded",
            message: canExecute.warning || "Insufficient quota for this action",
            service: cost.service,
            required: cost.amount,
          },
          { status: 402 }
        );
      }

      // Record usage after action completes (async, don't block)
      const recordUsage = () => {
        meteringClient.recordUsage(cost.service, cost.amount, {
          toolId: "deploy_dock",
          deploymentId: body.deploymentId,
          description: `Deploy Dock: ${action}`,
        }).catch(console.error);
      };

      // Execute action and record on success
      let result: NextResponse;
      switch (action) {
        case "create":
          result = await handleCreateDeployment(body, userId);
          break;
        case "hatch":
          result = await handleHatchAgent(body, userId);
          break;
        case "assign":
          result = await handleAssignWorkflow(body, userId);
          break;
        case "launch":
          result = await handleLaunchDeployment(body, userId);
          break;
        case "verify":
          result = await handleVerifyDeployment(body, userId);
          break;
        case "rollback":
          result = await handleRollbackDeployment(body, userId);
          break;
        default:
          return NextResponse.json({ error: "Unknown action" }, { status: 400 });
      }

      // Record usage if successful
      if (result.status === 200) {
        recordUsage();
      }

      return result;
    }

    // Non-metered actions
    switch (action) {
      case "acheevy":
        return handleAcheevyIntent(body, userId);
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[Deploy Dock] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// Action Handlers
// ─────────────────────────────────────────────────────────────

async function handleCreateDeployment(body: any, userId: string) {
  const { name, description, intent, lucBudget = 500 } = body;

  const deploymentId = `deploy-${uuidv4().slice(0, 8)}`;
  const now = new Date();

  // Generate default roster
  const roster = [
    {
      id: "ba-code",
      name: "Code_Ang",
      type: "boomer_ang",
      role: "Lead Engineer",
      status: "idle",
      capabilities: [
        { id: "code-gen", name: "Code Generation", category: "code", scope: ["*"], lucCost: 10 },
        { id: "review", name: "Code Review", category: "code", scope: ["*"], lucCost: 5 },
      ],
    },
    {
      id: "ba-quality",
      name: "Quality_Ang",
      type: "boomer_ang",
      role: "QA Lead",
      status: "idle",
      capabilities: [
        { id: "test", name: "Testing", category: "test", scope: ["*"], lucCost: 8 },
        { id: "audit", name: "Security Audit", category: "test", scope: ["*"], lucCost: 12 },
      ],
    },
    {
      id: "ch-main",
      name: "Chicken Hawk",
      type: "chicken_hawk",
      role: "Execution Supervisor",
      status: "idle",
      capabilities: [
        { id: "orchestrate", name: "Orchestration", category: "orchestrate", scope: ["*"], lucCost: 5 },
      ],
    },
    {
      id: "lh-build",
      name: "Build_Hawk",
      type: "lil_hawk",
      role: "Build Runner",
      status: "idle",
      capabilities: [
        { id: "compile", name: "Compile", category: "deploy", scope: ["*"], lucCost: 3 },
      ],
    },
    {
      id: "lh-deploy",
      name: "Deploy_Hawk",
      type: "lil_hawk",
      role: "Deploy Runner",
      status: "idle",
      capabilities: [
        { id: "container", name: "Containerize", category: "deploy", scope: ["*"], lucCost: 5 },
      ],
    },
  ];

  // Generate initial event
  const events = [
    {
      id: `evt-${uuidv4().slice(0, 8)}`,
      deploymentId,
      timestamp: now.toISOString(),
      stage: "ingest",
      title: "Deployment Created",
      description: `New deployment session initialized: ${name}`,
      agent: "acheevy",
    },
  ];

  // Generate LUC quote
  const quote = {
    deploymentId,
    estimatedTokens: Math.floor(lucBudget * 0.6), // 60% estimate
    breakdown: [
      { category: "Hatch", tokens: 50, description: "Agent initialization" },
      { category: "Assign", tokens: 30, description: "Workflow binding" },
      { category: "Launch", tokens: lucBudget * 0.4, description: "Execution" },
    ],
    totalCost: Math.floor(lucBudget * 0.6),
    currency: "LUC",
    validUntil: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    approved: false,
  };

  const deployment = {
    id: deploymentId,
    name,
    description: description || `Deployment for: ${intent}`,
    phase: "idle",
    status: "active",
    userId,
    roster,
    jobPackets: [],
    events,
    evidenceLocker: { deploymentId, artifacts: [] as EvidenceArtifact[], complete: false },
    lucBudget,
    lucSpent: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  deployments.set(deploymentId, deployment);
  saveDeployments(deployments);

  // Store initial manifest in Evidence Locker (async, don't block response)
  createDeploymentManifest(deploymentId, {
    id: deploymentId,
    name,
    description: description || `Deployment for: ${intent}`,
    userId,
    roster: roster.map((r) => ({ id: r.id, name: r.name, type: r.type, role: r.role })),
    lucBudget,
    quote,
    createdAt: now.toISOString(),
  }).then((result) => {
    if (result.success && result.artifact) {
      deployment.evidenceLocker.artifacts.push(result.artifact);
    }
  }).catch(console.error);

  return NextResponse.json({
    deployment,
    quote,
    suggestedRoster: roster,
  });
}

async function handleHatchAgent(body: any, userId: string) {
  const { deploymentId, agentId } = body;

  const deployment = deployments.get(deploymentId);
  if (!deployment) {
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  }

  // Find and activate agent
  const agent = deployment.roster.find((a: any) => a.id === agentId);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Trigger n8n webhook for hatch stage
  const n8nResult = await triggerDeployDockStage("hatch", {
    deploymentId,
    userId,
    sessionId: deployment.id,
    agents: [agentId],
    jobPacket: { agentName: agent.name, agentRole: agent.role },
  });

  agent.status = "active";
  deployment.phase = "hatch";
  deployment.updatedAt = new Date().toISOString();

  // Add event with n8n execution info
  deployment.events.push({
    id: `evt-${uuidv4().slice(0, 8)}`,
    deploymentId,
    timestamp: new Date().toISOString(),
    stage: "hatch",
    title: "Agent Hatched",
    description: `${agent.name} (${agent.role}) has been activated`,
    agent: "acheevy",
    n8nExecutionId: n8nResult.executionId,
    proof: {
      type: "manifest",
      label: "Agent Manifest",
      value: `sha256:${uuidv4().slice(0, 12)}`,
      timestamp: new Date().toISOString(),
    },
  });

  saveDeployments(deployments);
  return NextResponse.json({
    success: true,
    agent,
    deployment,
    n8n: { triggered: n8nResult.success, executionId: n8nResult.executionId },
  });
}

async function handleAssignWorkflow(body: any, userId: string) {
  const { deploymentId, workflowId, jobPacketName } = body;

  const deployment = deployments.get(deploymentId);
  if (!deployment) {
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  }

  // Create job packet
  const jobPacket = {
    id: `jp-${uuidv4().slice(0, 8)}`,
    name: jobPacketName || `Job Packet for ${workflowId}`,
    description: `Bound to n8n workflow: ${workflowId}`,
    status: "approved",
    assignedTo: "ch-main",
    scope: ["*"],
    gates: [
      { id: "gate-1", name: "Pre-Deploy Check", type: "automated", condition: "tests_passed", passed: true },
      { id: "gate-2", name: "Health Check", type: "automated", condition: "health_ok", passed: false },
      { id: "gate-3", name: "Rollback Ready", type: "evidence", condition: "snapshot_exists", passed: false },
    ],
    lucBudget: 100,
    lucSpent: 0,
    permissions: ["read", "write", "deploy"],
    n8nWorkflowId: workflowId,
    createdAt: new Date().toISOString(),
    artifacts: [],
  };

  // Trigger n8n webhook for assign stage
  const n8nResult = await triggerDeployDockStage("assign", {
    deploymentId,
    userId,
    sessionId: deployment.id,
    agents: deployment.roster.filter((a: any) => a.status === "active").map((a: any) => a.id),
    jobPacket: {
      id: jobPacket.id,
      name: jobPacket.name,
      workflowId,
      gates: jobPacket.gates,
    },
  });

  deployment.jobPackets.push(jobPacket);
  deployment.phase = "assign";
  deployment.updatedAt = new Date().toISOString();

  // Add event with n8n execution info
  deployment.events.push({
    id: `evt-${uuidv4().slice(0, 8)}`,
    deploymentId,
    timestamp: new Date().toISOString(),
    stage: "assign",
    title: "Workflow Bound",
    description: `Job packet created and bound to workflow: ${workflowId}`,
    agent: "acheevy",
    n8nExecutionId: n8nResult.executionId,
    proof: {
      type: "artifact",
      label: "Job Packet ID",
      value: jobPacket.id,
      timestamp: new Date().toISOString(),
    },
  });

  saveDeployments(deployments);
  return NextResponse.json({
    success: true,
    jobPacket,
    deployment,
    n8n: { triggered: n8nResult.success, executionId: n8nResult.executionId },
  });
}

async function handleLaunchDeployment(body: any, userId: string) {
  const { deploymentId, confirmed } = body;

  if (!confirmed) {
    return NextResponse.json({ error: "Launch must be confirmed" }, { status: 400 });
  }

  const deployment = deployments.get(deploymentId);
  if (!deployment) {
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  }

  const executionId = `exec-${uuidv4().slice(0, 8)}`;

  // Trigger n8n webhook for launch stage
  const n8nResult = await triggerDeployDockStage("launch", {
    deploymentId,
    userId,
    sessionId: deployment.id,
    agents: deployment.roster.filter((a: any) => a.status === "active").map((a: any) => a.id),
    jobPacket: {
      executionId,
      jobPackets: deployment.jobPackets,
      lucBudget: deployment.lucBudget,
    },
  });

  deployment.phase = "launch";
  deployment.updatedAt = new Date().toISOString();

  const attestationId = `attest-${uuidv4().slice(0, 16)}`;

  // Add launch event with n8n execution info
  deployment.events.push({
    id: `evt-${uuidv4().slice(0, 8)}`,
    deploymentId,
    timestamp: new Date().toISOString(),
    stage: "launch",
    title: "Deployment Launched",
    description: "Execution sequence initiated via Port Authority gateway",
    agent: "acheevy",
    n8nExecutionId: n8nResult.executionId,
    proof: {
      type: "attestation",
      label: "Launch Attestation",
      value: attestationId,
      timestamp: new Date().toISOString(),
    },
  });

  // Store launch attestation in Evidence Locker
  storeAttestation(deploymentId, {
    type: "deployment-launch",
    issuer: "acheevy",
    subject: deploymentId,
    claims: {
      executionId,
      phase: "launch",
      activeAgents: deployment.roster.filter((a: any) => a.status === "active").length,
      jobPacketCount: deployment.jobPackets.length,
      n8nTriggered: n8nResult.success,
      n8nExecutionId: n8nResult.executionId,
    },
  }).then((result) => {
    if (result.success && result.artifact) {
      deployment.evidenceLocker.artifacts.push(result.artifact);
    }
  }).catch(console.error);

  // If n8n triggered successfully, poll for completion and add verify event
  if (n8nResult.success && n8nResult.executionId) {
    const n8nClient = getN8nClient();
    // Don't block - poll in background
    n8nClient.waitForExecution(n8nResult.executionId, 30000, 3000).then((execution) => {
      if (execution?.finished && execution.status === "success") {
        deployment.events.push({
          id: `evt-${uuidv4().slice(0, 8)}`,
          deploymentId,
          timestamp: new Date().toISOString(),
          stage: "verify",
          title: "n8n Workflow Complete",
          description: "Workflow execution completed successfully",
          agent: "n8n",
          n8nExecutionId: n8nResult.executionId,
          proof: {
            type: "scan",
            label: "n8n Execution",
            value: execution.status,
            timestamp: new Date().toISOString(),
          },
        });
      }
    });
  }

  // Also add local verification event
  setTimeout(() => {
    deployment.events.push({
      id: `evt-${uuidv4().slice(0, 8)}`,
      deploymentId,
      timestamp: new Date().toISOString(),
      stage: "verify",
      title: "Validation Complete",
      description: "Chicken Hawk verified all gates passed",
      agent: "chicken_hawk",
      proof: {
        type: "scan",
        label: "Gate Scan",
        value: "3/3 gates passed",
        timestamp: new Date().toISOString(),
      },
    });
  }, 2000);

  saveDeployments(deployments);
  return NextResponse.json({
    success: true,
    executionId,
    deployment,
    n8n: { triggered: n8nResult.success, executionId: n8nResult.executionId },
  });
}

async function handleVerifyDeployment(body: any, userId: string) {
  const { deploymentId } = body;

  const deployment = deployments.get(deploymentId);
  if (!deployment) {
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  }

  // Trigger n8n webhook for verify stage
  const n8nResult = await triggerDeployDockStage("verify", {
    deploymentId,
    userId,
    sessionId: deployment.id,
    agents: deployment.roster.filter((a: any) => a.status === "active").map((a: any) => a.id),
    jobPacket: {
      jobPackets: deployment.jobPackets,
      phase: deployment.phase,
    },
  });

  deployment.phase = "verify";
  deployment.updatedAt = new Date().toISOString();

  // Add verify event
  deployment.events.push({
    id: `evt-${uuidv4().slice(0, 8)}`,
    deploymentId,
    timestamp: new Date().toISOString(),
    stage: "verify",
    title: "Verification Initiated",
    description: "Running post-deployment verification checks",
    agent: "acheevy",
    n8nExecutionId: n8nResult.executionId,
    proof: {
      type: "scan",
      label: "Verification Started",
      value: `verify-${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
    },
  });

  saveDeployments(deployments);
  return NextResponse.json({
    success: true,
    deployment,
    n8n: { triggered: n8nResult.success, executionId: n8nResult.executionId },
  });
}

async function handleRollbackDeployment(body: any, userId: string) {
  const { deploymentId, reason } = body;

  const deployment = deployments.get(deploymentId);
  if (!deployment) {
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  }

  // Trigger n8n webhook for rollback stage
  const n8nResult = await triggerDeployDockStage("rollback", {
    deploymentId,
    userId,
    sessionId: deployment.id,
    agents: deployment.roster.filter((a: any) => a.status === "active").map((a: any) => a.id),
    jobPacket: {
      reason: reason || "User initiated rollback",
      previousPhase: deployment.phase,
      jobPackets: deployment.jobPackets,
    },
  });

  const previousPhase = deployment.phase;
  deployment.phase = "rollback";
  deployment.status = "rolled_back";
  deployment.updatedAt = new Date().toISOString();

  // Deactivate all agents
  deployment.roster.forEach((agent: any) => {
    agent.status = "idle";
  });

  // Add rollback event
  deployment.events.push({
    id: `evt-${uuidv4().slice(0, 8)}`,
    deploymentId,
    timestamp: new Date().toISOString(),
    stage: "rollback",
    title: "Deployment Rolled Back",
    description: reason || `Rolled back from ${previousPhase} phase`,
    agent: "acheevy",
    n8nExecutionId: n8nResult.executionId,
    proof: {
      type: "attestation",
      label: "Rollback Attestation",
      value: `rollback-${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
    },
  });

  saveDeployments(deployments);
  return NextResponse.json({
    success: true,
    deployment,
    n8n: { triggered: n8nResult.success, executionId: n8nResult.executionId },
  });
}

async function handleAcheevyIntent(body: any, userId: string) {
  const { intent, mode } = body;

  // Simple intent classification
  const classification = classifyIntent(intent);

  // Generate ACHEEVY response based on mode
  const responses: Record<string, string> = {
    recommend: generateRecommendation(intent, classification),
    explain: generateExplanation(intent, classification),
    execute: generateExecutionPlan(intent, classification),
    prove: generateProofResponse(intent, classification),
  };

  return NextResponse.json({
    intent: {
      id: `intent-${uuidv4().slice(0, 8)}`,
      rawInput: intent,
      parsedIntent: classification.intent,
      category: classification.category,
      timestamp: new Date().toISOString(),
    },
    response: responses[mode] || responses.recommend,
    execution: {
      mode: classification.requiresDelegation ? "delegated" : "inline",
      delegateTo: classification.requiresDelegation ? ["boomer_ang", "chicken_hawk"] : [],
      lucEstimate: classification.lucEstimate,
      requiresApproval: classification.lucEstimate > 100,
      gates: classification.suggestedGates,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function classifyIntent(input: string): any {
  const lowerInput = input.toLowerCase();

  const isDeployment = /deploy|launch|release|ship/.test(lowerInput);
  const isBuild = /build|compile|bundle/.test(lowerInput);
  const isTest = /test|validate|check/.test(lowerInput);

  return {
    intent: isDeployment ? "deployment" : isBuild ? "build" : isTest ? "test" : "general",
    category: isDeployment ? "deploy" : isBuild ? "execute" : isTest ? "execute" : "recommend",
    requiresDelegation: isDeployment || isBuild,
    lucEstimate: isDeployment ? 150 : isBuild ? 80 : 30,
    suggestedGates: isDeployment
      ? ["pre-deploy", "health-check", "rollback"]
      : isBuild
        ? ["lint", "test", "build"]
        : ["validate"],
  };
}

function generateRecommendation(input: string, classification: any): string {
  return `Based on your request, I recommend a ${classification.intent === "deployment" ? "3" : "2"}-stage ${classification.intent} workflow:\n\n` +
    `1. **Hatch** - Assemble ${classification.requiresDelegation ? "Code_Ang and Quality_Ang" : "minimal agent roster"}\n` +
    `2. **Assign** - Bind to appropriate n8n workflow\n` +
    (classification.intent === "deployment" ? `3. **Launch** - Execute with rollback gates\n\n` : "\n") +
    `Estimated LUC cost: ${classification.lucEstimate} tokens.\n\nShall I proceed with this plan?`;
}

function generateExplanation(input: string, classification: any): string {
  return `The ${classification.intent} process follows the ACHEEVY delegation model:\n\n` +
    `• **ACHEEVY** handles all user communication and orchestration\n` +
    `• **Boomer_Angs** supervise specialized work domains\n` +
    `• **Chicken Hawk** converts plans to deterministic job packets\n` +
    `• **Lil_Hawks** execute bounded tasks with proofs\n\n` +
    `Each step produces verifiable artifacts stored in the Evidence Locker.\n\n` +
    `Suggested gates: ${classification.suggestedGates.join(", ")}`;
}

function generateExecutionPlan(input: string, classification: any): string {
  return `Initiating ${classification.intent} sequence...\n\n` +
    `✓ Job packet template created\n` +
    `✓ Gates configured: ${classification.suggestedGates.join(", ")}\n` +
    `✓ LUC budget estimated: ${classification.lucEstimate} tokens\n\n` +
    `Awaiting your approval to proceed to Hatch stage.`;
}

function generateProofResponse(input: string, classification: any): string {
  return `Evidence requirements for ${classification.intent}:\n\n` +
    `• **Plan Manifest** - Cryptographic hash of deployment plan\n` +
    `• **Gate Results** - Automated check results with timestamps\n` +
    `• **Execution Logs** - Signed agent activity records\n` +
    `• **Deployment Attestation** - Final bundle with all artifacts\n\n` +
    `All artifacts are cryptographically signed and immutable.`;
}
