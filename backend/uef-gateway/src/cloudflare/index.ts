/**
 * Cloudflare Integration Layer
 *
 * Manages the CDN, DNS, and agent-readability infrastructure for AIMS.
 *
 * Capabilities:
 *   - DNS zone management (add/remove/update records for plug instances)
 *   - Markdown-for-Agents (Accept header detection, HTML→markdown conversion)
 *   - R2 storage (export bundles, artifacts, agent data)
 *   - LLM.txt / AI Index (machine-readable site navigation)
 *   - Worker deployment (edge compute for agent routing)
 *   - X-Markdown-Tokens header for context window management
 *
 * Environment:
 *   CLOUDFLARE_API_TOKEN    — API token with Zone:Edit, DNS:Edit, R2:Write
 *   CLOUDFLARE_ACCOUNT_ID   — Account ID
 *   CLOUDFLARE_ZONE_IDS     — Comma-separated zone IDs for managed domains
 *   CLOUDFLARE_R2_BUCKET    — R2 bucket name for exports/artifacts
 */

export { CloudflareClient, cloudflare } from './client';
export { markdownForAgents, generateLlmTxt, generateAiIndex } from './markdown-agents';
export { cloudflareRouter } from './router';
export type { CloudflareConfig, DnsRecord, R2Object } from './types';
