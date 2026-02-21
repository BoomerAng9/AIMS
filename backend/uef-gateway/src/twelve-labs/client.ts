/**
 * Twelve Labs Video Intelligence API Client
 *
 * Wraps the Twelve Labs REST API for:
 *  - Video indexing (Marengo embeddings)
 *  - Semantic search over indexed video
 *  - Video-to-text generation (Pegasus)
 *
 * Used by Per|Form Film Room for game film analysis, scouting reports,
 * and the ScoutVerify pipeline.
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TwelveLabsConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface VideoIndex {
  id: string;
  name: string;
  engineId: string;
  videoCount: number;
  createdAt: string;
}

export interface VideoTask {
  id: string;
  indexId: string;
  videoId?: string;
  status: 'pending' | 'indexing' | 'ready' | 'failed';
  metadata?: Record<string, string>;
}

export interface SearchResult {
  id: string;
  videoId: string;
  start: number;
  end: number;
  score: number;
  metadata?: Record<string, unknown>;
  thumbnailUrl?: string;
}

export interface SearchResponse {
  data: SearchResult[];
  pageInfo: { totalResults: number; page: number; limit: number };
}

export interface GenerateResponse {
  id: string;
  text: string;
}

export interface VideoSummary {
  id: string;
  summary: string;
  chapters?: Array<{ title: string; start: number; end: number; summary: string }>;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'https://api.twelvelabs.io/v1.3';

export class TwelveLabsClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: TwelveLabsConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  }

  private async request<T>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };

    const opts: RequestInit = { method, headers };
    if (body && method !== 'GET') {
      opts.body = JSON.stringify(body);
    }

    logger.debug({ url, method }, '[TwelveLabs] API request');

    const res = await fetch(url, opts);
    if (!res.ok) {
      const errorBody = await res.text();
      logger.error({ status: res.status, errorBody, url }, '[TwelveLabs] API error');
      throw new Error(`Twelve Labs API error ${res.status}: ${errorBody}`);
    }

    return res.json() as Promise<T>;
  }

  // -- Indexes ---------------------------------------------------------------

  async createIndex(name: string, engines?: Array<{ name: string; options: string[] }>): Promise<VideoIndex> {
    const payload = {
      index_name: name,
      engines: engines || [
        { name: 'marengo2.7', options: ['visual', 'audio'] },
        { name: 'pegasus1.2', options: ['visual', 'audio'] },
      ],
    };
    return this.request<VideoIndex>('/indexes', 'POST', payload);
  }

  async getIndex(indexId: string): Promise<VideoIndex> {
    return this.request<VideoIndex>(`/indexes/${indexId}`);
  }

  async listIndexes(page = 1, pageLimit = 10): Promise<{ data: VideoIndex[] }> {
    return this.request<{ data: VideoIndex[] }>(`/indexes?page=${page}&page_limit=${pageLimit}`);
  }

  // -- Video Tasks -----------------------------------------------------------

  async indexVideoByUrl(indexId: string, videoUrl: string, metadata?: Record<string, string>): Promise<VideoTask> {
    const payload: Record<string, unknown> = {
      index_id: indexId,
      url: videoUrl,
    };
    if (metadata) payload.metadata = metadata;
    return this.request<VideoTask>('/tasks', 'POST', payload);
  }

  async getTask(taskId: string): Promise<VideoTask> {
    return this.request<VideoTask>(`/tasks/${taskId}`);
  }

  async waitForTask(taskId: string, timeoutMs = 600_000, pollMs = 5_000): Promise<VideoTask> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const task = await this.getTask(taskId);
      if (task.status === 'ready' || task.status === 'failed') return task;
      await new Promise(resolve => setTimeout(resolve, pollMs));
    }
    throw new Error(`Task ${taskId} did not complete within ${timeoutMs}ms`);
  }

  // -- Search ----------------------------------------------------------------

  async search(
    indexId: string,
    queryText: string,
    options?: { searchOptions?: string[]; threshold?: string; limit?: number; page?: number }
  ): Promise<SearchResponse> {
    const payload: Record<string, unknown> = {
      index_id: indexId,
      query_text: queryText,
      search_options: options?.searchOptions || ['visual', 'audio'],
    };
    if (options?.threshold) payload.threshold = options.threshold;
    if (options?.limit) payload.page_limit = options.limit;
    if (options?.page) payload.page = options.page;
    return this.request<SearchResponse>('/search', 'POST', payload);
  }

  // -- Generate (Pegasus) ----------------------------------------------------

  async summarize(
    videoId: string,
    type: 'summary' | 'chapter' | 'highlight' = 'summary',
    prompt?: string
  ): Promise<VideoSummary> {
    const payload: Record<string, unknown> = {
      video_id: videoId,
      type,
    };
    if (prompt) payload.prompt = prompt;
    return this.request<VideoSummary>('/summarize', 'POST', payload);
  }

  async generate(
    videoId: string,
    prompt: string
  ): Promise<GenerateResponse> {
    const payload = {
      video_id: videoId,
      prompt,
    };
    return this.request<GenerateResponse>('/generate', 'POST', payload);
  }

  // -- Health ----------------------------------------------------------------

  async healthCheck(): Promise<boolean> {
    try {
      await this.listIndexes(1, 1);
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let clientInstance: TwelveLabsClient | null = null;

export function getTwelveLabsClient(): TwelveLabsClient | null {
  if (clientInstance) return clientInstance;

  const apiKey = process.env.TWELVELABS_API_KEY;
  if (!apiKey) {
    logger.warn('[TwelveLabs] No TWELVELABS_API_KEY set — client disabled');
    return null;
  }

  clientInstance = new TwelveLabsClient({ apiKey });
  logger.info('[TwelveLabs] Client initialized');
  return clientInstance;
}
