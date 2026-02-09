/**
 * @types/chain-of-command
 * @version 1.0.0
 * @owner ACHEEVY
 *
 * Canonical type definitions for the A.I.M.S. Chain of Command + Persona System.
 * All role cards, enforcement policies, and overlay configs derive from these types.
 */

/* ------------------------------------------------------------------ */
/*  1. Enum / Literal Types                                           */
/* ------------------------------------------------------------------ */

export type RoleType = 'ACHEEVY' | 'Boomer_Ang' | 'Chicken_Hawk' | 'Lil_Hawk';

export type BenchLevel = 'Intern' | 'Intermediate' | 'Expert';

export type CommunicationStyle =
  | 'direct'
  | 'technical'
  | 'narrative'
  | 'concise'
  | 'diplomatic';

export type BudgetExceedAction = 'block' | 'escalate';

export type OverlayVisibilityMode = 'HIDDEN' | 'INTERMITTENT' | 'PERSISTENT';

export type EventType =
  | 'PHASE_CHANGE'
  | 'ASSIGNED'
  | 'QUOTE_READY'
  | 'APPROVAL_REQUESTED'
  | 'DELIVERABLE_READY'
  | 'GATE_PASSED'
  | 'GATE_FAILED'
  | 'EVIDENCE_ATTACHED'
  | 'BLOCKED_NEEDS_INPUT'
  | 'RUN_STARTED'
  | 'RUN_STEP_COMPLETE'
  | 'RUN_FAILED'
  | 'ROLLBACK_STARTED'
  | 'ROLLBACK_COMPLETE'
  | 'STATUS_UPDATE';

export type PipelineStage = 'INTAKE' | 'SCOPE' | 'BUILD' | 'REVIEW' | 'DEPLOY';

/* ------------------------------------------------------------------ */
/*  2. Identity Layer (persona flavor, stable)                        */
/* ------------------------------------------------------------------ */

export interface PersonaIdentity {
  display_name: string;
  origin?: string;
  motivation?: string;
  quirk?: string;
  catchphrase?: string;
  communication_style?: CommunicationStyle | null;
}

/* ------------------------------------------------------------------ */
/*  3. Chain of Command Layer                                         */
/* ------------------------------------------------------------------ */

export interface ChainOfCommand {
  /** Handle this role reports to (null for ACHEEVY) */
  reports_to: string | null;
  /** Handles this role is allowed to message */
  can_message: string[];
  /** Handles this role must NEVER message */
  cannot_message: string[];
}

/* ------------------------------------------------------------------ */
/*  4. Capabilities Layer                                             */
/* ------------------------------------------------------------------ */

export interface RoleCapabilities {
  specialties: string[];
  allowed_actions: string[];
  forbidden_actions: string[];
  allowed_tools: string[];
  forbidden_tools: string[];
}

/* ------------------------------------------------------------------ */
/*  5. Gates                                                          */
/* ------------------------------------------------------------------ */

export interface LucBudgetGate {
  required: boolean;
  max_estimated_cost_usd: number | null;
  max_estimated_tokens: number | null;
  on_exceed: BudgetExceedAction;
}

export interface EvidenceGate {
  required_artifacts: string[];
  no_proof_no_done: boolean;
}

export interface SecurityGate {
  secrets_handling_required: boolean;
  scope_least_privilege_required: boolean;
  policy_check_required: boolean;
}

export interface ApprovalGate {
  required_for_actions: string[];
  approvers: string[];
}

export interface RoleGates {
  luc_budget: LucBudgetGate;
  evidence: EvidenceGate;
  security: SecurityGate;
  approval: ApprovalGate;
}

/* ------------------------------------------------------------------ */
/*  6. Overlay Visibility                                             */
/* ------------------------------------------------------------------ */

export interface OverlayVisibility {
  user_safe_events_only: boolean;
  event_types_allowed: EventType[];
  snippet_policy_id: string;
}

/* ------------------------------------------------------------------ */
/*  7. Evaluation                                                     */
/* ------------------------------------------------------------------ */

export interface RoleEvaluation {
  kpis: string[];
  review_cycle: 'per_100_jobs' | 'per_300_cycles' | 'monthly' | null;
  reviewed_by: string[];
}

/* ------------------------------------------------------------------ */
/*  8. Role Card (Full Schema)                                        */
/* ------------------------------------------------------------------ */

