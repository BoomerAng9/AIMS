/**
 * Personaplex Integration — Voice & Engagement Agent
 *
 * Nvidia Personaplex serves as the voice agent for engagement and comms.
 * Integrated into the same orchestration so the voice agent can see
 * LUC projects, runs, and status through the same backend.
 *
 * Capabilities:
 *   - Voice-to-text and text-to-voice through the A.I.M.S. pipeline
 *   - Access to shelves (LUC projects, runs, status)
 *   - Engagement flows (onboarding, status updates, cost summaries)
 *   - Real-time voice interaction during Chicken Hawk execution
 */

import logger from '../logger';
import type { LLMResult, ChatMessage } from './openrouter';

// ---------------------------------------------------------------------------
// Personaplex Configuration
// ---------------------------------------------------------------------------

const PERSONAPLEX_ENDPOINT = process.env.PERSONAPLEX_ENDPOINT || '';
const PERSONAPLEX_API_KEY = process.env.PERSONAPLEX_API_KEY || '';
const PERSONAPLEX_AVATAR_ID = process.env.PERSONAPLEX_AVATAR_ID || '';

export interface PersonaplexConfig {
  endpoint: string;
  apiKey: string;
  avatarId: string;
  voiceId?: string;
  language?: string;
}

export interface VoiceSession {
  sessionId: string;
  status: 'active' | 'paused' | 'ended';
  startedAt: string;
  avatarId: string;
}

// ---------------------------------------------------------------------------
// Personaplex Client
// ---------------------------------------------------------------------------

class PersonaplexClient {
  private config: PersonaplexConfig;

  constructor() {
    this.config = {
      endpoint: PERSONAPLEX_ENDPOINT,
      apiKey: PERSONAPLEX_API_KEY,
      avatarId: PERSONAPLEX_AVATAR_ID,
    };
  }

  isConfigured(): boolean {
    return this.config.endpoint.length > 0 && this.config.apiKey.length > 0;
  }

  /**
   * Send a text message through Personaplex for voice synthesis.
   * The avatar speaks the response to the user.
   */
  async speak(text: string, sessionId?: string): Promise<{ audioUrl?: string; duration?: number }> {
    if (!this.isConfigured()) {
      logger.warn('[Personaplex] Not configured — skipping voice output');
      return {};
    }

    try {
      const res = await fetch(`${this.config.endpoint}/api/v1/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          text,
          avatar_id: this.config.avatarId,
          session_id: sessionId,
          voice_id: this.config.voiceId,
          language: this.config.language || 'en',
        }),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => 'Unknown error');
        logger.error({ status: res.status, err }, '[Personaplex] Speak failed');
        return {};
      }

      const data = await res.json() as { audio_url?: string; duration_ms?: number };
      return {
        audioUrl: data.audio_url,
        duration: data.duration_ms,
      };
    } catch (err) {
      logger.error({ err }, '[Personaplex] Speak error');
      return {};
    }
  }

  /**
   * Start a real-time voice session with Personaplex avatar.
   */
  async startSession(): Promise<VoiceSession | null> {
    if (!this.isConfigured()) return null;

    try {
      const res = await fetch(`${this.config.endpoint}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          avatar_id: this.config.avatarId,
          capabilities: ['voice', 'text', 'status-query'],
        }),
      });

      if (!res.ok) return null;

      const data = await res.json() as { session_id: string; status: string };
      return {
        sessionId: data.session_id,
        status: 'active',
        startedAt: new Date().toISOString(),
        avatarId: this.config.avatarId,
      };
    } catch (err) {
      logger.error({ err }, '[Personaplex] Start session error');
      return null;
    }
  }

  /**
   * End a voice session.
   */
  async endSession(sessionId: string): Promise<void> {
    if (!this.isConfigured()) return;

    try {
      await fetch(`${this.config.endpoint}/api/v1/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
      });
    } catch (err) {
      logger.error({ err, sessionId }, '[Personaplex] End session error');
    }
  }

  /**
   * Use Personaplex as an LLM for conversational engagement.
   * Falls back to text-only if voice is not available.
   */
  async chat(messages: ChatMessage[], opts?: { maxTokens?: number; temperature?: number }): Promise<LLMResult> {
    if (!this.isConfigured()) {
      return {
        content: '[Personaplex not configured]',
        model: 'personaplex-voice',
        tokens: { prompt: 0, completion: 0, total: 0 },
        cost: { usd: 0 },
      };
    }

    try {
      const res = await fetch(`${this.config.endpoint}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          avatar_id: this.config.avatarId,
          max_tokens: opts?.maxTokens || 2048,
          temperature: opts?.temperature ?? 0.8,
        }),
      });

      if (!res.ok) {
        throw new Error(`Personaplex chat error: ${res.status}`);
      }

      const data = await res.json() as {
        content: string;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

      return {
        content: data.content || '',
        model: 'personaplex-voice',
        tokens: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        },
        cost: {
          usd: (usage.total_tokens / 1_000_000) * 1.0, // Personaplex pricing
        },
      };
    } catch (err) {
      logger.error({ err }, '[Personaplex] Chat error');
      throw err;
    }
  }

  /**
   * Deliver a status update via Personaplex voice.
   * Used when Chicken Hawk completes a run or LUC status changes.
   */
  async deliverStatusUpdate(update: {
    type: 'luc_estimate' | 'run_complete' | 'run_failed' | 'project_update';
    projectName: string;
    summary: string;
    sessionId?: string;
  }): Promise<void> {
    const messages: Record<string, string> = {
      luc_estimate: `Hey, I just finished estimating your project "${update.projectName}". ${update.summary}`,
      run_complete: `Good news — "${update.projectName}" just finished running. ${update.summary}`,
      run_failed: `Heads up — there was an issue with "${update.projectName}". ${update.summary}`,
      project_update: `Update on "${update.projectName}": ${update.summary}`,
    };

    const text = messages[update.type] || update.summary;
    await this.speak(text, update.sessionId);
  }
}

export const personaplex = new PersonaplexClient();
