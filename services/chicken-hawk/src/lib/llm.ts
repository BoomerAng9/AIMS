// =============================================================================
// Chicken Hawk — LLM Client
// Unified LLM interface defaulting to Google Gemini 3.
// Used by the execution engine for manifest planning, task decomposition,
// and intelligent error recovery.
//
// Priority chain: Gemini 3 → OpenRouter fallback
// =============================================================================

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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.0-flash";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-3.0-flash";

export class LLMClient {
  /**
   * Send a chat completion. Tries Gemini first, falls back to OpenRouter.
   */
  async chat(messages: LLMMessage[], opts?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<LLMResponse> {
    // Try Gemini native API first
    if (GEMINI_API_KEY) {
      try {
        return await this.callGemini(messages, opts);
      } catch (err) {
        console.warn("[llm] Gemini failed, falling back to OpenRouter:", err);
      }
    }

    // Fallback: OpenRouter (route to Gemini model there too)
    if (OPENROUTER_API_KEY) {
      return await this.callOpenRouter(messages, opts);
    }

    // No provider — return stub
    console.warn("[llm] No LLM provider configured (set GEMINI_API_KEY or OPENROUTER_API_KEY)");
    return {
      content: "[LLM unavailable — no API key configured]",
      model: "stub",
      tokens: { prompt: 0, completion: 0, total: 0 },
      provider: "stub",
    };
  }

  /**
   * Quick single prompt helper
   */
  async prompt(text: string, system?: string): Promise<string> {
    const messages: LLMMessage[] = [];
    if (system) messages.push({ role: "system", content: system });
    messages.push({ role: "user", content: text });
    const result = await this.chat(messages);
    return result.content;
  }

  isConfigured(): boolean {
    return !!(GEMINI_API_KEY || OPENROUTER_API_KEY);
  }

  getProvider(): string {
    if (GEMINI_API_KEY) return `gemini (${GEMINI_MODEL})`;
    if (OPENROUTER_API_KEY) return `openrouter (${OPENROUTER_MODEL})`;
    return "none";
  }

  // ---------------------------------------------------------------------------
  // Google Gemini native API (generativelanguage.googleapis.com)
  // ---------------------------------------------------------------------------
  private async callGemini(messages: LLMMessage[], opts?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<LLMResponse> {
    const model = opts?.model || GEMINI_MODEL;

    // Convert chat messages to Gemini format
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
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
  // OpenRouter fallback (defaults to Gemini model via OpenRouter)
  // ---------------------------------------------------------------------------
  private async callOpenRouter(messages: LLMMessage[], opts?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<LLMResponse> {
    const model = opts?.model || OPENROUTER_MODEL;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
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
