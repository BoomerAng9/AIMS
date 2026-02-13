/**
 * @types/chain-of-command
 * @version 2.0.0
 * @owner ACHEEVY
 *
 * Canonical type definitions for the A.I.M.S. Chain of Command + Persona System.
 * All role cards, enforcement policies, and overlay configs derive from these types.
 *
 * v2.0.0 — Revised hierarchy: ACHEEVY → Boomer_Ang → Chicken Hawk → Squad Leader → Lil_Hawk
 *           Added: PersonaCard, ToolRegistryEntry, CapabilityPack, BehaviorContract
 *           Rule:  Persona ≠ Authority. Persona is voice + style overlay, NEVER permissions.
 */

/* ------------------------------------------------------------------ */
/*  1. Enum / Literal Types                                           */
/* ------------------------------------------------------------------ */

export type RoleType = 'ACHEEVY' | 'Boomer_Ang' | 'Chicken Hawk' | 'Lil_Hawk';

export type BenchLevel = 'Intern' | 'Intermediate' | 'Expert';

export type CommunicationStyle =
  | 'direct'
  | 'technical'
  | 'narrative'
  | 'concise'
  | 'diplomatic'
  | 'witty'
  | 'motivational';

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

export type WrapperType = 'SERVICE_WRAPPER' | 'JOB_RUNNER_WRAPPER' | 'CLI_WRAPPER' | 'MCP_BRIDGE_WRAPPER';

/* ------------------------------------------------------------------ */
/*  2. Voice Overlay (persona flavor — NOT authority)                  */
/* ------------------------------------------------------------------ */

export interface VoiceOverlay {
  origin_story: string;
  motivation: string;
  quirk: string;
  catchphrase: string;
  tone: CommunicationStyle;
}

/* ------------------------------------------------------------------ */
/*  3. Sidebar Nugget Rules                                           */
/* ------------------------------------------------------------------ */

export interface SidebarNuggetRules {
  max_length_words: number;
  max_frequency_per_job: number;
  user_safe_only: boolean;
}

/* ------------------------------------------------------------------ */
/*  4. Persona Card (Section 2.3 — Standard Across All Actors)        */
/*                                                                    */
/*  One schema for ACHEEVY, Boomer_Angs, Chicken Hawk, Lil_Hawks.    */
/*  Persona ≠ Authority. Voice overlay is flavor, not power.          */
/* ------------------------------------------------------------------ */

export interface PersonaCard {
  handle: string;
  class: RoleType;
  mission: string;
  authority_scope: string[];
  allowed_actions: string[];
  hard_gates: string[];
  evidence_required: string[];
  voice_overlay: VoiceOverlay;
  sidebar_nugget_rules: SidebarNuggetRules;
  kpis: string[];
  promotion_signals: string[];
}

/* ------------------------------------------------------------------ */
/*  5. Identity Layer (legacy compat — used in existing role cards)    */
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
/*  6. Chain of Command Layer                                         */
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
/*  7. Capabilities Layer                                             */
/* ------------------------------------------------------------------ */

export interface RoleCapabilities {
  specialties: string[];
  allowed_actions: string[];
  forbidden_actions: string[];
  allowed_tools: string[];
  forbidden_tools: string[];
}

/* ------------------------------------------------------------------ */
/*  8. Gates                                                          */
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
/*  9. Overlay Visibility                                             */
/* ------------------------------------------------------------------ */

export interface OverlayVisibility {
  user_safe_events_only: boolean;
  event_types_allowed: EventType[];
  snippet_policy_id: string;
}

/* ------------------------------------------------------------------ */
/*  10. Evaluation                                                    */
/* ------------------------------------------------------------------ */

export interface RoleEvaluation {
  kpis: string[];
  review_cycle: 'per_100_jobs' | 'per_300_cycles' | 'monthly' | null;
  reviewed_by: string[];
}

/* ------------------------------------------------------------------ */
/*  11. Role Card (Full Schema)                                       */
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
  /** v2: optional mission statement */
  mission?: string;
  /** v2: optional persona card (full Section 2.3 schema) */
  persona_card?: PersonaCard;
}

