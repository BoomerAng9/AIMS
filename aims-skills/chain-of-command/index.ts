/**
 * @module chain-of-command
 * @version 2.0.0
 * @owner ACHEEVY
 *
 * Barrel exports for the A.I.M.S. Chain of Command + Persona System.
 *
 * v2.0.0 — Revised hierarchy: ACHEEVY → Boomer_Ang → Chicken Hawk → Squad Leader → Lil_Hawk
 *           Persona ≠ Authority. Boomer_Ang-only tool ownership. Anti-hack behavior contract.
 *
 * Usage:
 *   import { RoleCardRegistry, validateHandle, evaluateRoute } from '../chain-of-command';
 *   import { loadAllRoleCards, loadPolicies } from '../chain-of-command';
 */

// ── Types ──────────────────────────────────────────────────────────
export type {
  RoleCard,
  RoleType,
  BenchLevel,
  CommunicationStyle,
  PersonaIdentity,
  PersonaCard,
  VoiceOverlay,
  SidebarNuggetRules,
  ChainOfCommand,
  RoleCapabilities,
  RoleGates,
  LucBudgetGate,
  EvidenceGate,
  SecurityGate,
  ApprovalGate,
  OverlayVisibility,
  RoleEvaluation,
  HandleRules,
  HandleRule,
  EnforcementPolicy,
  DelegationChain,
  PersonaAuthoritySeparation,
  ToolOwnershipRule,
  OverlaySnippetPolicy,
  DenyRule,
  RouteRequest,
  RouteDecision,
  OverlayEvent,
  EventType,
  PipelineStage,
  WrapperType,
  ValidationResult,
  SquadDefinition,
  ToolRegistryEntry,
  ToolRegistryPolicy,
  CapabilityPack,
  CapabilityPackRepo,
} from '../types/chain-of-command';

// ── Engine ─────────────────────────────────────────────────────────
export {
  validateHandle,
  validateRoleCard,
  evaluateRoute,
  authorizeAction,
  authorizeTool,
  checkEvidenceGate,
  checkBudgetGate,
  produceOverlayEvent,
  formatOverlaySnippet,
  scanForUnsafeContent,
  getBenchCapabilities,
  RoleCardRegistry,
} from './engine';

// ── Role Card Loader ───────────────────────────────────────────────
import type { RoleCard, EnforcementPolicy, OverlaySnippetPolicy } from '../types/chain-of-command';
import { RoleCardRegistry } from './engine';

// Static imports for all role cards
import acheevy from './role-cards/acheevy.json';
import forgeAng from './role-cards/forge-ang.json';
import bettyAnnAng from './role-cards/betty-ann-ang.json';
import avvaNoon from './role-cards/avva-noon.json';
import chickenHawk from './role-cards/chicken-hawk.json';
import lilMessengerHawk from './role-cards/lil-messenger-hawk.json';
import lilIntakeScribeHawk from './role-cards/lil-intake-scribe-hawk.json';
import lilProofrunnerHawk from './role-cards/lil-proofrunner-hawk.json';
import lilChainOfCustodyHawk from './role-cards/lil-chain-of-custody-hawk.json';
import lilAttestationHawk from './role-cards/lil-attestation-hawk.json';
import lilWorkflowSmithHawk from './role-cards/lil-workflow-smith-hawk.json';
import lilWebhookFerrymanHawk from './role-cards/lil-webhook-ferryman-hawk.json';
import lilBuildSurgeonHawk from './role-cards/lil-build-surgeon-hawk.json';
import lilDeployHandlerHawk from './role-cards/lil-deploy-handler-hawk.json';
import lilPolicySentinelHawk from './role-cards/lil-policy-sentinel-hawk.json';
import lilSecretKeeperHawk from './role-cards/lil-secret-keeper-hawk.json';
import lilInterfaceForgeHawk from './role-cards/lil-interface-forge-hawk.json';
import lilMotionTunerHawk from './role-cards/lil-motion-tuner-hawk.json';

// Static imports for policies
import chainPolicy from './policies/chain-of-command.policy.json';
import snippetPolicy from './policies/overlay-snippet.policy.json';

/**
 * All canonical role cards.
 */
export const ALL_ROLE_CARDS: RoleCard[] = [
  acheevy,
  forgeAng,
  bettyAnnAng,
  avvaNoon,
  chickenHawk,
  lilMessengerHawk,
  lilIntakeScribeHawk,
  lilProofrunnerHawk,
  lilChainOfCustodyHawk,
  lilAttestationHawk,
  lilWorkflowSmithHawk,
  lilWebhookFerrymanHawk,
  lilBuildSurgeonHawk,
  lilDeployHandlerHawk,
  lilPolicySentinelHawk,
  lilSecretKeeperHawk,
  lilInterfaceForgeHawk,
  lilMotionTunerHawk,
] as unknown as RoleCard[];

/**
 * The canonical enforcement policy.
 */
export const ENFORCEMENT_POLICY = chainPolicy as unknown as EnforcementPolicy;

/**
 * The canonical overlay snippet policy.
 */
export const OVERLAY_SNIPPET_POLICY = snippetPolicy as unknown as OverlaySnippetPolicy;

/**
 * Create a fully loaded RoleCardRegistry with all cards and policies.
 */
export function createRegistry(): RoleCardRegistry {
  const registry = new RoleCardRegistry();
  registry.loadPolicy(ENFORCEMENT_POLICY);
  registry.loadSnippetPolicy(OVERLAY_SNIPPET_POLICY);

  for (const card of ALL_ROLE_CARDS) {
    registry.register(card);
  }

  return registry;
}
