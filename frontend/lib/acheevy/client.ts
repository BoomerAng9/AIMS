// frontend/lib/acheevy/client.ts

/**
 * ACHEEVY Client - Real Backend Integration
 *
 * Connects to the ACHEEVY orchestrator (port 3003) and House of Ang (port 3002)
 * for real agent execution rather than mock responses.
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AcheevyMessage {
  role: "user" | "acheevy" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    boomerangs?: string[];
    lucDebit?: number;
    actionPlan?: ActionStep[];
  };
}

export interface ActionStep {
  step: number;
  action: string;
  agent?: string;
  status: "pending" | "running" | "complete" | "failed";
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  userId: string;
  context?: {
    deploymentId?: string;
    mode?: "recommend" | "explain" | "execute" | "prove";
    image?: string; // base64 for DIY mode
  };
}

export interface ChatResponse {
  sessionId: string;
  reply: string;
  intent?: {
    name: string;
    confidence: number;
    capabilities: string[];
  };
  boomerangsDispatched?: string[];
  lucDebit?: number;
  actionPlan?: ActionStep[];
  error?: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  endpoint?: string;
  status: "online" | "offline" | "busy";
}

export interface ExecuteRequest {
  intent: string;
  message: string;
  userId: string;
  sessionId?: string;
  capabilities?: string[];
}

export interface ExecuteResponse {
  requestId: string;
  status: "pending" | "running" | "complete" | "failed";
  reply?: string;
  data?: Record<string, unknown>;
  lucUsage?: {
    service: string;
    amount: number;
    cost: number;
  };
  taskId?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const getAcheevyUrl = () => {
  // In browser, use the API proxy
  if (typeof window !== "undefined") {
    return "/api/acheevy";
  }
  // Server-side, use direct backend URL
  return process.env.ACHEEVY_URL || "http://localhost:3003";
};

const getHouseOfAngUrl = () => {
  if (typeof window !== "undefined") {
    return "/api/house-of-ang";
  }
  return process.env.HOUSE_OF_ANG_URL || "http://localhost:3002";
};

const getUefGatewayUrl = () => {
  if (typeof window !== "undefined") {
    return "/api/uef";
  }
  return process.env.UEF_ENDPOINT || "http://localhost:3001";
};

// ─────────────────────────────────────────────────────────────
// ACHEEVY Chat Client
// ─────────────────────────────────────────────────────────────

export class AcheevyClient {
  private sessionId: string | null = null;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Send a chat message to ACHEEVY
   */
  async chat(message: string, context?: ChatRequest["context"]): Promise<ChatResponse> {
    try {
      const response = await fetch(`${getAcheevyUrl()}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          sessionId: this.sessionId,
          userId: this.userId,
          context,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ACHEEVY error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      // Update session ID
      if (data.sessionId) {
        this.sessionId = data.sessionId;
      }

      return data;
    } catch (error: any) {
      console.error("[AcheevyClient] Chat error:", error);
      return {
        sessionId: this.sessionId || "error",
        reply: "I apologize, but I'm having trouble connecting to my systems. Please try again.",
        error: error.message,
      };
    }
  }

  /**
   * Execute a specific intent via UEF Gateway
   */
  async execute(request: ExecuteRequest): Promise<ExecuteResponse> {
    try {
      const response = await fetch(`${getUefGatewayUrl()}/acheevy/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...request,
          sessionId: this.sessionId || request.sessionId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Execute error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("[AcheevyClient] Execute error:", error);
      return {
        requestId: "error",
        status: "failed",
        error: error.message,
      };
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(): Promise<AcheevyMessage[]> {
    if (!this.sessionId) {
      return [];
    }

    try {
      const response = await fetch(`${getAcheevyUrl()}/history/${this.sessionId}`);
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error("[AcheevyClient] History error:", error);
      return [];
    }
  }

  /**
   * DIY mode chat with optional image
   */
  async diyChat(message: string, projectId: string, image?: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${getAcheevyUrl()}/diy/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: message,
          projectId,
          image,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`DIY error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("[AcheevyClient] DIY error:", error);
      return {
        sessionId: projectId,
        reply: "Unable to process DIY request. Please try again.",
        error: error.message,
      };
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  setSessionId(id: string): void {
    this.sessionId = id;
  }
}

// ─────────────────────────────────────────────────────────────
// House of Ang Client
// ─────────────────────────────────────────────────────────────

export class HouseOfAngClient {
  /**
   * List all available BoomerAngs
   */
  async listAgents(): Promise<AgentInfo[]> {
    try {
      const response = await fetch(`${getHouseOfAngUrl()}/boomerangs`);
      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.status}`);
      }
      const data = await response.json();
      return data.boomerangs || data;
    } catch (error: any) {
      console.error("[HouseOfAng] List error:", error);
      return [];
    }
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<AgentInfo | null> {
    try {
      const response = await fetch(`${getHouseOfAngUrl()}/boomerangs/${agentId}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("[HouseOfAng] Get agent error:", error);
      return null;
    }
  }

  /**
   * Find agents by capability
   */
  async findByCapability(capability: string): Promise<AgentInfo[]> {
    try {
      const response = await fetch(`${getHouseOfAngUrl()}/capabilities/${capability}`);
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return data.boomerangs || [];
    } catch (error) {
      console.error("[HouseOfAng] Capability search error:", error);
      return [];
    }
  }

  /**
   * Route request to appropriate agent(s)
   */
  async route(capabilities: string[]): Promise<{ agents: AgentInfo[]; actionPlan: ActionStep[] }> {
    try {
      const response = await fetch(`${getHouseOfAngUrl()}/route`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ capabilities }),
      });

      if (!response.ok) {
        throw new Error(`Route error: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("[HouseOfAng] Route error:", error);
      return { agents: [], actionPlan: [] };
    }
  }

  /**
   * Invoke a specific agent
   */
  async invoke(agentId: string, payload: Record<string, unknown>): Promise<{
    success: boolean;
    result?: unknown;
    error?: string;
    duration?: number;
  }> {
    try {
      const response = await fetch(`${getHouseOfAngUrl()}/invoke/${agentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error: any) {
      console.error("[HouseOfAng] Invoke error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check health of all agents
   */
  async checkHealth(): Promise<Record<string, "online" | "offline" | "busy">> {
    try {
      const response = await fetch(`${getHouseOfAngUrl()}/health/all`);
      if (!response.ok) {
        return {};
      }
      const data = await response.json();
      return data.agents || {};
    } catch (error) {
      console.error("[HouseOfAng] Health check error:", error);
      return {};
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Singleton Instances
// ─────────────────────────────────────────────────────────────

let acheevyClientInstance: AcheevyClient | null = null;
let houseOfAngClientInstance: HouseOfAngClient | null = null;

export function getAcheevyClient(userId: string): AcheevyClient {
  if (!acheevyClientInstance || (acheevyClientInstance as any).userId !== userId) {
    acheevyClientInstance = new AcheevyClient(userId);
  }
  return acheevyClientInstance;
}

export function getHouseOfAngClient(): HouseOfAngClient {
  if (!houseOfAngClientInstance) {
    houseOfAngClientInstance = new HouseOfAngClient();
  }
  return houseOfAngClientInstance;
}

// ─────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────

/**
 * Analyze intent locally (fallback when backend unavailable)
 */
export function analyzeIntentLocal(message: string): {
  intent: string;
  confidence: number;
  capabilities: string[];
} {
  const lower = message.toLowerCase();

  const patterns: Array<{
    intent: string;
    keywords: string[];
    capabilities: string[];
  }> = [
    {
      intent: "deploy",
      keywords: ["deploy", "launch", "release", "ship", "publish"],
      capabilities: ["deploy", "container", "ci-cd"],
    },
    {
      intent: "build",
      keywords: ["build", "create", "make", "generate", "scaffold"],
      capabilities: ["code-gen", "build", "scaffold"],
    },
    {
      intent: "research",
      keywords: ["research", "find", "search", "look up", "investigate"],
      capabilities: ["research", "web-search", "analysis"],
    },
    {
      intent: "code",
      keywords: ["code", "program", "function", "implement", "fix bug"],
      capabilities: ["code-gen", "debug", "review"],
    },
    {
      intent: "test",
      keywords: ["test", "validate", "verify", "check", "qa"],
      capabilities: ["test", "audit", "validate"],
    },
    {
      intent: "automate",
      keywords: ["automate", "workflow", "n8n", "pipeline", "schedule"],
      capabilities: ["n8n", "automation", "workflow"],
    },
  ];

  for (const pattern of patterns) {
    const matchCount = pattern.keywords.filter((k) => lower.includes(k)).length;
    if (matchCount > 0) {
      return {
        intent: pattern.intent,
        confidence: Math.min(0.9, 0.5 + matchCount * 0.2),
        capabilities: pattern.capabilities,
      };
    }
  }

  return {
    intent: "general",
    confidence: 0.3,
    capabilities: ["conversation"],
  };
}
