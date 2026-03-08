export type NtntnIntentType =
  | 'conversation'
  | 'vertical'
  | 'plug_fabrication'
  | 'research'
  | 'workflow'
  | 'platform_operations'
  | 'deployment'
  | 'refinement'
  | 'unknown';

export type NtntnTaskComplexity = 'low' | 'medium' | 'high';

export type NtntnResearchLevel = 'none' | 'standard' | 'deep';

export type NtntnExecutionLane =
  | 'conversation_only'
  | 'direct_ii_agent'
  | 'platform_workflow'
  | 'delegated_execution';

export interface NtntnRoutingDecision {
  intent: string;
  confidence: number;
  requiresAgent: boolean;
  intent_type: NtntnIntentType;
  task_complexity: NtntnTaskComplexity;
  direct_ii_agent_capable: boolean;
  platform_workflow_capable: boolean;
  delegation_required: boolean;
  research_level: NtntnResearchLevel;
  execution_lane: NtntnExecutionLane;
  vertical_id?: string;
}

export interface LegacyAcheevyClassification {
  intent: string;
  confidence: number;
  requiresAgent: boolean;
  verticalName?: string;
  refinement?: string;
  routingDecision?: NtntnRoutingDecision;
}

function deriveIntentType(intent: string): NtntnIntentType {
  if (!intent || intent === 'conversation') return 'conversation';
  if (intent.startsWith('vertical:')) return 'vertical';
  if (intent.startsWith('plug-factory:')) return 'plug_fabrication';
  if (intent === 'perform-stack' || intent.startsWith('skill:build')) return 'plug_fabrication';
  if (intent.startsWith('skill:research')) return 'research';
  if (intent === 'pmo-route' || intent === 'workflow-pipeline') return 'workflow';
  if (intent === 'deployment-hub') return 'deployment';
  if (intent.startsWith('paas-')) return 'platform_operations';
  if (intent.startsWith('refine:')) return 'refinement';
  return 'unknown';
}

function deriveExecutionLane(intent: string, intentType: NtntnIntentType): NtntnExecutionLane {
  if (intentType === 'conversation' || intentType === 'refinement' || intentType === 'unknown') {
    return 'conversation_only';
  }

  if (intentType === 'vertical' || intentType === 'workflow' || intentType === 'platform_operations' || intentType === 'deployment') {
    return 'platform_workflow';
  }

  if (intent === 'plug-factory:custom' || intent === 'skill:build') {
    return 'direct_ii_agent';
  }

  if (intentType === 'plug_fabrication' || intentType === 'research') {
    return 'direct_ii_agent';
  }

  return 'direct_ii_agent';
}

function deriveTaskComplexity(intent: string, executionLane: NtntnExecutionLane): NtntnTaskComplexity {
  if (executionLane === 'conversation_only') return 'low';
  if (intent === 'plug-factory:custom' || intent === 'skill:build' || intent === 'content-pipeline') return 'high';
  return executionLane === 'platform_workflow' ? 'medium' : 'medium';
}

function deriveResearchLevel(message: string, intentType: NtntnIntentType): NtntnResearchLevel {
  const lower = message.toLowerCase();
  if (/(deep research|exhaustive|comprehensive|full audit|benchmark|compare multiple)/.test(lower)) {
    return 'deep';
  }

  if (intentType === 'research' || /\b(research|analyze|investigate|audit|compare|benchmark)\b/.test(lower)) {
    return 'standard';
  }

  return 'none';
}

export function buildNtntnRoutingDecision(
  message: string,
  classification: Pick<LegacyAcheevyClassification, 'intent' | 'confidence' | 'requiresAgent'>,
): NtntnRoutingDecision {
  const intentType = deriveIntentType(classification.intent);
  const executionLane = deriveExecutionLane(classification.intent, intentType);

  return {
    intent: classification.intent,
    confidence: classification.confidence,
    requiresAgent: classification.requiresAgent,
    intent_type: intentType,
    task_complexity: deriveTaskComplexity(classification.intent, executionLane),
    direct_ii_agent_capable: executionLane === 'direct_ii_agent',
    platform_workflow_capable: executionLane === 'platform_workflow' || intentType === 'vertical',
    delegation_required: classification.intent === 'plug-factory:custom' || classification.intent === 'skill:build',
    research_level: deriveResearchLevel(message, intentType),
    execution_lane: executionLane,
    vertical_id: classification.intent.startsWith('vertical:')
      ? classification.intent.replace('vertical:', '')
      : undefined,
  };
}

export function normalizeAcheevyClassification(
  message: string,
  classification: LegacyAcheevyClassification,
): LegacyAcheevyClassification & { routingDecision: NtntnRoutingDecision } {
  return {
    ...classification,
    routingDecision: classification.routingDecision || buildNtntnRoutingDecision(message, classification),
  };
}