export const type = 'aims_openhands';
export const label = 'A.I.M.S. OpenHands Agent Canvas';
export const models: Array<{ id: string; label: string }> = [];
export const agentConfigurationDoc = `# A.I.M.S. OpenHands Agent Canvas

Paperclip assignments are forwarded to the A.I.M.S. broker. The broker, not this
adapter or the task payload, resolves the company, owner, tenant, workspace,
approved model route, Second Brain scope, and approval policy.

Requirements:
- Configure AIMS_OPENHANDS_BROKER_URL on the Paperclip server (HTTPS only).
- Paperclip must provide a short-lived agent/run token to the adapter.
- The A.I.M.S. broker must independently validate that token with Paperclip and
  resolve an explicit server-side company/agent binding before dispatch.
- The broker must return a terminal result and receipt; otherwise the run fails
  or remains review-required. No model fallback or direct Canvas access occurs.

This adapter does not change an agent's model assignment.`;

export { createServerAdapter } from './server/index.js';
