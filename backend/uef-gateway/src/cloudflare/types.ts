/**
 * Cloudflare Types
 */

export interface CloudflareConfig {
  apiToken: string;
  accountId: string;
  zoneIds: string[];         // One per managed domain
  r2Bucket: string;
  r2AccountId?: string;      // If different from main account
  r2SignerUrl?: string;      // R2 Signer Worker URL
  r2SignerSecret?: string;   // Shared secret for Worker auth
  agentGatewayUrl?: string;  // Agent Gateway Worker URL
}

export interface DnsRecord {
  id?: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'SRV';
  name: string;              // e.g. "my-plug.plugmein.cloud"
  content: string;           // e.g. "76.13.96.107"
  ttl: number;               // 1 = auto
  proxied: boolean;          // true = through Cloudflare CDN
  comment?: string;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  uploaded: string;
  httpMetadata?: {
    contentType?: string;
    contentDisposition?: string;
  };
}

export interface CloudflareDomain {
  zoneId: string;
  domain: string;            // e.g. "plugmein.cloud"
  status: 'active' | 'pending' | 'initializing';
}

export interface MarkdownForAgentsConfig {
  /** Enable Accept header detection for agent requests */
  enabled: boolean;
  /** Maximum tokens to include in X-Markdown-Tokens header */
  maxTokens: number;
  /** Domains to enable markdown conversion on */
  domains: string[];
}
