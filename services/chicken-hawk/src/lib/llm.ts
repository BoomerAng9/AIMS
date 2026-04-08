// =============================================================================
// Chicken Hawk — LLM Client with Task-Type Routing
// Unified LLM interface with intelligent model selection.
//
// Routing table:
//   Standard build   → Claude Opus via OpenRouter → Gemini Flash fallback
//   Deep research    → Gemini Pro → Kimi K2.5 fallback
//   Departmental     → Kimi K2.5 → Gemini Flash fallback
//   Default          → Gemini Flash → OpenRouter fallback
//
// Reads API keys from Docker secrets (via secrets.ts) with env fallback.
// =============================================================================

import { secrets } from "./secrets";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  tokens: { prompt: number; completion: number; total: number };
  provider: "gemini" | "openrouter" | "stub";
}

export type TaskType = "build" | "research" | "departmental" | "default";

interface ModelRoute {
  primary: { provider: "gemini" | "openrouter"; model: string };
  fallback: { provider: "gemini" | "openrouter"; model: string };
}

const ROUTING_TABLE: Record<TaskType, ModelRoute> = {
  build: {
    primary: { provider: "openrouter", model: "anthropic/claude-opus-4-5" },
    fallback: { provider: "gemini", model: "gemini-3.0-flash-thinking" },
  },
  research: {
    primary: { provider: "gemini", model: "gemini-3.0-pro" },
    fallback: { provider: "openrouter", model: "moonshotai/kimi-k2.5" },
  },
  departmental: {
    primary: { provider: "openrouter", model: "moonshotai/kimi-k2.5" },
    fallback: { provider: "gemini", model: "gemini-3.0-flash-thinking" },
  },
  default: {
    primary: { provider: "gemini", model: process.env.GEMINI_MODEL || "gemini-3.0-flash" },
    fallback: { provider: "openrouter", model: "google/gemini-3.0-flash" },
  },
};

export class LLMClient {
  /**
   * Route a task type to the right model combo.
   */
  routeModel(taskType: TaskType): ModelRoute {
    return ROUTING_TABLE[taskType] || ROUTING_TABLE.default;
  }

  /**
   * Send a chat completion with automatic routing.
   */
  async chat(messages: LLMMessage[], opts?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    taskType?: TaskType;
  }): Promise<LLMResponse> {
    const route = opts?.taskType ? this.routeModel(opts.taskType) : ROUTING_TABLE.default;

    // Try primary provider
    try {
      if (opts?.model) {
        // Explicit model override — use whichever provider has a key
        if (secrets.geminiApiKey) return await this.callGemini(messages, { ...opts, model: opts.model });
        if (secrets.openrouterApiKey) return await this.callOpenRouter(messages, { ...opts, model: opts.model });
      }

      if (route.primary.provider === "gemini" && secrets.geminiApiKey) {
        return await this.callGemini(messages, { ...opts, model: route.primary.model });
      }
      if (route.primary.provider === "openrouter" && secrets.openrouterApiKey) {
        return await this.callOpenRouter(messages, { ...opts, model: route.primary.model });
      }
    } catch (err) {
      console.warn(`[llm] Primary (${route.primary.provider}/${route.primary.model}) failed:`, err);
    }

    // Try fallback
    try {
      if (route.fallback.provider === "gemini" && secrets.geminiApiKey) {
        return await this.callGemini(messages, { ...opts, model: route.fallback.model });
      }
      if (route.fallback.provider === "openrouter" && secrets.openrouterApiKey) {
        return await this.callOpenRouter(messages, { ...opts, model: route.fallback.model });
      }
    } catch (err) {
      console.warn(`[llm] Fallback (${route.fallback.provider}/${route.fallback.model}) failed:`, err);
    }

    // No provider available
    console.warn("[llm] No LLM provider configured (set GEMINI_API_KEY or OPENROUTER_API_KEY)");
    return {
      content: "[LLM unavailable — no API key configured]",
      model: "stub",
      tokens: { prompt: 0, completion: 0, total: 0 },
      provider: "stub",
    };
  }

  /**
   * Quick single prompt helper with optional task type routing.
   */
  async prompt(text: string, system?: string, taskType?: TaskType): Promise<string> {
    const messages: LLMMessage[] = [];
    if (system) messages.push({ role: "system", content: system });
    messages.push({ role: "user", content: text });
    const result = await this.chat(messages, { taskType });
    return result.content;
  }

  isConfigured(): boolean {
    return !!(secrets.geminiApiKey || secrets.openrouterApiKey);
  }

  getProvider(): string {
    const providers: string[] = [];
    if (secrets.geminiApiKey) providers.push("gemini");
    if (secrets.openrouterApiKey) providers.push("openrouter");
    return providers.length ? providers.join("+") : "none";
  }

  getRoutingTable(): Record<string, { primary: string; fallback: string }> {
    return Object.fromEntries(
      Object.entries(ROUTING_TABLE).map(([k, v]) => [
        k,
        { primary: `${v.primary.provider}/${v.primary.model}`, fallback: `${v.fallback.provider}/${v.fallback.model}` },
      ]),
    );
  }

  // ---------------------------------------------------------------------------
  // Google Gemini native API
  // ---------------------------------------------------------------------------
  private async callGemini(messages: LLMMessage[], opts?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<LLMResponse> {
    const model = opts?.model || "gemini-3.0-flash";

    const systemInstruction = messages.find((m) => m.role === "system")?.content;
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: opts?.maxTokens || 4096,
        temperature: opts?.temperature ?? 0.7,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${secrets.geminiApiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${text}`);
    }

    const data = await res.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
    };

    const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    const usage = data.usageMetadata;

    return {
      content,
      model,
      tokens: {
        prompt: usage?.promptTokenCount || 0,
        completion: usage?.candidatesTokenCount || 0,
        total: usage?.totalTokenCount || 0,
      },
      provider: "gemini",
    };
  }

  // ---------------------------------------------------------------------------
  // OpenRouter (Claude, Kimi K2.5, Gemini, etc.)
  // ---------------------------------------------------------------------------
  private async callOpenRouter(messages: LLMMessage[], opts?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<LLMResponse> {
    const model = opts?.model || "google/gemini-3.0-flash";

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secrets.openrouterApiKey}`,
        "HTTP-Referer": "https://aims.plugmein.cloud",
        "X-Title": "AIMS Chicken Hawk",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts?.maxTokens || 4096,
        temperature: opts?.temperature ?? 0.7,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${text}`);
    }

    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
      model: string;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    return {
      content: data.choices[0]?.message?.content || "",
      model: data.model || model,
      tokens: {
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0,
      },
      provider: "openrouter",
    };
  }
}

export const llm = new LLMClient();
