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
    try {
      const bucket = this.config.r2Bucket;
      const accountId = this.config.r2AccountId || this.config.accountId;

      // R2 uses the S3-compatible API endpoint
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

  async getR2SignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string | null> {
    // For production, use Cloudflare Workers with R2 bindings for signed URLs
    // This is a placeholder that returns the public URL if the bucket is public
    const bucket = this.config.r2Bucket;
    const accountId = this.config.r2AccountId || this.config.accountId;
    return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
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
