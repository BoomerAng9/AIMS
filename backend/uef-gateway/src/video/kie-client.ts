/**
 * KIE.ai Unified Video Generation Client
 *
 * All video generation in AIMS routes through KIE.ai's API, which
 * aggregates 17+ models across 7 providers (Seedance, Kling, Veo,
 * Sora, Runway, Wan, Grok).
 *
 * API: POST https://api.kie.ai/api/v1/jobs/createTask
 * Auth: Bearer token from KIE_API_KEY
 * Docs: https://docs.kie.ai
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type KieModel =
  // ByteDance Seedance
  | 'seedance-2.0'
  | 'seedance-1.5-pro'
  | 'seedance-1.0'
  // Kuaishou Kling
  | 'kling-3.0'
  | 'kling-2.6'
  | 'kling-2.5-turbo'
  | 'kling-2.1'
  | 'kling-o1'
  // Google Veo
  | 'veo-3.1-quality'
  | 'veo-3.1-fast'
  | 'veo-3-quality'
  | 'veo-3-fast'
  // OpenAI
  | 'sora-2'
  // Runway
  | 'gen-4-turbo'
  | 'aleph'
  // Alibaba Wan
  | 'wan-2.6'
  | 'wan-2.5'
  | 'wan-2.2-a14b'
  // xAI
  | 'grok-imagine-v0.9';

export interface KieVideoRequest {
  /** The model to use */
  model: KieModel;
  /** Text prompt describing the video */
  prompt: string;
  /** Duration in seconds */
  duration?: number;
  /** Aspect ratio */
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  /** Resolution */
  resolution?: '720p' | '1080p' | '2k' | '4k';
  /** Reference image URL (for image-to-video) */
  referenceImageUrl?: string;
  /** Reference video URL (for video-to-video / motion transfer) */
  referenceVideoUrl?: string;
  /** Audio generation (Seedance 2.0) */
  audioGeneration?: boolean;
  /** Camera motion path */
  cameraPath?: 'tracking' | 'static' | 'orbit' | 'crane' | 'dolly' | 'handheld';
  /** Callback URL for async results */
  callbackUrl?: string;
  /** Negative prompt */
  negativePrompt?: string;
  /** Seed for reproducibility */
  seed?: number;
}

export interface KieVideoResponse {
  /** KIE.ai task/job ID */
  taskId: string;
  /** Current status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Generated video URL (when completed) */
  videoUrl?: string;
  /** Cover image URL */
  coverImageUrl?: string;
  /** Estimated time remaining (seconds) */
  estimatedTime?: number;
  /** Error message if failed */
  error?: string;
  /** Credits consumed */
  creditsUsed?: number;
  /** Model that was used */
  model: string;
  /** True when response is a dev mock (no KIE_API_KEY configured) */
  _mock?: boolean;
}

export interface KieAccountInfo {
  credits: number;
  plan: string;
}

// ---------------------------------------------------------------------------
// Model Metadata
// ---------------------------------------------------------------------------

export interface ModelInfo {
  id: KieModel;
  provider: string;
  name: string;
  maxDuration: number;
  supportsAudio: boolean;
  supportsImageToVideo: boolean;
  supportsVideoToVideo: boolean;
  defaultResolution: string;
  creditCost: number; // approximate credits per 5s clip
  tier: 'standard' | 'pro' | 'premium';
}

