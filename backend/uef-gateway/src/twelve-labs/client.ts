/**
 * Twelve Labs Video Intelligence API Client
 *
 * Wraps the Twelve Labs REST API for:
 *  - Video indexing (Marengo 3.0 embeddings)
 *  - Semantic search over indexed video
 *  - Video-to-text generation (Pegasus)
 *
 * Used by Per|Form Film Room for game film analysis, scouting reports,
 * and the ScoutVerify pipeline.
 *
 * MIGRATION NOTE (March 2026): Updated from Marengo 2.7 → Marengo 3.0
 *  - Index engine: marengo2.7 → marengo3.0
 *  - Search response: score/confidence removed, rank added
 *  - Search request: adjust_confidence_level/sort_option removed
 *  - Audio search: now non-speech only. Use 'transcription' for spoken content
 *  - Embedding model: marengo-retrieval-2.7 → marengo3.0
 *  - Embedding options: visual-text → visual, audio → transcription (for speech)
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

/**
 * Marengo 3.0 Search Result
 *
 * Breaking changes from 2.7:
 *  - `score` removed
 *  - `confidence` removed
 *  - `rank` added (lower = more relevant, starts at 1)
 */
export interface SearchResult {
  id: string;
  videoId: string;
  start: number;
  end: number;
  rank: number;
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

/**
 * Marengo 3.0 transcription matching options.
 * Use with search_options: ['transcription'] to control spoken-content matching.
 *  - 'lexical'  — exact phrase matching
 *  - 'semantic' — meaning-based matching
 * Both can be used together.
 */
export type TranscriptionOption = 'lexical' | 'semantic';

export interface SearchOptions {
  /**
   * Marengo 3.0 search modalities:
   *  - 'visual'        — visual content search
   *  - 'audio'         — non-speech audio only (music, SFX, environmental sounds)
   *  - 'transcription' — spoken content (replaces old 'audio' for speech)
   */
  searchOptions?: string[];
  /** Control transcription matching behavior (only applies when 'transcription' is in searchOptions) */
  transcriptionOptions?: TranscriptionOption[];
  limit?: number;
  page?: number;
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
        { name: 'marengo3.0', options: ['visual', 'transcription'] },
        { name: 'pegasus1.2', options: ['visual', 'transcription'] },
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

  // -- Search (Marengo 3.0) --------------------------------------------------

  async search(
    indexId: string,
    queryText: string,
    options?: SearchOptions
  ): Promise<SearchResponse> {
    const payload: Record<string, unknown> = {
      index_id: indexId,
      query_text: queryText,
      search_options: options?.searchOptions || ['visual', 'transcription'],
    };
    if (options?.transcriptionOptions?.length) {
      payload.transcription_options = options.transcriptionOptions;
    }
    if (options?.limit) payload.page_limit = options.limit;
    if (options?.page) payload.page = options.page;
    // NOTE: Marengo 3.0 removed threshold, adjust_confidence_level, sort_option
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
  logger.info('[TwelveLabs] Client initialized (Marengo 3.0)');
  return clientInstance;
}