export interface RoleCard {
  schema_version: string;
  handle: string;
  role_type: RoleType;
  pmo_office: string;
  bench_level: BenchLevel | null;
  identity: PersonaIdentity;
  chain_of_command: ChainOfCommand;
  capabilities: RoleCapabilities;
  gates: RoleGates;
  overlay_visibility: OverlayVisibility;
  evaluation: RoleEvaluation;
}

/* ------------------------------------------------------------------ */
/*  9. Handle Validation Rules                                        */
/* ------------------------------------------------------------------ */

export interface HandleRule {
  pattern: string;       // regex pattern string
  compiled?: RegExp;     // compiled at runtime
}

export interface HandleRules {
  ACHEEVY: HandleRule;
  Boomer_Ang: HandleRule;
  Chicken_Hawk: HandleRule;
  Lil_Hawk: HandleRule;
}

/* ------------------------------------------------------------------ */
/*  10. Enforcement Policy                                            */
/* ------------------------------------------------------------------ */

export interface DenyRule {
  from_role: RoleType;
  to_handle: string;
  action: string;
  result: 'DENY';
}

export interface ChainBypassPrevention {
  lil_hawk_can_message: string[];
  chicken_hawk_can_message: string[];
  boomer_ang_can_message: string[];
  deny_rules: DenyRule[];
}

export interface NoProofNoDone {
  enabled: boolean;
  required_artifacts_by_stage: Record<PipelineStage, string[]>;
}

export interface BudgetGovernance {
  luc_required_for: string[];
  on_budget_exceed: string;
}

export interface SafetyAndPrivacy {
  disallow_in_overlay: string[];
  enforce_least_privilege: boolean;
  log_all_access: boolean;
}

export interface ExternalVoiceRule {
  only_user_facing_handle: string;
  block_if_any_other_handle_attempts_user_message: boolean;
}

export interface EnforcementPolicy {
  policy_id: string;
  external_voice_rule: ExternalVoiceRule;
  chain_bypass_prevention: ChainBypassPrevention;
  no_proof_no_done: NoProofNoDone;
  budget_governance: BudgetGovernance;
  safety_and_privacy: SafetyAndPrivacy;
}

/* ------------------------------------------------------------------ */
/*  11. Overlay Snippet Policy                                        */
/* ------------------------------------------------------------------ */

export interface AutoShowThresholds {
  complexity_score_0_20: OverlayVisibilityMode;
  complexity_score_21_60: OverlayVisibilityMode;
  complexity_score_61_100: OverlayVisibilityMode;
}

export interface VisibilityModes {
  default: OverlayVisibilityMode;
  auto_show_thresholds: AutoShowThresholds;
  user_toggle: string[];
}

export interface SnippetFormat {
  max_chars: number;
  max_lines: number;
  tone: string;
  allowed_fields: string[];
  forbidden_fields: string[];
}

export interface FrequencyLimit {
  max_events_per_minute: number;
  burst_limit: number;
}

export interface FrequencyLimits {
  intermittent_mode: FrequencyLimit;
  persistent_mode: FrequencyLimit;
}

export interface PersonalizationRules {
  allowed: string[];
  forbidden: string[];
  example_template: string;
}

export interface OverlaySnippetPolicy {
  policy_id: string;
  visibility_modes: VisibilityModes;
  snippet_format: SnippetFormat;
  frequency_limits: FrequencyLimits;
  personalization_rules: PersonalizationRules;
  event_catalog: EventType[];
}

/* ------------------------------------------------------------------ */
/*  12. Squad Metadata (group labels, not handles)                    */
/* ------------------------------------------------------------------ */

export interface SquadDefinition {
  label: string;
  description: string;
  members: string[];   // role card handles
  lead: string;        // Boomer_Ang handle
}

/* ------------------------------------------------------------------ */
/*  13. Validation Result                                             */
/* ------------------------------------------------------------------ */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/* ------------------------------------------------------------------ */
/*  14. Message Routing (runtime types)                               */
/* ------------------------------------------------------------------ */

export interface RouteRequest {
  from_handle: string;
  to_handle: string;
  action: string;
  payload?: Record<string, unknown>;
}

export interface RouteDecision {
  allowed: boolean;
  reason: string;
  deny_rule?: DenyRule;
}

/* ------------------------------------------------------------------ */
/*  15. Overlay Event (runtime type)                                  */
/* ------------------------------------------------------------------ */

export interface OverlayEvent {
  role_handle: string;
  event: EventType;
  artifact_ref?: string;
  short_status?: string;
  timestamp: string;
}