export const KIE_MODELS: ModelInfo[] = [
  // ByteDance Seedance
  { id: 'seedance-2.0', provider: 'ByteDance', name: 'Seedance 2.0', maxDuration: 30, supportsAudio: true, supportsImageToVideo: true, supportsVideoToVideo: true, defaultResolution: '2k', creditCost: 200, tier: 'premium' },
  { id: 'seedance-1.5-pro', provider: 'ByteDance', name: 'Seedance 1.5 Pro', maxDuration: 20, supportsAudio: false, supportsImageToVideo: true, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 150, tier: 'pro' },
  { id: 'seedance-1.0', provider: 'ByteDance', name: 'Seedance 1.0', maxDuration: 10, supportsAudio: false, supportsImageToVideo: true, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 80, tier: 'standard' },

  // Kuaishou Kling
  { id: 'kling-3.0', provider: 'Kuaishou', name: 'Kling 3.0', maxDuration: 20, supportsAudio: false, supportsImageToVideo: true, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 180, tier: 'premium' },
  { id: 'kling-2.6', provider: 'Kuaishou', name: 'Kling 2.6 Motion', maxDuration: 10, supportsAudio: false, supportsImageToVideo: true, supportsVideoToVideo: true, defaultResolution: '1080p', creditCost: 120, tier: 'pro' },
  { id: 'kling-2.5-turbo', provider: 'Kuaishou', name: 'Kling 2.5 Turbo', maxDuration: 10, supportsAudio: false, supportsImageToVideo: true, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 60, tier: 'standard' },
  { id: 'kling-2.1', provider: 'Kuaishou', name: 'Kling 2.1', maxDuration: 10, supportsAudio: false, supportsImageToVideo: true, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 50, tier: 'standard' },
  { id: 'kling-o1', provider: 'Kuaishou', name: 'Kling O1', maxDuration: 10, supportsAudio: true, supportsImageToVideo: false, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 100, tier: 'pro' },

  // Google Veo
  { id: 'veo-3.1-quality', provider: 'Google', name: 'Veo 3.1 Quality', maxDuration: 10, supportsAudio: true, supportsImageToVideo: true, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 250, tier: 'premium' },
  { id: 'veo-3.1-fast', provider: 'Google', name: 'Veo 3.1 Fast', maxDuration: 10, supportsAudio: true, supportsImageToVideo: true, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 120, tier: 'pro' },
  { id: 'veo-3-quality', provider: 'Google', name: 'Veo 3 Quality', maxDuration: 8, supportsAudio: true, supportsImageToVideo: false, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 200, tier: 'premium' },
  { id: 'veo-3-fast', provider: 'Google', name: 'Veo 3 Fast', maxDuration: 8, supportsAudio: true, supportsImageToVideo: false, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 100, tier: 'pro' },

  // OpenAI
  { id: 'sora-2', provider: 'OpenAI', name: 'Sora 2', maxDuration: 20, supportsAudio: false, supportsImageToVideo: true, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 200, tier: 'premium' },

  // Runway
  { id: 'gen-4-turbo', provider: 'Runway', name: 'Gen-4 Turbo', maxDuration: 10, supportsAudio: false, supportsImageToVideo: true, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 150, tier: 'pro' },
  { id: 'aleph', provider: 'Runway', name: 'Aleph', maxDuration: 10, supportsAudio: false, supportsImageToVideo: true, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 120, tier: 'pro' },

  // Alibaba Wan
  { id: 'wan-2.6', provider: 'Alibaba', name: 'Wan 2.6', maxDuration: 10, supportsAudio: false, supportsImageToVideo: true, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 80, tier: 'standard' },
  { id: 'wan-2.5', provider: 'Alibaba', name: 'Wan 2.5', maxDuration: 10, supportsAudio: false, supportsImageToVideo: true, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 60, tier: 'standard' },
  { id: 'wan-2.2-a14b', provider: 'Alibaba', name: 'Wan 2.2 A14B', maxDuration: 8, supportsAudio: false, supportsImageToVideo: false, supportsVideoToVideo: false, defaultResolution: '720p', creditCost: 30, tier: 'standard' },

  // xAI
  { id: 'grok-imagine-v0.9', provider: 'xAI', name: 'Grok Imagine v0.9', maxDuration: 5, supportsAudio: false, supportsImageToVideo: false, supportsVideoToVideo: false, defaultResolution: '1080p', creditCost: 40, tier: 'standard' },
];

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const KIE_API_BASE = 'https://api.kie.ai/api/v1';

