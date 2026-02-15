/**
 * @module chain-of-command/engine
 * @version 2.0.0
 * @owner ACHEEVY
 *
 * Runtime enforcement engine for the A.I.M.S. Chain of Command.
 * Validates handles, enforces routing rules, checks gates, and
 * produces overlay-safe events.
 *
 * v2.0.0 — Revised hierarchy: ACHEEVY → Boomer_Ang → Chicken Hawk → Squad Leader → Lil_Hawk
 *           Added: Chicken Hawk chain validation, Lil_Hawk → Boomer_Ang deny
 *           Rule:  Persona ≠ Authority.
 */

import type {
  RoleCard,
  RoleType,
  HandleRules,
  HandleRule,
  EnforcementPolicy,
  OverlaySnippetPolicy,
  RouteRequest,
  RouteDecision,
  OverlayEvent,
  EventType,
  PipelineStage,
  ValidationResult,
  DenyRule,
  BenchLevel,
} from '../types/chain-of-command';

/* ------------------------------------------------------------------ */
/*  Handle Validation                                                 */
/* ------------------------------------------------------------------ */

const HANDLE_PATTERNS: Record<RoleType, RegExp> = {
  ACHEEVY: /^ACHEEVY$/,
  Boomer_Ang: /^[A-Za-z0-9\-]+_Ang$/,
  'Chicken Hawk': /^Chicken Hawk$/,
  Lil_Hawk: /^Lil_([A-Z][a-z0-9]+)(_[A-Z][a-z0-9]+)*_Hawk$/,
};

/**
 * Validate a handle against its declared role type.
 */
