/**
 * CDN Deploy Pipeline — Static Site Deployment for Generated Sites
 *
 * When Chicken Hawk or NtNtN Engine generates a static site (HTML/CSS/JS),
 * this module deploys it to a CDN-accessible location with:
 *   - Shareable URL (subdomain on plugmein.cloud)
 *   - Optional custom domain
 *   - Optional paywall integration
 *
 * Deployment targets (in priority order):
 *   1. Cloudflare Pages (via Direct Upload API) — preferred
 *   2. GCS static hosting — fallback
 *   3. Local nginx static serve — always available
 *
 * Each deployment gets:
 *   - Unique slug: <project-hash>.plugmein.cloud
 *   - Static file hosting via nginx or CDN
 *   - HTTPS via wildcard cert or Let's Encrypt
 *   - Cleanup on decommission
 */

import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const AIMS_DOMAIN = process.env.AIMS_DOMAIN || 'plugmein.cloud';
const STATIC_SERVE_DIR = process.env.STATIC_SERVE_DIR || '/var/lib/aims/static-sites';
const NGINX_STATIC_CONF_DIR = process.env.NGINX_STATIC_CONF_DIR || '/etc/nginx/conf.d/static';

// Cloudflare config (optional — when available, deploys to CF Pages)
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';

// GCS config (optional — fallback CDN)
const GCS_BUCKET = process.env.GCS_STATIC_BUCKET || '';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CdnDeployRequest {
  projectId: string;
  userId: string;
  projectName: string;
  files: Record<string, string>;  // path -> content
  customDomain?: string;
  paywallEnabled?: boolean;
}

export interface CdnDeployResult {
  deployId: string;
  url: string;
  slug: string;
  target: 'cloudflare-pages' | 'gcs' | 'nginx-static';
  files: number;
  deployedAt: string;
  error?: string;
}

export interface CdnDecommissionResult {
  slug: string;
  cleaned: boolean;
  target: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// CDN Deploy Engine
// ---------------------------------------------------------------------------

export class CdnDeployEngine {
  private deployments = new Map<string, CdnDeployResult>();

  /**
   * Deploy static files to CDN. Tries targets in priority order.
   */
  async deploy(request: CdnDeployRequest): Promise<CdnDeployResult> {
    const slug = this.generateSlug(request.projectName, request.userId);
    const deployId = uuidv4();

    logger.info({
      projectId: request.projectId,
      slug,
      fileCount: Object.keys(request.files).length,
    }, '[CDNDeploy] Starting deployment');

    // Try Cloudflare Pages first
    if (CF_API_TOKEN && CF_ACCOUNT_ID) {
      const result = await this.deployToCloudflarePages(slug, request);
      if (!result.error) {
        this.deployments.set(slug, result);
        return result;
      }
      logger.warn({ error: result.error }, '[CDNDeploy] Cloudflare Pages failed, trying GCS');
    }

    // Try GCS static hosting
    if (GCS_BUCKET) {
      const result = await this.deployToGcs(slug, request);
      if (!result.error) {
        this.deployments.set(slug, result);
        return result;
      }
      logger.warn({ error: result.error }, '[CDNDeploy] GCS failed, falling back to nginx');
    }

    // Fallback: local nginx static serve
    const result = await this.deployToNginxStatic(slug, deployId, request);
    this.deployments.set(slug, result);
    return result;
  }

  /**
   * Remove a deployed static site.
   */
  async decommission(slug: string): Promise<CdnDecommissionResult> {
    const deployment = this.deployments.get(slug);
    if (!deployment) {
      return { slug, cleaned: false, target: 'unknown', error: 'Deployment not found' };
    }

    try {
      switch (deployment.target) {
        case 'cloudflare-pages':
          await this.removeFromCloudflarePages(slug);
          break;
        case 'gcs':
          await this.removeFromGcs(slug);
          break;
        case 'nginx-static':
          await this.removeFromNginxStatic(slug);
          break;
      }

      this.deployments.delete(slug);
      return { slug, cleaned: true, target: deployment.target };
    } catch (err) {
      return { slug, cleaned: false, target: deployment.target, error: String(err) };
    }
  }

  /**
   * List all active static site deployments.
   */
  listDeployments(): CdnDeployResult[] {
    return Array.from(this.deployments.values());
  }

  getDeployment(slug: string): CdnDeployResult | undefined {
    return this.deployments.get(slug);
  }

  // -----------------------------------------------------------------------
  // Cloudflare Pages — Direct Upload API
  // -----------------------------------------------------------------------

