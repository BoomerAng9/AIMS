/**
 * A.I.M.S. Skills Module Index
 * Exports all skills, hooks, and LUC ADK
 */

// Types
export * from './types';

// Skills
export { OnboardingSopSkill } from './skills/onboarding-sop.skill';
export { IdeaValidationSkill } from './skills/idea-validation.skill';
export { AutomationsSkill } from './skills/automations.skill';

// Hooks
export { OnboardingFlowHook } from './hooks/onboarding-flow.hook';
export { ConversationStateHook } from './hooks/conversation-state.hook';

// LUC (LUKE) ADK
export { LucAdk } from './luc/luc-adk';
export { LUC_PLANS, OVERAGE_RATES } from './luc/types';
export type { LucPlan, LucUsage, LucInvoice } from './luc/types';

// Skill Registry
export const ACHEEVY_SKILLS = [
  OnboardingSopSkill,
  IdeaValidationSkill,
  AutomationsSkill,
];

// Chain of Command
export { createRegistry, ALL_ROLE_CARDS, ENFORCEMENT_POLICY, OVERLAY_SNIPPET_POLICY } from './chain-of-command';
export { ChainOfCommandHook } from './hooks/chain-of-command.hook';

// Gateway System
export {
  createGateway,
  SDTService,
  EvidenceLockerService,
  CertificationGateService,
  SubmissionService,
  CompliancePackService,
  JobPacketService,
  LucQuoteService,
  OperationsFeedService,
  GATEWAY_SECURITY_POLICY,
  CERTIFICATION_REQUIREMENTS,
  COMPLIANCE_PACK_SCHEMA,
  GATEWAY_CONFIG,
} from './gateway';
export { GatewayEnforcementHook } from './hooks/gateway-enforcement.hook';

// NtNtN Engine (Creative Development Library + Execution Engine)
export {
  NTNTN_CATEGORIES,
  TECHNIQUE_GROUPS,
  INTENT_MAP,
  BUILD_INTENT_TRIGGERS,
  BUILD_CONTEXT_TARGETS,
  AIMS_DEFAULT_STACK,
  detectBuildIntent,
  classifyBuildIntent,
  detectScopeTier,
} from './ntntn-engine';
export type {
  NtNtNCategory,
  TechniqueGroup,
  IntentMapping,
  StackRecommendation,
  BuildManifest,
  ExecutionPillar,
  ScopeTier,
  BuildPhase,
  ExecutionPipelineStatus,
} from './ntntn-engine';

// Research: mHC (Manifold-Constrained Hyper-Connections)
export {
  sinkhornKnopp,
  verifyDoublyStochastic,
  createMHCModelEntry,
  MHC_MODEL_VARIANTS,
  MHC_KEY_INSIGHTS,
} from './research/mhc';
export type {
  MHCConfig,
  MHCLayerStats,
  MHCBenchmarkResult,
  MHCModelVariant,
  ModelGardenEntry,
} from './research/mhc';

// Automations Types
export {
  SCHEDULE_PRESETS,
  EVENT_SOURCES,
  AUTOMATION_TEMPLATES,
} from './types/automations';
export type {
  AutomationDefinition,
  AutomationTrigger,
  AutomationRun,
  AutomationTemplate,
  MCPServerConfig,
} from './types/automations';

// Hook Registry
export const ACHEEVY_HOOKS = [
  OnboardingFlowHook,
  ConversationStateHook,
];
