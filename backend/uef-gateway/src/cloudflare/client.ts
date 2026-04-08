/**
 * Cloudflare API Client
 *
 * Handles DNS record management, R2 storage, and zone operations.
 * Used by the Plug Deploy Engine to create subdomains for plug instances
 * and by the export system to store bundles in R2.
 */

import logger from '../logger';
import type { CloudflareConfig, DnsRecord, R2Object, CloudflareDomain } from './types';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

export class CloudflareClient {
  private config: CloudflareConfig;

  constructor(config?: Partial<CloudflareConfig>) {
    this.config = {
      apiToken: config?.apiToken || process.env.CLOUDFLARE_API_TOKEN || '',
      accountId: config?.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '',
      zoneIds: config?.zoneIds || (process.env.CLOUDFLARE_ZONE_IDS || '').split(',').filter(Boolean),
      r2Bucket: config?.r2Bucket || process.env.CLOUDFLARE_R2_BUCKET || 'aims-exports',
      r2SignerUrl: config?.r2SignerUrl || process.env.CLOUDFLARE_R2_SIGNER_URL || '',
      r2SignerSecret: config?.r2SignerSecret || process.env.CLOUDFLARE_R2_SIGNER_SECRET || '',
      agentGatewayUrl: config?.agentGatewayUrl || process.env.CLOUDFLARE_AGENT_GATEWAY_URL || '',
    };
  }

  // -----------------------------------------------------------------------
  // Connection check
  // -----------------------------------------------------------------------

  async isConfigured(): Promise<boolean> {
    return !!(this.config.apiToken && this.config.accountId);
  }

  async verify(): Promise<{ ok: boolean; email?: string; error?: string }> {
    try {
      const res = await this.cfFetch('/user/tokens/verify');
      if (res.success) {
        return { ok: true };
      }
      return { ok: false, error: res.errors?.[0]?.message || 'Verification failed' };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unreachable' };
    }
  }

  // -----------------------------------------------------------------------
  // DNS Record Management
  // -----------------------------------------------------------------------