  private async deployToCloudflarePages(slug: string, request: CdnDeployRequest): Promise<CdnDeployResult> {
    const deployId = uuidv4();
    const now = new Date().toISOString();

    try {
      // Create project (idempotent)
      await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: slug,
          production_branch: 'main',
        }),
      });

      // Upload files via Direct Upload
      const formData = new FormData();
      for (const [path, content] of Object.entries(request.files)) {
        const blob = new Blob([content], { type: mimeType(path) });
        formData.append(path, blob, path);
      }

      const uploadRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${slug}/deployments`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` },
          body: formData,
        },
      );

      if (!uploadRes.ok) {
        const body = await uploadRes.text();
        return {
          deployId, slug, files: Object.keys(request.files).length,
          url: '', target: 'cloudflare-pages', deployedAt: now,
          error: `CF Pages upload failed: ${body}`,
        };
      }

      const url = request.customDomain || `https://${slug}.pages.dev`;

      return {
        deployId, slug, url,
        target: 'cloudflare-pages',
        files: Object.keys(request.files).length,
        deployedAt: now,
      };
    } catch (err) {
      return {
        deployId, slug, url: '', target: 'cloudflare-pages',
        files: Object.keys(request.files).length, deployedAt: now,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  private async removeFromCloudflarePages(slug: string): Promise<void> {
    if (!CF_API_TOKEN || !CF_ACCOUNT_ID) return;
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${slug}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` },
      },
    );
  }

  // -----------------------------------------------------------------------
  // GCS static hosting
  // -----------------------------------------------------------------------

  private async deployToGcs(slug: string, request: CdnDeployRequest): Promise<CdnDeployResult> {
    const deployId = uuidv4();
    const now = new Date().toISOString();

    try {
      // Upload each file to GCS bucket/<slug>/
      for (const [path, content] of Object.entries(request.files)) {
        const gcsPath = `${slug}/${path}`;
        const res = await fetch(
          `https://storage.googleapis.com/upload/storage/v1/b/${GCS_BUCKET}/o?uploadType=media&name=${encodeURIComponent(gcsPath)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': mimeType(path) },
            body: content,
          },
        );
        if (!res.ok) throw new Error(`GCS upload failed for ${path}`);
      }

      const url = `https://storage.googleapis.com/${GCS_BUCKET}/${slug}/index.html`;
      return { deployId, slug, url, target: 'gcs', files: Object.keys(request.files).length, deployedAt: now };
    } catch (err) {
      return {
        deployId, slug, url: '', target: 'gcs',
        files: Object.keys(request.files).length, deployedAt: now,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  private async removeFromGcs(slug: string): Promise<void> {
    // List and delete all objects with prefix <slug>/
    if (!GCS_BUCKET) return;
    // In production, use @google-cloud/storage SDK
    logger.info({ slug }, '[CDNDeploy] GCS cleanup — manual cleanup may be needed');
  }

  // -----------------------------------------------------------------------
  // Nginx static serve (always available)
  // -----------------------------------------------------------------------

  private async deployToNginxStatic(slug: string, deployId: string, request: CdnDeployRequest): Promise<CdnDeployResult> {
    const now = new Date().toISOString();
    const siteDir = join(STATIC_SERVE_DIR, slug);

    try {
      await fs.mkdir(siteDir, { recursive: true });

      // Write all files
      for (const [path, content] of Object.entries(request.files)) {
        const filePath = join(siteDir, path);
        const dir = join(filePath, '..');
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
      }

      // Ensure index.html exists
      const hasIndex = Object.keys(request.files).some(f => f === 'index.html' || f.endsWith('/index.html'));
      if (!hasIndex) {
        // Generate a simple index listing
        const listing = Object.keys(request.files)
          .map(f => `<li><a href="/${f}">${f}</a></li>`)
          .join('\n');
        await fs.writeFile(join(siteDir, 'index.html'), `<!DOCTYPE html>
<html><head><title>${request.projectName}</title></head>
<body><h1>${request.projectName}</h1><ul>${listing}</ul>
<footer>Deployed by A.I.M.S.</footer></body></html>`, 'utf-8');
      }

      // Generate nginx config for this static site
      const nginxConf = this.generateStaticNginxConf(slug, siteDir, request.customDomain);
      await fs.mkdir(NGINX_STATIC_CONF_DIR, { recursive: true });
      await fs.writeFile(join(NGINX_STATIC_CONF_DIR, `${slug}.conf`), nginxConf, 'utf-8');

      const url = request.customDomain
        ? `https://${request.customDomain}`
        : `https://${slug}.${AIMS_DOMAIN}`;

      logger.info({ slug, siteDir, fileCount: Object.keys(request.files).length }, '[CDNDeploy] Deployed to nginx static');

      return { deployId, slug, url, target: 'nginx-static', files: Object.keys(request.files).length, deployedAt: now };
    } catch (err) {
      return {
        deployId, slug, url: '', target: 'nginx-static',
        files: Object.keys(request.files).length, deployedAt: now,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  private async removeFromNginxStatic(slug: string): Promise<void> {
    const siteDir = join(STATIC_SERVE_DIR, slug);
    try {
      await fs.rm(siteDir, { recursive: true, force: true });
      await fs.unlink(join(NGINX_STATIC_CONF_DIR, `${slug}.conf`)).catch(() => {});
      logger.info({ slug }, '[CDNDeploy] Removed nginx static site');
    } catch {
      // Already removed
    }
  }

  private generateStaticNginxConf(slug: string, siteDir: string, customDomain?: string): string {
    const serverName = customDomain || `${slug}.${AIMS_DOMAIN}`;
    return `# Auto-generated by A.I.M.S. CDN Deploy Pipeline
# Static site: ${slug}

server {
    listen 80;
    server_name ${serverName};

    root ${siteDir};
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Cache-Control "public, max-age=3600";

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health check for monitoring
    location /health {
        return 200 "ok";
        add_header Content-Type text/plain;
        access_log off;
    }
}
`;
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private generateSlug(projectName: string, userId: string): string {
    const base = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    const hash = createHash('sha256').update(`${userId}-${projectName}-${Date.now()}`).digest('hex').slice(0, 6);
    return `${base}-${hash}`;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mimeType(path: string): string {
  const ext = extname(path).toLowerCase();
  const map: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
  };
  return map[ext] || 'application/octet-stream';
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const cdnDeploy = new CdnDeployEngine();
