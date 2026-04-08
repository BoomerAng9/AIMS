/**
 * Composio Module — Cross-platform integration bridge for A.I.M.S.
 *
 * Provides full-spectrum automation:
 *   Composio  = real-time, LLM-directed, OAuth-gated actions (500+ integrations)
 *   Companion = scheduled, event-driven workflow pipelines
 *
 * Both are orchestrated by ACHEEVY through the UEF Gateway.
 */

export { composioBridge, ComposioBridge } from './composio-bridge';
export type {
  ComposioConfig,
  ComposioTool,
  ComposioActionResult,
  ComposioConnection,
  ComposioHealthStatus,
} from './composio-bridge';
export { composioRouter } from './composio-routes';
export { COMPANION_WORKFLOWS } from './companion-workflows';