  async listDnsRecords(zoneId: string, name?: string): Promise<DnsRecord[]> {
    const params = name ? `?name=${encodeURIComponent(name)}` : '';
    const res = await this.cfFetch(`/zones/${zoneId}/dns_records${params}`);
    if (!res.success) {
      logger.error({ errors: res.errors }, '[Cloudflare] Failed to list DNS records');
      return [];
    }
    return res.result.map((r: any) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      content: r.content,
      ttl: r.ttl,
      proxied: r.proxied,
      comment: r.comment,
    }));
  }

  async createDnsRecord(zoneId: string, record: DnsRecord): Promise<{ id: string; error?: string }> {
    logger.info({ zoneId, name: record.name, type: record.type }, '[Cloudflare] Creating DNS record');
    const res = await this.cfFetch(`/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify({
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl || 1,
        proxied: record.proxied !== false,
        comment: record.comment || 'Created by AIMS Plug Engine',
      }),
    });

    if (!res.success) {
      const error = res.errors?.[0]?.message || 'DNS record creation failed';
      logger.error({ error, record }, '[Cloudflare] DNS create failed');
      return { id: '', error };
    }

    logger.info({ id: res.result.id, name: record.name }, '[Cloudflare] DNS record created');
    return { id: res.result.id };
  }

  async deleteDnsRecord(zoneId: string, recordId: string): Promise<boolean> {
    const res = await this.cfFetch(`/zones/${zoneId}/dns_records/${recordId}`, {
      method: 'DELETE',
    });
    return res.success;
  }

  /**
   * Create a subdomain for a plug instance.
   * e.g. "my-agent.plugmein.cloud" → VPS IP
   */
  async createPlugSubdomain(
    instanceName: string,
    domain: string,
    targetIp: string,
  ): Promise<{ fqdn: string; recordId: string; error?: string }> {
    const zoneId = await this.findZoneForDomain(domain);
    if (!zoneId) {
      return { fqdn: '', recordId: '', error: `No zone found for domain ${domain}` };
    }

    const subdomain = instanceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const fqdn = `${subdomain}.${domain}`;

    // Check if record already exists
    const existing = await this.listDnsRecords(zoneId, fqdn);
    if (existing.length > 0) {
      return { fqdn, recordId: existing[0].id || '', error: undefined };
    }

    const result = await this.createDnsRecord(zoneId, {
      type: 'A',
      name: subdomain,
      content: targetIp,
      ttl: 1,
      proxied: true,
      comment: `AIMS plug instance: ${instanceName}`,
    });

    return { fqdn, recordId: result.id, error: result.error };
  }

  /**
   * Remove subdomain when decommissioning a plug instance.
   */
  async removePlugSubdomain(instanceName: string, domain: string): Promise<boolean> {
    const zoneId = await this.findZoneForDomain(domain);
    if (!zoneId) return false;

    const subdomain = instanceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const fqdn = `${subdomain}.${domain}`;

    const records = await this.listDnsRecords(zoneId, fqdn);
    for (const record of records) {
      if (record.id) {
        await this.deleteDnsRecord(zoneId, record.id);
      }
    }
    return true;
  }

  // -----------------------------------------------------------------------
  // Zone Management
  // -----------------------------------------------------------------------

  async listZones(): Promise<CloudflareDomain[]> {
    const res = await this.cfFetch('/zones?per_page=50');
    if (!res.success) return [];

    return res.result.map((z: any) => ({
      zoneId: z.id,
      domain: z.name,
      status: z.status,
    }));
  }

  private async findZoneForDomain(domain: string): Promise<string | null> {
    // Check configured zones first
    for (const zoneId of this.config.zoneIds) {
      try {
        const res = await this.cfFetch(`/zones/${zoneId}`);
        if (res.success && res.result.name === domain) {
          return zoneId;
        }
      } catch {
        // Skip invalid zone IDs
      }
    }

    // Search by domain name
    const res = await this.cfFetch(`/zones?name=${encodeURIComponent(domain)}`);
    if (res.success && res.result.length > 0) {
      return res.result[0].id;
    }

    return null;
  }

  // -----------------------------------------------------------------------
  // R2 Storage (Export Bundles, Artifacts)
  // -----------------------------------------------------------------------

  async uploadToR2(key: string, data: Buffer | string, contentType?: string): Promise<{ uploaded: boolean; error?: string }> {
    // Prefer the R2 Signer Worker (handles R2 bindings natively at the edge)
    if (this.config.r2SignerUrl) {
      return this.uploadViaWorker(key, data, contentType);
    }

    // Fallback: direct S3-compatible API (requires separate S3 credentials)
    try {
      const bucket = this.config.r2Bucket;
      const accountId = this.config.r2AccountId || this.config.accountId;
      const url = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': contentType || 'application/octet-stream',
        },
        body: typeof data === 'string' ? data : new Uint8Array(data),
      });

      if (res.ok) {
        logger.info({ key, bucket }, '[Cloudflare] R2 upload successful');
        return { uploaded: true };
      }

      return { uploaded: false, error: `R2 upload failed: ${res.status}` };
    } catch (err) {
      return { uploaded: false, error: err instanceof Error ? err.message : 'R2 error' };
    }
  }

  private async uploadViaWorker(key: string, data: Buffer | string, contentType?: string): Promise<{ uploaded: boolean; error?: string }> {
    try {
      const res = await fetch(`${this.config.r2SignerUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.r2SignerSecret}`,
          'Content-Type': contentType || 'application/octet-stream',
          'X-R2-Key': key,
        },
        body: typeof data === 'string' ? data : new Uint8Array(data),
      });

      const result = await res.json() as any;
      if (result.uploaded) {
        logger.info({ key, size: result.size }, '[Cloudflare] R2 upload via Worker successful');
        return { uploaded: true };
      }

      return { uploaded: false, error: result.error || 'Worker upload failed' };
    } catch (err) {
      logger.error({ err, key }, '[Cloudflare] R2 Worker upload failed, falling back to direct');
      return this.uploadToR2Direct(key, data, contentType);
    }
  }

  private async uploadToR2Direct(key: string, data: Buffer | string, contentType?: string): Promise<{ uploaded: boolean; error?: string }> {
    const bucket = this.config.r2Bucket;
    const accountId = this.config.r2AccountId || this.config.accountId;
    const url = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': contentType || 'application/octet-stream',
      },
      body: typeof data === 'string' ? data : new Uint8Array(data),
    });

    if (res.ok) return { uploaded: true };
    return { uploaded: false, error: `R2 direct upload failed: ${res.status}` };
  }

  async getR2SignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string | null> {
    // Use the R2 Signer Worker to generate HMAC-signed download URLs
    if (this.config.r2SignerUrl && this.config.r2SignerSecret) {
      try {
        const res = await fetch(`${this.config.r2SignerUrl}/sign`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.r2SignerSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key, expiresIn: expiresInSeconds }),
        });

        const result = await res.json() as any;
        if (result.url) {
          logger.info({ key, expiresAt: result.expiresAt }, '[Cloudflare] R2 signed URL generated via Worker');
          return result.url;
        }

        logger.warn({ key, error: result.error }, '[Cloudflare] Worker sign request failed');
      } catch (err) {
        logger.error({ err, key }, '[Cloudflare] R2 Signer Worker unreachable');
      }
    }

    // Fallback: return direct bucket URL (requires public access on bucket)
    const bucket = this.config.r2Bucket;
    const accountId = this.config.r2AccountId || this.config.accountId;
    if (!bucket || !accountId) {
      logger.warn('[Cloudflare] R2 bucket or account ID not configured');
      return null;
    }
    return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
  }

  async deleteFromR2(key: string): Promise<boolean> {
    if (this.config.r2SignerUrl && this.config.r2SignerSecret) {
      try {
        const res = await fetch(`${this.config.r2SignerUrl}/delete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.r2SignerSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key }),
        });
        const result = await res.json() as any;
        return !!result.deleted;
      } catch (err) {
        logger.error({ err, key }, '[Cloudflare] R2 Worker delete failed');
        return false;
      }
    }
    return false;
  }

  async listR2Objects(prefix?: string, limit?: number): Promise<{ key: string; size: number }[]> {
    if (this.config.r2SignerUrl && this.config.r2SignerSecret) {
      try {
        const res = await fetch(`${this.config.r2SignerUrl}/list`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.r2SignerSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prefix, limit }),
        });
        const result = await res.json() as any;
        return result.objects || [];
      } catch (err) {
        logger.error({ err, prefix }, '[Cloudflare] R2 Worker list failed');
        return [];
      }
    }
    return [];
  }

  // -----------------------------------------------------------------------
  // Worker health checks
  // -----------------------------------------------------------------------

  async checkWorkerHealth(): Promise<{ r2Signer: string; agentGateway: string }> {
    const check = async (url: string | undefined, name: string): Promise<string> => {
      if (!url) return 'not configured';
      try {
        const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) return 'healthy';
        return `unhealthy (${res.status})`;
      } catch {
        return 'unreachable';
      }
    };

    return {
      r2Signer: await check(this.config.r2SignerUrl, 'r2-signer'),
      agentGateway: await check(this.config.agentGatewayUrl, 'agent-gateway'),
    };
  }

  // -----------------------------------------------------------------------
  // Internal HTTP helper
  // -----------------------------------------------------------------------

  private async cfFetch(path: string, options?: RequestInit): Promise<any> {
    if (!this.config.apiToken) {
      throw new Error('Cloudflare API token not configured');
    }

    const url = `${CF_API_BASE}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    return res.json();
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const cloudflare = new CloudflareClient();
