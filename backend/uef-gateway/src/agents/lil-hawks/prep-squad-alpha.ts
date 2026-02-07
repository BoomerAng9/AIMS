/**
 * PREP_SQUAD_ALPHA — Pre-Execution Intelligence Squad
 *
 * Transforms raw user intent into clean, structured, execution-ready
 * task packets before anything touches execution engines.
 *
 * Command chain:
 *   INTAKE_LIL_HAWK  → Intent ingestion & normalization
 *   DECOMP_LIL_HAWK  → Task decomposition (DAG-ready)
 *   CONTEXT_LIL_HAWK → Context shaping & minimization
 *   POLICY_LIL_HAWK  → Governance & readiness (KYB, risk, sandbox)
 *   COST_LIL_HAWK    → Pre-cost intelligence (token prediction)
 *   ROUTER_LIL_HAWK  → Final handoff (engine selection + routing)
 *
 * Governance rules (non-negotiable):
 *   1. Users never see Lil_Hawks or execution engines
 *   2. Every task must pass PREP_SQUAD_ALPHA
 *   3. No execution without policy clearance + cost awareness + context minimization
 *   4. DT-PMO can pause, reroute, or terminate any agent chain
 *
 * Doctrine: "Activity breeds Activity — shipped beats perfect."
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger';
import {
  LilHawkProfile,
  NormalizedIntent,
  TaskGraph,
  TaskNode,
  ContextBundle,
  PolicyManifest,
  CostEstimate,
  ExecutionPacket,
} from './types';

// ---------------------------------------------------------------------------
// Squad profiles — canonical NAME_LIL_HAWK convention
// ---------------------------------------------------------------------------

export const PREP_SQUAD_PROFILES: LilHawkProfile[] = [
  {
    id: 'INTAKE_LIL_HAWK',
    name: 'INTAKE_LIL_HAWK',
    squad: 'prep-squad-alpha',
    role: 'Intent ingestion & normalization — NLP parsing, ambiguity detection, signal vs noise filtering',
    gate: false,
  },
  {
    id: 'DECOMP_LIL_HAWK',
    name: 'DECOMP_LIL_HAWK',
    squad: 'prep-squad-alpha',
    role: 'Task decomposition — break intent into atomic objectives, identify dependencies, flag missing inputs',
    gate: false,
  },
  {
    id: 'CONTEXT_LIL_HAWK',
    name: 'CONTEXT_LIL_HAWK',
    squad: 'prep-squad-alpha',
    role: 'Context shaping — identify required knowledge domains, minimize context payload size',
    gate: false,
  },
  {
    id: 'POLICY_LIL_HAWK',
    name: 'POLICY_LIL_HAWK',
    squad: 'prep-squad-alpha',
    role: 'Governance & readiness — KYB permission checks, risk classification, sandbox tagging',
    gate: true,
  },
  {
    id: 'COST_LIL_HAWK',
    name: 'COST_LIL_HAWK',
    squad: 'prep-squad-alpha',
    role: 'Pre-cost intelligence — predict token classes, estimate execution depth, flag high-cost patterns',
    gate: true,
  },
  {
    id: 'ROUTER_LIL_HAWK',
    name: 'ROUTER_LIL_HAWK',
    squad: 'prep-squad-alpha',
    role: 'Final handoff — select execution engine, choose Boomer_Ang owner, package execution packet',
    gate: false,
  },
];

// ---------------------------------------------------------------------------
// INTAKE_LIL_HAWK — Intent ingestion & normalization
// ---------------------------------------------------------------------------

function intakeNormalize(rawQuery: string): NormalizedIntent {
  const lower = rawQuery.toLowerCase().trim();

  // Signal extraction
  const signals: string[] = [];
  const intentKeywords: Record<string, string[]> = {
    BUILD: ['build', 'create', 'deploy', 'implement', 'develop', 'code', 'make'],
    RESEARCH: ['research', 'analyze', 'study', 'investigate', 'compare', 'assess'],
    CHAT: ['explain', 'help', 'what', 'how', 'why', 'tell me'],
    WORKFLOW: ['workflow', 'automate', 'pipeline', 'sequence', 'n8n', 'schedule'],
    ESTIMATE: ['cost', 'estimate', 'price', 'how much', 'budget', 'quote'],
  };

  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      signals.push(intent);
    }
  }

  // Ambiguity detection
  const ambiguities: string[] = [];
  if (signals.length === 0) ambiguities.push('NO_CLEAR_INTENT: could not detect a primary intent signal');
  if (signals.length > 2) ambiguities.push('MULTI_INTENT: query contains multiple intent signals — may need decomposition');
  if (lower.length < 10) ambiguities.push('VAGUE_INPUT: query is too short for reliable intent classification');

  // Noise filtering
  const noiseTokens = ['please', 'thanks', 'hey', 'hi', 'um', 'so', 'like', 'just', 'can you'];
  const noiseFiltered = noiseTokens.filter(t => lower.includes(t));

  // Normalize
  let normalized = rawQuery.trim();
  for (const noise of noiseTokens) {
    normalized = normalized.replace(new RegExp(`\\b${noise}\\b`, 'gi'), '').trim();
  }
  normalized = normalized.replace(/\s+/g, ' ');

  return {
    raw: rawQuery,
    normalized,
    signals,
    ambiguities,
    noiseFiltered,
    language: 'en',
  };
}

// ---------------------------------------------------------------------------
// DECOMP_LIL_HAWK — Task decomposition
// ---------------------------------------------------------------------------

function decomposeTask(intent: NormalizedIntent): TaskGraph {
  const nodes: TaskNode[] = [];
  const lower = intent.normalized.toLowerCase();

  // Generate atomic objectives based on detected signals
  if (intent.signals.includes('BUILD')) {
    nodes.push({ id: 'design', objective: 'Design component architecture', dependencies: [], parallelizable: false, missingInputs: [], estimatedComplexity: 'MEDIUM' });
    nodes.push({ id: 'implement', objective: 'Implement core functionality', dependencies: ['design'], parallelizable: false, missingInputs: [], estimatedComplexity: 'HIGH' });
    nodes.push({ id: 'test', objective: 'Run verification and tests', dependencies: ['implement'], parallelizable: false, missingInputs: [], estimatedComplexity: 'LOW' });
    nodes.push({ id: 'deploy', objective: 'Deploy and verify', dependencies: ['test'], parallelizable: false, missingInputs: [], estimatedComplexity: 'MEDIUM' });
  }

  if (intent.signals.includes('RESEARCH')) {
    nodes.push({ id: 'scope', objective: 'Define research scope and questions', dependencies: [], parallelizable: false, missingInputs: [], estimatedComplexity: 'LOW' });
    nodes.push({ id: 'gather', objective: 'Gather data and sources', dependencies: ['scope'], parallelizable: true, missingInputs: [], estimatedComplexity: 'MEDIUM' });
    nodes.push({ id: 'analyze', objective: 'Analyze findings', dependencies: ['gather'], parallelizable: false, missingInputs: [], estimatedComplexity: 'HIGH' });
    nodes.push({ id: 'report', objective: 'Compile and present results', dependencies: ['analyze'], parallelizable: false, missingInputs: [], estimatedComplexity: 'LOW' });
  }

  if (intent.signals.includes('WORKFLOW')) {
    nodes.push({ id: 'wf-design', objective: 'Design workflow architecture', dependencies: [], parallelizable: false, missingInputs: [], estimatedComplexity: 'MEDIUM' });
    nodes.push({ id: 'wf-author', objective: 'Author n8n workflow nodes', dependencies: ['wf-design'], parallelizable: false, missingInputs: [], estimatedComplexity: 'HIGH' });
    nodes.push({ id: 'wf-validate', objective: 'Validate and test workflow', dependencies: ['wf-author'], parallelizable: false, missingInputs: [], estimatedComplexity: 'MEDIUM' });
  }

  // Default fallback
  if (nodes.length === 0) {
    nodes.push({ id: 'process', objective: `Process: ${intent.normalized.slice(0, 80)}`, dependencies: [], parallelizable: false, missingInputs: [], estimatedComplexity: 'MEDIUM' });
  }

  // Flag missing inputs
  if (lower.includes('for') && !lower.includes('for ')) {
    nodes.forEach(n => n.missingInputs.push('TARGET_ENTITY: who/what is this for?'));
  }

  const entryPoints = nodes.filter(n => n.dependencies.length === 0).map(n => n.id);

  // Compute critical path (longest chain)
  const criticalPath = computeCriticalPath(nodes);

  return { nodes, entryPoints, criticalPath, totalNodes: nodes.length };
}

function computeCriticalPath(nodes: TaskNode[]): string[] {
  let longest: string[] = [];

  function dfs(nodeId: string, path: string[]): void {
    const current = [...path, nodeId];
    const dependents = nodes.filter(n => n.dependencies.includes(nodeId));
    if (dependents.length === 0) {
      if (current.length > longest.length) longest = current;
    } else {
      for (const dep of dependents) {
        dfs(dep.id, current);
      }
    }
  }

  const roots = nodes.filter(n => n.dependencies.length === 0);
  for (const root of roots) {
    dfs(root.id, []);
  }

  return longest.length > 0 ? longest : nodes.map(n => n.id);
}

// ---------------------------------------------------------------------------
// CONTEXT_LIL_HAWK — Context shaping
// ---------------------------------------------------------------------------

function shapeContext(intent: NormalizedIntent, taskGraph: TaskGraph): ContextBundle {
  const domains: string[] = [];
  const sources: string[] = [];
  const scopedContext: Record<string, unknown> = {};

  // Domain detection
  const lower = intent.normalized.toLowerCase();
  if (lower.includes('athlete') || lower.includes('sport') || lower.includes('player')) { domains.push('sports-analytics'); sources.push('Per|Form'); }
  if (lower.includes('market') || lower.includes('seo') || lower.includes('campaign')) { domains.push('marketing'); sources.push('Marketer_Ang'); }
  if (lower.includes('api') || lower.includes('frontend') || lower.includes('backend')) { domains.push('engineering'); sources.push('Engineer_Ang'); }
  if (lower.includes('cost') || lower.includes('budget') || lower.includes('pricing')) { domains.push('finance'); sources.push('LUC-Engine'); }
  if (lower.includes('workflow') || lower.includes('n8n') || lower.includes('automate')) { domains.push('automation'); sources.push('WORKFLOW_SMITH_SQUAD'); }

  if (domains.length === 0) { domains.push('general'); sources.push('ACHEEVY'); }

  // Estimate context payload
  const tokenEstimate = taskGraph.totalNodes * 500 + intent.normalized.length * 2;

  scopedContext.intent = intent.signals;
  scopedContext.taskCount = taskGraph.totalNodes;
  scopedContext.domains = domains;

  return { domains, scopedContext, payloadSizeTokens: tokenEstimate, sources };
}

// ---------------------------------------------------------------------------
// POLICY_LIL_HAWK — Governance & readiness
// ---------------------------------------------------------------------------

function checkPolicy(intent: NormalizedIntent, taskGraph: TaskGraph, _context: ContextBundle): PolicyManifest {
  const blockers: string[] = [];
  const permissions: string[] = ['READ', 'EXECUTE'];
  const toolsEligible: string[] = [];

  // Risk classification
  let riskLevel: PolicyManifest['riskLevel'] = 'LOW';
  const lower = intent.normalized.toLowerCase();

  if (lower.includes('delete') || lower.includes('remove') || lower.includes('drop')) {
    riskLevel = 'HIGH';
    permissions.push('DESTRUCTIVE');
  }
  if (lower.includes('deploy') || lower.includes('push') || lower.includes('publish')) {
    riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : riskLevel;
    permissions.push('DEPLOY');
  }
  if (taskGraph.totalNodes > 6) {
    riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : riskLevel;
  }
  if (riskLevel === 'HIGH' && taskGraph.totalNodes > 10) {
    riskLevel = 'CRITICAL';
  }

  // Sandbox requirement
  const sandboxRequired = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

  // Tool eligibility
  if (intent.signals.includes('BUILD')) toolsEligible.push('ORACLE', 'Engineer_Ang', 'ChickenHawk');
  if (intent.signals.includes('RESEARCH')) toolsEligible.push('Analyst_Ang', 'ByteRover');
  if (intent.signals.includes('WORKFLOW')) toolsEligible.push('N8N', 'WORKFLOW_SMITH_SQUAD');
  if (intent.signals.includes('CHAT')) toolsEligible.push('Marketer_Ang', 'ACHEEVY');
  if (intent.signals.includes('ESTIMATE')) toolsEligible.push('LUC');

  // Blockers
  if (intent.ambiguities.some(a => a.startsWith('NO_CLEAR_INTENT'))) {
    blockers.push('Cannot proceed without a clear intent signal — ask user to clarify');
  }

  return {
    cleared: blockers.length === 0,
    riskLevel,
    permissions,
    sandboxRequired,
    toolsEligible,
    blockers,
  };
}

// ---------------------------------------------------------------------------
// COST_LIL_HAWK — Pre-cost intelligence
// ---------------------------------------------------------------------------

function estimateCost(taskGraph: TaskGraph, context: ContextBundle): CostEstimate {
  const highCostFlags: string[] = [];

  // Token class
  let tokenClass: CostEstimate['tokenClass'] = 'LIGHT';
  const totalNodes = taskGraph.totalNodes;

  if (totalNodes <= 2) tokenClass = 'LIGHT';
  else if (totalNodes <= 4) tokenClass = 'STANDARD';
  else if (totalNodes <= 8) tokenClass = 'HEAVY';
  else tokenClass = 'ENTERPRISE';

  // Estimate tokens
  const baseTokens = totalNodes * 1500;
  const contextTokens = context.payloadSizeTokens;
  const estimatedTokens = baseTokens + contextTokens;

  // Execution depth
  const executionDepth = taskGraph.criticalPath.length;

  // High-cost pattern detection
  if (context.domains.includes('sports-analytics')) highCostFlags.push('MULTI_SOURCE_DATA: sports data requires cross-referencing multiple sources');
  if (executionDepth > 4) highCostFlags.push('DEEP_CHAIN: execution depth > 4 — cost compounds per hop');
  if (estimatedTokens > 50000) highCostFlags.push('HIGH_TOKEN_COUNT: estimated > 50k tokens');

  // USD estimate (rough pricing)
  const estimatedUsd = estimatedTokens * 0.00003;

  return { tokenClass, estimatedTokens, estimatedUsd, executionDepth, highCostFlags };
}

// ---------------------------------------------------------------------------
// ROUTER_LIL_HAWK — Final handoff
// ---------------------------------------------------------------------------

function routeExecution(
  intent: NormalizedIntent,
  taskGraph: TaskGraph,
  policy: PolicyManifest,
  cost: CostEstimate
): ExecutionPacket['routingDecision'] {
  // Engine selection
  let engine: ExecutionPacket['routingDecision']['engine'] = 'ORACLE';

  if (intent.signals.includes('WORKFLOW')) engine = 'N8N';
  else if (intent.signals.includes('BUILD') && taskGraph.totalNodes > 3) engine = 'HYBRID';
  else if (cost.tokenClass === 'ENTERPRISE') engine = 'HYBRID';

  // Execution owner
  let executionOwner = 'chicken-hawk';
  if (intent.signals.includes('RESEARCH')) executionOwner = 'analyst-ang';
  else if (intent.signals.includes('CHAT')) executionOwner = 'marketer-ang';

  // Fallback
  const fallback = executionOwner === 'chicken-hawk' ? 'engineer-ang' : null;

  return { engine, executionOwner, fallback };
}

// ---------------------------------------------------------------------------
// Squad execute — runs all 6 hawks in sequence
// ---------------------------------------------------------------------------

export async function runPrepSquad(rawQuery: string, reqId: string): Promise<ExecutionPacket> {
  const packetId = `prep-${uuidv4().slice(0, 8)}`;

  // Phase 1: INTAKE_LIL_HAWK
  logger.info({ reqId, packetId }, '[INTAKE_LIL_HAWK] Normalizing intent');
  const normalizedIntent = intakeNormalize(rawQuery);

  // Phase 2: DECOMP_LIL_HAWK
  logger.info({ reqId, packetId }, '[DECOMP_LIL_HAWK] Decomposing task');
  const taskGraph = decomposeTask(normalizedIntent);

  // Phase 3: CONTEXT_LIL_HAWK
  logger.info({ reqId, packetId }, '[CONTEXT_LIL_HAWK] Shaping context');
  const contextBundle = shapeContext(normalizedIntent, taskGraph);

  // Phase 4: POLICY_LIL_HAWK
  logger.info({ reqId, packetId }, '[POLICY_LIL_HAWK] Checking governance');
  const policyManifest = checkPolicy(normalizedIntent, taskGraph, contextBundle);

  // Phase 5: COST_LIL_HAWK
  logger.info({ reqId, packetId }, '[COST_LIL_HAWK] Estimating cost');
  const costEstimate = estimateCost(taskGraph, contextBundle);

  // Phase 6: ROUTER_LIL_HAWK
  logger.info({ reqId, packetId }, '[ROUTER_LIL_HAWK] Routing execution');
  const routingDecision = routeExecution(normalizedIntent, taskGraph, policyManifest, costEstimate);

  const packet: ExecutionPacket = {
    packetId,
    normalizedIntent,
    taskGraph,
    contextBundle,
    policyManifest,
    costEstimate,
    routingDecision,
    timestamp: new Date().toISOString(),
  };

  logger.info({
    reqId, packetId,
    signals: normalizedIntent.signals,
    tasks: taskGraph.totalNodes,
    risk: policyManifest.riskLevel,
    cost: costEstimate.tokenClass,
    engine: routingDecision.engine,
    owner: routingDecision.executionOwner,
    cleared: policyManifest.cleared,
  }, '[PREP_SQUAD_ALPHA] Execution packet ready');

  return packet;
}
