// frontend/lib/n8n/client.ts

/**
 * n8n Workflow Client - Real VPS Integration
 *
 * Connects to the n8n VPS (separate from AIMS VPS) for workflow execution.
 * Supports webhook triggers, workflow execution, and status polling.
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  nodes?: N8nNode[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters?: Record<string, unknown>;
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  finished: boolean;
  mode: 'manual' | 'trigger' | 'webhook';
  startedAt: string;
  stoppedAt?: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  data?: {
    resultData?: {
      runData?: Record<string, unknown>;
      error?: { message: string };
    };
  };
}

export interface WebhookTriggerResponse {
  success: boolean;
  executionId?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface WorkflowListResponse {
  data: N8nWorkflow[];
  nextCursor?: string;
}

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

// n8n VPS URL - separate from AIMS VPS
const getN8nUrl = () => {
  // Use the configured n8n VPS URL
  return process.env.N8N_VPS_URL || process.env.N8N_URL || "https://n8n.plugmein.cloud";
};

const getN8nApiKey = () => {
  return process.env.N8N_API_KEY || "";
};

const getN8nWebhookBase = () => {
  return process.env.N8N_WEBHOOK_URL || `${getN8nUrl()}/webhook`;
};

// ─────────────────────────────────────────────────────────────
// n8n API Client
// ─────────────────────────────────────────────────────────────

export class N8nClient {
  private baseUrl: string;
  private apiKey: string;
  private webhookBase: string;

  constructor() {
    this.baseUrl = getN8nUrl();
    this.apiKey = getN8nApiKey();
    this.webhookBase = getN8nWebhookBase();
  }

  /**
   * List all workflows
   */
  async listWorkflows(): Promise<N8nWorkflow[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Failed to list workflows: ${response.status}`);
      }

      const data: WorkflowListResponse = await response.json();
      return data.data || [];
    } catch (error: any) {
      console.error("[n8n Client] List workflows error:", error);
      return [];
    }
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<N8nWorkflow | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error: any) {
      console.error("[n8n Client] Get workflow error:", error);
      return null;
    }
  }

  /**
   * Trigger a workflow via webhook
   */
  async triggerWebhook(
    webhookPath: string,
    payload: Record<string, unknown> = {}
  ): Promise<WebhookTriggerResponse> {
    try {
      const url = `${this.webhookBase}/${webhookPath}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Webhook failed: ${response.status} - ${error}` };
      }

      const data = await response.json();
      return {
        success: true,
        executionId: data.executionId,
        data,
      };
    } catch (error: any) {
      console.error("[n8n Client] Webhook trigger error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a workflow manually
   */
  async executeWorkflow(
    workflowId: string,
    data?: Record<string, unknown>
  ): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}/run`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ data }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Execution failed: ${response.status} - ${error}` };
      }

      const result = await response.json();
      return { success: true, executionId: result.data?.id };
    } catch (error: any) {
      console.error("[n8n Client] Execute workflow error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get execution status
   */
  async getExecution(executionId: string): Promise<N8nExecution | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/executions/${executionId}`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error: any) {
      console.error("[n8n Client] Get execution error:", error);
      return null;
    }
  }

  /**
   * Wait for execution to complete
   */
  async waitForExecution(
    executionId: string,
    maxWaitMs: number = 60000,
    pollIntervalMs: number = 2000
  ): Promise<N8nExecution | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const execution = await this.getExecution(executionId);

      if (!execution) {
        return null;
      }

      if (execution.finished) {
        return execution;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    // Timeout - return last known state
    return await this.getExecution(executionId);
  }

  /**
   * List recent executions
   */
  async listExecutions(limit: number = 20): Promise<N8nExecution[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/executions?limit=${limit}&includeData=false`,
        {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error: any) {
      console.error("[n8n Client] List executions error:", error);
      return [];
    }
  }

  /**
   * Activate/deactivate a workflow
   */
  async setWorkflowActive(workflowId: string, active: boolean): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify({ active }),
        signal: AbortSignal.timeout(10000),
      });

      return response.ok;
    } catch (error: any) {
      console.error("[n8n Client] Set workflow active error:", error);
      return false;
    }
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      ...(this.apiKey ? { "X-N8N-API-KEY": this.apiKey } : {}),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Pre-configured Workflow Webhooks for Deploy Dock
// ─────────────────────────────────────────────────────────────

export interface DeployDockWorkflows {
  hatch: string;
  assign: string;
  launch: string;
  verify: string;
  rollback: string;
}

export const DEPLOY_DOCK_WEBHOOKS: DeployDockWorkflows = {
  hatch: "deploy-dock/hatch",
  assign: "deploy-dock/assign",
  launch: "deploy-dock/launch",
  verify: "deploy-dock/verify",
  rollback: "deploy-dock/rollback",
};

/**
 * Trigger a Deploy Dock workflow stage
 */
export async function triggerDeployDockStage(
  stage: keyof DeployDockWorkflows,
  payload: {
    deploymentId: string;
    userId: string;
    sessionId?: string;
    agents?: string[];
    jobPacket?: Record<string, unknown>;
  }
): Promise<WebhookTriggerResponse> {
  const client = new N8nClient();
  const webhookPath = DEPLOY_DOCK_WEBHOOKS[stage];

  return client.triggerWebhook(webhookPath, {
    ...payload,
    stage,
    timestamp: new Date().toISOString(),
    source: "aims-deploy-dock",
  });
}

// ─────────────────────────────────────────────────────────────
// PMO Chain-of-Command Webhooks
// ─────────────────────────────────────────────────────────────

export const PMO_WEBHOOKS = {
  intake: "pmo/intake",
  routing: "pmo/routing",
  execution: "pmo/execution",
  verification: "pmo/verification",
  completion: "pmo/completion",
};

/**
 * Trigger a PMO chain-of-command workflow
 */
export async function triggerPmoWorkflow(
  stage: keyof typeof PMO_WEBHOOKS,
  payload: {
    taskId: string;
    userId: string;
    intent: string;
    department?: string;
    priority?: "low" | "medium" | "high" | "critical";
  }
): Promise<WebhookTriggerResponse> {
  const client = new N8nClient();
  const webhookPath = PMO_WEBHOOKS[stage];

  return client.triggerWebhook(webhookPath, {
    ...payload,
    stage,
    timestamp: new Date().toISOString(),
    source: "aims-pmo",
  });
}

// ─────────────────────────────────────────────────────────────
// Singleton Instance
// ─────────────────────────────────────────────────────────────

let n8nClientInstance: N8nClient | null = null;

export function getN8nClient(): N8nClient {
  if (!n8nClientInstance) {
    n8nClientInstance = new N8nClient();
  }
  return n8nClientInstance;
}
