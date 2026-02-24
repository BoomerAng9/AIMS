/**
 * Composio Module — Cross-platform integration bridge for A.I.M.S.
 *
 * Works alongside n8n to provide full-spectrum automation:
 *   Composio = real-time, LLM-directed, OAuth-gated actions (500+ integrations)
 *   n8n      = scheduled, event-driven, visual workflow pipelines
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
export { N8N_COMPANION_WORKFLOWS } from './n8n-companions';