export function validateHandle(handle: string, roleType: RoleType): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pattern = HANDLE_PATTERNS[roleType];

  if (!pattern) {
    errors.push(`Unknown role type: ${roleType}`);
    return { valid: false, errors, warnings };
  }

  if (!pattern.test(handle)) {
    errors.push(
      `Handle "${handle}" does not match pattern for ${roleType}: ${pattern.source}`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

/* ------------------------------------------------------------------ */
/*  Role Card Validation                                              */
/* ------------------------------------------------------------------ */

const REQUIRED_FIELDS: (keyof RoleCard)[] = [
  'schema_version',
  'handle',
  'role_type',
  'pmo_office',
  'identity',
  'chain_of_command',
  'capabilities',
  'gates',
  'overlay_visibility',
  'evaluation',
];

/**
 * Validate a full role card against the canonical schema.
 */
export function validateRoleCard(card: RoleCard): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Required fields
  for (const field of REQUIRED_FIELDS) {
    if (card[field] === undefined || card[field] === null) {
      // bench_level is allowed to be null
      if (field === 'bench_level') continue;
      errors.push(`Missing required field: ${field}`);
    }
  }

  // 2. Handle validates against role type
  const handleResult = validateHandle(card.handle, card.role_type);
  errors.push(...handleResult.errors);

  // 3. Bench level rules
  if (card.role_type !== 'Boomer_Ang' && card.bench_level !== null) {
    warnings.push(
      `bench_level should be null for ${card.role_type} (got "${card.bench_level}")`
    );
  }

  // 4. Chain-of-command structural checks (v2 hierarchy)
  if (card.role_type === 'ACHEEVY') {
    if (card.chain_of_command.reports_to !== null) {
      errors.push('ACHEEVY must have reports_to: null');
    }
    // ACHEEVY should not directly message Chicken Hawk or Lil_Hawks
    if (card.chain_of_command.can_message.some(h =>
      h === 'Chicken Hawk' || HANDLE_PATTERNS.Lil_Hawk.test(h)
    )) {
      warnings.push('ACHEEVY should speak downward only via Boomer_Angs, not directly to Chicken Hawk or Lil_Hawks');
    }
  }

  if (card.role_type === 'Boomer_Ang') {
    if (card.chain_of_command.reports_to !== 'ACHEEVY') {
      errors.push(`Boomer_Ang must report to ACHEEVY (got "${card.chain_of_command.reports_to}")`);
    }
    // Boomer_Angs must never message USER
    if (card.chain_of_command.can_message.includes('USER')) {
      errors.push('Boomer_Ang must never have USER in can_message');
    }
  }

  if (card.role_type === 'Chicken Hawk') {
    // Chicken Hawk reports to a Boomer_Ang
    if (card.chain_of_command.reports_to === null ||
        !HANDLE_PATTERNS.Boomer_Ang.test(card.chain_of_command.reports_to)) {
      warnings.push(`Chicken Hawk should report to a Boomer_Ang (got "${card.chain_of_command.reports_to}")`);
    }
    // Chicken Hawk must never message ACHEEVY or USER
    if (!card.chain_of_command.cannot_message.includes('ACHEEVY')) {
      errors.push('Chicken Hawk must have ACHEEVY in cannot_message');
    }
    // Chicken Hawk must not have MENTOR or CHANGE_SCOPE in allowed_actions
    if (card.capabilities.allowed_actions.includes('MENTOR')) {
      errors.push('Chicken Hawk is not authorized to MENTOR (coordinator, not mentor)');
    }
    if (card.capabilities.allowed_actions.includes('CHANGE_SCOPE')) {
      errors.push('Chicken Hawk is not authorized to CHANGE_SCOPE');
    }
  }

  if (card.role_type === 'Lil_Hawk') {
    if (card.chain_of_command.reports_to !== 'Chicken Hawk') {
      errors.push(`Lil_Hawk must report to Chicken Hawk (got "${card.chain_of_command.reports_to}")`);
    }
    if (!card.chain_of_command.cannot_message.includes('ACHEEVY')) {
      errors.push('Lil_Hawk must have ACHEEVY in cannot_message');
    }
    // v2: Lil_Hawks must not directly message Boomer_Angs
    for (const handle of card.chain_of_command.can_message) {
      if (HANDLE_PATTERNS.Boomer_Ang.test(handle)) {
        errors.push(`Lil_Hawk must not directly message Boomer_Ang "${handle}" — use Squad Leader or Chicken Hawk`);
      }
    }
  }

  // 5. Evidence gate
  if (!card.gates.evidence.no_proof_no_done) {
    warnings.push('no_proof_no_done is false — are you sure?');
  }

  // 6. Overlay safety
  if (!card.overlay_visibility.user_safe_events_only) {
    errors.push('user_safe_events_only must be true for all roles');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/* ------------------------------------------------------------------ */
/*  Message Routing Enforcement                                       */
/* ------------------------------------------------------------------ */

/**
 * Check whether a message route is allowed by the chain-of-command policy.
 */
export function evaluateRoute(
  request: RouteRequest,
  senderCard: RoleCard,
  policy: EnforcementPolicy
): RouteDecision {
  // 1. External voice rule — only ACHEEVY can message the user
  if (
    request.to_handle === 'USER' &&
    request.from_handle !== policy.external_voice_rule.only_user_facing_handle
  ) {
    return {
      allowed: false,
      reason: `External voice rule: only ${policy.external_voice_rule.only_user_facing_handle} can message USER`,
    };
  }

  // 2. Check explicit deny rules
  for (const rule of policy.chain_bypass_prevention.deny_rules) {
    if (
      senderCard.role_type === rule.from_role &&
      request.to_handle === rule.to_handle &&
      request.action === rule.action
    ) {
      return {
        allowed: false,
        reason: `Deny rule: ${rule.from_role} cannot ${rule.action} ${rule.to_handle}`,
        deny_rule: rule,
      };
    }
  }

  // 3. Check sender's can_message list
  if (!senderCard.chain_of_command.can_message.includes(request.to_handle)) {
    return {
      allowed: false,
      reason: `${request.from_handle} is not authorized to message ${request.to_handle}`,
    };
  }

  // 4. Check sender's cannot_message list
  if (senderCard.chain_of_command.cannot_message.includes(request.to_handle)) {
    return {
      allowed: false,
      reason: `${request.from_handle} is explicitly blocked from messaging ${request.to_handle}`,
    };
  }

  return { allowed: true, reason: 'Route permitted by chain-of-command' };
}

/* ------------------------------------------------------------------ */
/*  Action Authorization                                              */
/* ------------------------------------------------------------------ */

/**
 * Check whether a role card is authorized to perform a given action.
 */
export function authorizeAction(
  card: RoleCard,
  action: string
): { authorized: boolean; reason: string } {
  // Forbidden always wins
  if (card.capabilities.forbidden_actions.includes(action)) {
    return {
      authorized: false,
      reason: `Action "${action}" is explicitly forbidden for ${card.handle}`,
    };
  }

  // Must be in allowed list
  if (!card.capabilities.allowed_actions.includes(action)) {
    return {
      authorized: false,
      reason: `Action "${action}" is not in the allowed_actions list for ${card.handle}`,
    };
  }

  // Check if approval is required
  if (card.gates.approval.required_for_actions.includes(action)) {
    return {
      authorized: true,
      reason: `Action "${action}" is allowed but requires approval from: ${card.gates.approval.approvers.join(', ')}`,
    };
  }

  return { authorized: true, reason: `Action "${action}" authorized for ${card.handle}` };
}

/* ------------------------------------------------------------------ */
/*  Tool Authorization                                                */
/* ------------------------------------------------------------------ */

/**
 * Check whether a role card is authorized to use a given tool.
 * v2: Tools are Boomer_Ang-owned. Chicken Hawk and Lil_Hawks only access
 * tools via delegated workflow packets from their owning Boomer_Ang.
 */
export function authorizeTool(
  card: RoleCard,
  tool: string
): { authorized: boolean; reason: string } {
  if (card.capabilities.forbidden_tools.includes(tool)) {
    return {
      authorized: false,
      reason: `Tool "${tool}" is forbidden for ${card.handle}`,
    };
  }

  if (!card.capabilities.allowed_tools.includes(tool)) {
    return {
      authorized: false,
      reason: `Tool "${tool}" is not in allowed_tools for ${card.handle}`,
    };
  }

  return { authorized: true, reason: `Tool "${tool}" authorized for ${card.handle}` };
}

/* ------------------------------------------------------------------ */
/*  Gate Checks                                                       */
/* ------------------------------------------------------------------ */

/**
 * Check whether required evidence artifacts are present for a pipeline stage.
 */
export function checkEvidenceGate(
  stage: PipelineStage,
  presentArtifacts: string[],
  policy: EnforcementPolicy
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!policy.no_proof_no_done.enabled) {
    warnings.push('no_proof_no_done is disabled in policy');
    return { valid: true, errors, warnings };
  }

  const required = policy.no_proof_no_done.required_artifacts_by_stage[stage] || [];

  for (const artifact of required) {
    if (!presentArtifacts.includes(artifact)) {
      errors.push(`Missing required artifact for ${stage}: ${artifact}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Check whether an action requires a LUC budget gate.
 */
export function checkBudgetGate(
  stage: string,
  policy: EnforcementPolicy
): { required: boolean; action_on_exceed: string } {
  const required = policy.budget_governance.luc_required_for.includes(stage);
  return {
    required,
    action_on_exceed: policy.budget_governance.on_budget_exceed,
  };
}

/* ------------------------------------------------------------------ */
/*  Overlay Event Production                                          */
/* ------------------------------------------------------------------ */

/**
 * Produce a user-safe overlay event, enforcing snippet policy.
 */
export function produceOverlayEvent(
  card: RoleCard,
  event: EventType,
  snippetPolicy: OverlaySnippetPolicy,
  opts?: { artifact_ref?: string; short_status?: string }
): OverlayEvent | null {
  // 1. Is this event type allowed for this role?
  if (!card.overlay_visibility.event_types_allowed.includes(event)) {
    return null; // Silently drop — not an error
  }

  // 2. Is this event in the policy catalog?
  if (!snippetPolicy.event_catalog.includes(event)) {
    return null;
  }

  // 3. Build the event
  const overlayEvent: OverlayEvent = {
    role_handle: card.handle,
    event,
    timestamp: new Date().toISOString(),
  };

  if (opts?.artifact_ref) {
    overlayEvent.artifact_ref = opts.artifact_ref;
  }
  if (opts?.short_status) {
    // Enforce max_chars
    overlayEvent.short_status = opts.short_status.slice(
      0,
      snippetPolicy.snippet_format.max_chars
    );
  }

  return overlayEvent;
}

/**
 * Format an overlay event into a user-safe string.
 */
export function formatOverlaySnippet(
  event: OverlayEvent,
  snippetPolicy: OverlaySnippetPolicy
): string {
  const parts = [event.role_handle, event.event];

  if (event.artifact_ref) {
    parts.push(`Proof: ${event.artifact_ref}`);
  }
  if (event.short_status) {
    parts.push(event.short_status);
  }

  let snippet = parts.join(' \u2022 ');

  // Enforce max length
  if (snippet.length > snippetPolicy.snippet_format.max_chars) {
    snippet = snippet.slice(0, snippetPolicy.snippet_format.max_chars - 3) + '...';
  }

  return snippet;
}

/* ------------------------------------------------------------------ */
/*  Overlay Content Safety Scanner                                    */
/* ------------------------------------------------------------------ */

const DEFAULT_DISALLOWED_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/gi,       // OpenAI-style keys
  /ghp_[a-zA-Z0-9]{36,}/gi,      // GitHub PATs
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/gi, // JWTs
  /AKIA[A-Z0-9]{16}/gi,          // AWS access keys
  /-----BEGIN (RSA |EC )?PRIVATE KEY-----/gi,
];

/**
 * Scan text for unsafe content that must never appear in overlays.
 */
export function scanForUnsafeContent(
  text: string,
  policy: EnforcementPolicy
): { safe: boolean; violations: string[] } {
  const violations: string[] = [];

  // Check for disallowed content types
  for (const disallowed of policy.safety_and_privacy.disallow_in_overlay) {
    if (disallowed === 'secrets' || disallowed === 'access_tokens') {
      for (const pattern of DEFAULT_DISALLOWED_PATTERNS) {
        if (pattern.test(text)) {
          violations.push(`Detected potential ${disallowed} in overlay content`);
          break;
        }
      }
    }
    if (disallowed === 'raw_system_prompts') {
      if (/system\s*prompt|<system>|<<SYS>>/i.test(text)) {
        violations.push('Detected potential raw system prompt in overlay content');
      }
    }
    if (disallowed === 'internal_tool_names' || disallowed === 'raw_endpoints') {
      if (/https?:\/\/[a-z0-9\-]+:\d{4,5}/i.test(text)) {
        violations.push('Detected potential internal endpoint in overlay content');
      }
    }
    if (disallowed === 'infrastructure_details') {
      if (/docker|container|k8s|kubernetes|namespace/i.test(text)) {
        violations.push('Detected potential infrastructure detail in overlay content');
      }
    }
  }

  return { safe: violations.length === 0, violations };
}

/* ------------------------------------------------------------------ */
/*  Bench Level Capability Check                                      */
/* ------------------------------------------------------------------ */

export interface BenchCapabilities {
  can_approve_gates: boolean;
  can_mentor: boolean;
  can_lead_multi_office: boolean;
}

const BENCH_CAPABILITIES: Record<BenchLevel, BenchCapabilities> = {
  Intern: { can_approve_gates: false, can_mentor: false, can_lead_multi_office: false },
  Intermediate: { can_approve_gates: true, can_mentor: false, can_lead_multi_office: false },
  Expert: { can_approve_gates: true, can_mentor: true, can_lead_multi_office: true },
};

/**
 * Get capabilities for a given bench level.
 */
export function getBenchCapabilities(level: BenchLevel | null): BenchCapabilities {
  if (!level) {
    return { can_approve_gates: false, can_mentor: false, can_lead_multi_office: false };
  }
  return BENCH_CAPABILITIES[level];
}

/* ------------------------------------------------------------------ */
/*  Role Card Registry                                                */
/* ------------------------------------------------------------------ */

export class RoleCardRegistry {
  private cards: Map<string, RoleCard> = new Map();
  private policy: EnforcementPolicy | null = null;
  private snippetPolicy: OverlaySnippetPolicy | null = null;

  /**
   * Register a role card.
   */
  register(card: RoleCard): ValidationResult {
    const validation = validateRoleCard(card);
    if (validation.valid) {
      this.cards.set(card.handle, card);
    }
    return validation;
  }

  /**
   * Load enforcement policy.
   */
  loadPolicy(policy: EnforcementPolicy): void {
    this.policy = policy;
  }

  /**
   * Load overlay snippet policy.
   */
  loadSnippetPolicy(policy: OverlaySnippetPolicy): void {
    this.snippetPolicy = policy;
  }

  /**
   * Get a role card by handle.
   */
  getCard(handle: string): RoleCard | undefined {
    return this.cards.get(handle);
  }

  /**
   * Get all registered cards.
   */
  getAllCards(): RoleCard[] {
    return Array.from(this.cards.values());
  }

  /**
   * Get all cards of a specific role type.
   */
  getCardsByRole(roleType: RoleType): RoleCard[] {
    return this.getAllCards().filter((c) => c.role_type === roleType);
  }

  /**
   * Evaluate a message route using loaded policy.
   */
  evaluateRoute(request: RouteRequest): RouteDecision {
    if (!this.policy) {
      return { allowed: false, reason: 'No enforcement policy loaded' };
    }
    const senderCard = this.cards.get(request.from_handle);
    if (!senderCard) {
      return { allowed: false, reason: `Unknown sender: ${request.from_handle}` };
    }
    return evaluateRoute(request, senderCard, this.policy);
  }

  /**
   * Produce an overlay event using loaded snippet policy.
   */
  produceEvent(
    handle: string,
    event: EventType,
    opts?: { artifact_ref?: string; short_status?: string }
  ): OverlayEvent | null {
    const card = this.cards.get(handle);
    if (!card || !this.snippetPolicy) return null;
    return produceOverlayEvent(card, event, this.snippetPolicy, opts);
  }

  /**
   * Get registry stats.
   */
  stats(): Record<string, number> {
    const counts: Record<string, number> = {
      total: this.cards.size,
      ACHEEVY: 0,
      Boomer_Ang: 0,
      'Chicken Hawk': 0,
      Lil_Hawk: 0,
    };
    for (const card of this.cards.values()) {
      counts[card.role_type] = (counts[card.role_type] || 0) + 1;
    }
    return counts;
  }
}
