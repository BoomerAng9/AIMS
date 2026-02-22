/**
 * Cloudflare Integration Layer
 *
 * Manages the CDN, DNS, Workers, and agent-readability infrastructure for AIMS.
 *
 * Capabilities:
 *   - DNS zone management (add/remove/update records for plug instances)
 *   - Markdown-for-Agents (Accept header detection, HTML→markdown conversion)
 *   - R2 storage via Worker (export bundles, artifacts, signed URLs)
 *   - LLM.txt / AI Index (machine-readable site navigation)
 *   - R2 Signer Worker (edge presigned URLs, uploads, downloads)
 *   - Agent Gateway Worker (edge agent detection, caching, plug routing)
 *   - X-Markdown-Tokens header for context window management
 *
 * Environment:
 *   CLOUDFLARE_API_TOKEN          — API token with Zone:Edit, DNS:Edit, R2:Write
 *   CLOUDFLARE_ACCOUNT_ID         — Account ID
 *   CLOUDFLARE_ZONE_IDS           — Comma-separated zone IDs for managed domains
 *   CLOUDFLARE_R2_BUCKET          — R2 bucket name for exports/artifacts
 *   CLOUDFLARE_R2_SIGNER_URL      — R2 Signer Worker URL (after deploy)
 *   CLOUDFLARE_R2_SIGNER_SECRET   — Shared secret for Worker auth
 *   CLOUDFLARE_AGENT_GATEWAY_URL  — Agent Gateway Worker URL (after deploy)
 *
 * Workers (infra/workers/):
 *   aims-r2-signer       — R2 presigned URL generation, uploads, downloads
 *   aims-agent-gateway    — Edge agent detection, caching, plug routing
 */

export { CloudflareClient, cloudflare } from './client';
export { markdownForAgents, generateLlmTxt, generateAiIndex } from './markdown-agents';
export { cloudflareRouter } from './router';
export type { CloudflareConfig, DnsRecord, R2Object, CloudflareDomain, MarkdownForAgentsConfig } from './types';