export class KieVideoClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.KIE_API_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // ── Video Generation ──────────────────────────────────────────

  async generateVideo(request: KieVideoRequest): Promise<KieVideoResponse> {
    if (!this.apiKey) {
      // DEV-ONLY: Without a KIE_API_KEY env var, video generation returns a mock
      // response so the rest of the pipeline can be tested end-to-end.
      // Set KIE_API_KEY in .env to enable real video generation via api.kie.ai
      logger.warn('[KIE] No KIE_API_KEY configured — returning mock response (set env var for real generation)');
      return {
        taskId: `mock_kie_${Date.now()}`,
        status: 'pending',
        estimatedTime: request.duration || 10,
        model: request.model,
        _mock: true,
      };
    }

    try {
      const payload: Record<string, any> = {
        model: request.model,
        prompt: request.prompt,
        duration: request.duration || 5,
        aspect_ratio: request.aspectRatio || '16:9',
      };

      if (request.resolution) payload.resolution = request.resolution;
      if (request.referenceImageUrl) payload.reference_image_url = request.referenceImageUrl;
      if (request.referenceVideoUrl) payload.reference_video_url = request.referenceVideoUrl;
      if (request.audioGeneration !== undefined) payload.audio_generation = request.audioGeneration;
      if (request.cameraPath) payload.camera_path = request.cameraPath;
      if (request.callbackUrl) payload.callback_url = request.callbackUrl;
      if (request.negativePrompt) payload.negative_prompt = request.negativePrompt;
      if (request.seed !== undefined) payload.seed = request.seed;

      logger.info({ model: request.model, prompt: request.prompt.slice(0, 100) }, '[KIE] Creating video task');

      const res = await this.kieFetch('/jobs/createTask', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.error) {
        return {
          taskId: '',
          status: 'failed',
          error: res.error || res.message || 'Task creation failed',
          model: request.model,
        };
      }

      const taskId = res.data?.task_id || res.task_id || res.id || '';

      logger.info({ taskId, model: request.model }, '[KIE] Video task created');

      return {
        taskId,
        status: 'pending',
        estimatedTime: res.data?.estimated_time || request.duration || 30,
        model: request.model,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'KIE API error';
      logger.error({ err, model: request.model }, '[KIE] Video generation failed');
      return { taskId: '', status: 'failed', error, model: request.model };
    }
  }

  // ── Task Status Polling ───────────────────────────────────────

  async getTaskStatus(taskId: string): Promise<KieVideoResponse> {
    if (taskId.startsWith('mock_')) {
      return {
        taskId,
        status: 'completed',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        coverImageUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
        model: 'mock',
      };
    }

    try {
      const res = await this.kieFetch(`/jobs/${taskId}`, { method: 'GET' });

      const status = this.mapStatus(res.data?.status || res.status);
      const videoUrl = res.data?.result?.video_url || res.data?.video_url;
      const coverImageUrl = res.data?.result?.cover_image_url || res.data?.cover_image_url;

      return {
        taskId,
        status,
        videoUrl,
        coverImageUrl,
        creditsUsed: res.data?.credits_used,
        model: res.data?.model || '',
        ...(status === 'failed' ? { error: res.data?.error || 'Generation failed' } : {}),
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Status check failed';
      return { taskId, status: 'failed', error, model: '' };
    }
  }

  // ── Account Info ──────────────────────────────────────────────

  async getAccountInfo(): Promise<KieAccountInfo | null> {
    try {
      const res = await this.kieFetch('/account', { method: 'GET' });
      return {
        credits: res.data?.credits || res.credits || 0,
        plan: res.data?.plan || res.plan || 'free',
      };
    } catch {
      return null;
    }
  }

  // ── Model Helpers ─────────────────────────────────────────────

  getAvailableModels(): ModelInfo[] {
    return KIE_MODELS;
  }

  getModel(id: KieModel): ModelInfo | undefined {
    return KIE_MODELS.find(m => m.id === id);
  }

  getModelsByProvider(provider: string): ModelInfo[] {
    return KIE_MODELS.filter(m => m.provider.toLowerCase() === provider.toLowerCase());
  }

  getModelsByTier(tier: 'standard' | 'pro' | 'premium'): ModelInfo[] {
    return KIE_MODELS.filter(m => m.tier === tier);
  }

  /**
   * Auto-select the best model based on requirements.
   * Prioritizes: audio needs → video-to-video → quality → cost
   */
  recommendModel(opts: {
    needsAudio?: boolean;
    needsVideoToVideo?: boolean;
    maxBudgetCredits?: number;
    preferredProvider?: string;
    duration?: number;
  }): ModelInfo {
    let candidates = [...KIE_MODELS];

    if (opts.needsAudio) {
      candidates = candidates.filter(m => m.supportsAudio);
    }
    if (opts.needsVideoToVideo) {
      candidates = candidates.filter(m => m.supportsVideoToVideo);
    }
    if (opts.maxBudgetCredits) {
      candidates = candidates.filter(m => m.creditCost <= opts.maxBudgetCredits!);
    }
    if (opts.preferredProvider) {
      const preferred = candidates.filter(
        m => m.provider.toLowerCase() === opts.preferredProvider!.toLowerCase()
      );
      if (preferred.length > 0) candidates = preferred;
    }
    if (opts.duration) {
      candidates = candidates.filter(m => m.maxDuration >= opts.duration!);
    }

    // Sort by tier (premium > pro > standard), then by cost (lower is better for tie-breaking)
    const tierOrder = { premium: 0, pro: 1, standard: 2 };
    candidates.sort((a, b) => {
      const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
      if (tierDiff !== 0) return tierDiff;
      return a.creditCost - b.creditCost;
    });

    // Default to Seedance 2.0 if no candidates match
    return candidates[0] || KIE_MODELS[0];
  }

  // ── Internal ──────────────────────────────────────────────────

  private mapStatus(raw: string): KieVideoResponse['status'] {
    const lower = (raw || '').toLowerCase();
    if (['completed', 'success', 'succeed', 'done'].includes(lower)) return 'completed';
    if (['failed', 'error', 'cancelled'].includes(lower)) return 'failed';
    if (['processing', 'running', 'generating'].includes(lower)) return 'processing';
    return 'pending';
  }

  private async kieFetch(path: string, options?: RequestInit): Promise<any> {
    if (!this.apiKey) {
      throw new Error('KIE.ai API key not configured');
    }

    const url = `${KIE_API_BASE}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || body.error || `KIE API ${res.status}`);
    }

    return res.json();
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const kieVideo = new KieVideoClient();
