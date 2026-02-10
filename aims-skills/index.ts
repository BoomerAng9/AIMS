/**
 * A.I.M.S. Skills Module Index
 * Exports all skills, hooks, and LUC ADK
 */

// Types
export * from './types';

// Skills
export { OnboardingSopSkill } from './skills/onboarding-sop.skill';
export { IdeaValidationSkill } from './skills/idea-validation.skill';

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

// Hook Registry  
export const ACHEEVY_HOOKS = [
  OnboardingFlowHook,
  ConversationStateHook,
];