/* ------------------------------------------------------------------ */
/*  12. Handle Validation Rules                                       */
/* ------------------------------------------------------------------ */

export interface HandleRule {
  pattern: string;       // regex pattern string
  compiled?: RegExp;     // compiled at runtime
}

export interface HandleRules {
  ACHEEVY: HandleRule;
  Boomer_Ang: HandleRule;
  'Chicken Hawk': HandleRule;
  Lil_Hawk: HandleRule;
}

/* ------------------------------------------------------------------ */
/*  13. Enforcement Policy (v2 — with delegation chain + persona rule)*/
/* ------------------------------------------------------------------ */

export interface DenyRule {
  from_role: RoleType;
  to_handle: string;
  action: string;
  result: 'DENY';
}

export interface DelegationChain {
  description: string;
  hierarchy: string[];
  squad_leader_rule: string;
}

export interface PersonaAuthoritySeparation {
  rule: string;
  enforcement: string;
}

export interface ToolOwnershipRule {
  rule: string;
  registry: string;
}

export interface ChainBypassPrevention {
  lil_hawk_can_message: string[];
  squad_leader_can_message?: string[];
  chicken_hawk_can_message: string[];
  boomer_ang_can_message: string[];
  acheevy_speaks_downward_via?: string;
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
  never_request_user_api_keys?: boolean;
  never_claim_unconfirmed_action?: boolean;
}

export interface ExternalVoiceRule {
  only_user_facing_handle: string;
  block_if_any_other_handle_attempts_user_message: boolean;
  acheevy_intervenes_via?: string;
}

export interface EnforcementPolicy {
  policy_id: string;
  version?: string;
  effective_date?: string;
  external_voice_rule: ExternalVoiceRule;
  delegation_chain?: DelegationChain;
  chain_bypass_prevention: ChainBypassPrevention;
  persona_authority_separation?: PersonaAuthoritySeparation;
  tool_ownership_rule?: ToolOwnershipRule;
  no_proof_no_done: NoProofNoDone;
  budget_governance: BudgetGovernance;
  safety_and_privacy: SafetyAndPrivacy;
}

/* ------------------------------------------------------------------ */
/*  14. Overlay Snippet Policy                                        */
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
/*  15. Squad Metadata                                                */
/* ------------------------------------------------------------------ */

export interface SquadDefinition {
  label: string;
  description: string;
  members: string[];   // role card handles
  lead: string;        // Boomer_Ang handle
  squad_leader?: string; // designated Lil_Hawk handle (temporary coordination assignment)
}

/* ------------------------------------------------------------------ */
/*  16. Validation Result                                             */
/* ------------------------------------------------------------------ */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/* ------------------------------------------------------------------ */
/*  17. Message Routing (runtime types)                               */
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
/*  18. Overlay Event (runtime type)                                  */
/* ------------------------------------------------------------------ */

export interface OverlayEvent {
  role_handle: string;
  event: EventType;
  artifact_ref?: string;
  short_status?: string;
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  19. Tool Registry Contract (Boomer_Ang-only wrapping)             */
/* ------------------------------------------------------------------ */

export interface ToolRegistryPolicy {
  authorized_roles: RoleType[];
  plan_gate?: string;
  rate_limit?: number;
  requires_approval?: boolean;
}

export interface ToolRegistryEntry {
  tool_id: string;
  delegated_boomer_ang_owner: string;
  endpoint: string;
  luc_service_key: string;
  wrapper_type?: WrapperType;
  policy: ToolRegistryPolicy;
}

/* ------------------------------------------------------------------ */
/*  20. Capability Pack (Repo-to-Boomer_Ang mapping)                  */
/* ------------------------------------------------------------------ */

export interface CapabilityPackRepo {
  repo: string;
  delegated_owner: string;
  role: string;
  wrapper_type: WrapperType;
  license_flag?: string;
  quarantined?: boolean;
}

export interface CapabilityPack {
  pack_id: string;
  name: string;
  primary: string;
  repos: CapabilityPackRepo[];
}
