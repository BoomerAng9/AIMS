/**
 * Composio Bridge — SDK wrapper for A.I.M.S. Composio integration
 *
 * This is the low-level bridge between A.I.M.S. agents and the Composio
 * platform (500+ integrations). Works alongside companion workflows:
 *
 *   Companion = scheduled / event-driven workflows (cron, webhooks, pipelines)
 *   Composio  = on-demand, LLM-directed cross-platform actions (real-time)
 *
 * Both are orchestrated by ACHEEVY through the UEF Gateway.
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComposioConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface ComposioTool {
  name: string;
  description: string;
  appName: string;
  parameters: Record<string, unknown>;
}

export interface ComposioActionResult {
  success: boolean;
  data: unknown;
  error?: string;
  executionTimeMs: number;
}

export interface ComposioConnection {
  id: string;
  appName: string;
  status: 'active' | 'expired' | 'pending';
  userId: string;
  createdAt: string;
}

export interface ComposioHealthStatus {
  healthy: boolean;
  latencyMs: number;
  connectedApps: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Composio Bridge Client
// ---------------------------------------------------------------------------

const COMPOSIO_BASE_URL = 'https://backend.composio.dev/api/v2';

export class ComposioBridge {
  private apiKey: string;
  private baseUrl: string;

  constructor(config?: Partial<ComposioConfig>) {
    this.apiKey = config?.apiKey || process.env.COMPOSIO_API_KEY || '';
    this.baseUrl = config?.baseUrl || COMPOSIO_BASE_URL;
  }

  get configured(): boolean {
    return this.apiKey.length > 0;
  }

  // ── Core API Fetch ──────────────────────────────────────────────

  private async apiFetch<T = unknown>(
    path: string,
    options: { method?: string; body?: unknown; timeout?: number } = {}
  ): Promise<{ ok: boolean; data: T | null; error?: string; status: number }> {
    if (!this.configured) {
      return {
        ok: false,
        data: null,
        error: 'Composio API key not configured (set COMPOSIO_API_KEY)',
        status: 503,
      };
    }

    const url = `${this.baseUrl}${path}`;
    const method = options.method || 'GET';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(options.timeout || 30000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText);
        return { ok: false, data: null, error: `Composio ${response.status}: ${errText}`, status: response.status };
      }

      const data = (await response.json()) as T;
      return { ok: true, data, status: response.status };
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return { ok: false, data: null, error: 'Composio request timed out', status: 504 };
      }
      return { ok: false, data: null, error: err.message || 'Composio connection failed', status: 502 };
    }
  }

  // ── Tool Discovery ──────────────────────────────────────────────

  /**
   * Get available tools for specific apps (e.g., ['github', 'slack', 'gmail'])
   */
  async getTools(apps: string[]): Promise<ComposioTool[]> {
    if (!this.configured) {
      logger.warn('[ComposioBridge] Not configured — returning empty tool list');
      return [];
    }

    const result = await this.apiFetch<{ items: ComposioTool[] }>(
      `/actions?apps=${apps.join(',')}&limit=50`
    );

    if (!result.ok || !result.data) {
      logger.warn({ error: result.error, apps }, '[ComposioBridge] Failed to fetch tools');
      return [];
    }

    return result.data.items || [];
  }

  // ── Action Execution ────────────────────────────────────────────

  /**
   * Execute a Composio action (e.g., 'github_create_issue', 'slack_send_message')
   */
  async executeAction(
    actionName: string,
    params: Record<string, unknown>,
    connectedAccountId?: string
  ): Promise<ComposioActionResult> {
    const start = Date.now();

    logger.info({ actionName, params: Object.keys(params) }, '[ComposioBridge] Executing action');

    const body: Record<string, unknown> = {
      input: params,
    };
    if (connectedAccountId) {
      body.connectedAccountId = connectedAccountId;
    }

    const result = await this.apiFetch(`/actions/${actionName}/execute`, {
      method: 'POST',
      body,
      timeout: 60000,
    });

    const executionTimeMs = Date.now() - start;

    if (!result.ok) {
      logger.error({ actionName, error: result.error, executionTimeMs }, '[ComposioBridge] Action failed');
      return { success: false, data: null, error: result.error, executionTimeMs };
    }

    logger.info({ actionName, executionTimeMs }, '[ComposioBridge] Action completed');
    return { success: true, data: result.data, executionTimeMs };
  }

  // ── Connection Management ───────────────────────────────────────

  /**
   * List connected accounts for a user
   */
  async getConnections(userId?: string): Promise<ComposioConnection[]> {
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    const result = await this.apiFetch<{ items: ComposioConnection[] }>(
      `/connectedAccounts${query}`
    );
    return result.data?.items || [];
  }

  /**
   * Initiate OAuth connection for a user
   */
  async initiateConnection(
    appName: string,
    userId: string,
    redirectUrl?: string
  ): Promise<{ redirectUrl: string; connectionId: string } | null> {
    const result = await this.apiFetch<{ redirectUrl: string; id: string }>(
      '/connectedAccounts',
      {
        method: 'POST',
        body: {
          integrationId: appName,
          userId,
          redirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_URL || 'https://plugmein.cloud'}/dashboard/circuit-box?connected=${appName}`,
        },
      }
    );

    if (!result.ok || !result.data) return null;
    return { redirectUrl: result.data.redirectUrl, connectionId: result.data.id };
  }

  // ── Health Check ────────────────────────────────────────────────

  async healthCheck(): Promise<ComposioHealthStatus> {
    const start = Date.now();

    if (!this.configured) {
      return { healthy: false, latencyMs: 0, connectedApps: 0, error: 'API key not configured' };
    }

    try {
      const connections = await this.getConnections();
      return {
        healthy: true,
        latencyMs: Date.now() - start,
        connectedApps: connections.length,
      };
    } catch (err: any) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        connectedApps: 0,
        error: err.message,
      };
    }
  }

  // ── Pipeline Interop ────────────────────────────────────────────

  /**
   * Generate a webhook-compatible payload from a Composio action result.
   * This allows Composio actions to feed into workflow pipelines seamlessly.
   */
  formatForPipeline(actionName: string, result: ComposioActionResult): Record<string, unknown> {
    return {
      source: 'composio',
      action: actionName,
      success: result.success,
      data: result.data,
      executionTimeMs: result.executionTimeMs,
      timestamp: new Date().toISOString(),
    };
  }
}

// Singleton instance
export const composioBridge = new ComposioBridge();
