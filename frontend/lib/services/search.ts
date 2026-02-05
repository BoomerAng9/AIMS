/**
 * Search Services - Brave, Tavily, Serper
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

export interface SearchOptions {
  count?: number;
  language?: string;
  safeSearch?: boolean;
}

/**
 * Brave Search Service
 */
export class BraveSearchService {
  private apiKey: string;
  private baseUrl = "https://api.search.brave.com/res/v1/web/search";

  constructor() {
    this.apiKey = process.env.BRAVE_SEARCH_API_KEY || "";
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { count = 10 } = options;

    const response = await fetch(
      `${this.baseUrl}?q=${encodeURIComponent(query)}&count=${count}`,
      {
        headers: {
          "X-Subscription-Token": this.apiKey,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Brave Search error: ${response.statusText}`);
    }

    const data = await response.json();
    return (
      data.web?.results?.map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
        source: "brave",
      })) || []
    );
  }
}

/**
 * Tavily Search Service
 */
export class TavilySearchService {
  private apiKey: string;
  private baseUrl = "https://api.tavily.com/search";

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || "";
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { count = 10 } = options;

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        max_results: count,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily Search error: ${response.statusText}`);
    }

    const data = await response.json();
    return (
      data.results?.map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        source: "tavily",
      })) || []
    );
  }
}

/**
 * Serper (Google) Search Service
 */
export class SerperSearchService {
  private apiKey: string;
  private baseUrl = "https://google.serper.dev/search";

  constructor() {
    this.apiKey = process.env.SERPER_API_KEY || "";
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { count = 10 } = options;

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "X-API-KEY": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: count,
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper Search error: ${response.statusText}`);
    }

    const data = await response.json();
    return (
      data.organic?.map((r: any) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
        source: "google",
      })) || []
    );
  }
}

// Export singleton instances
export const braveSearch = new BraveSearchService();
export const tavilySearch = new TavilySearchService();
export const serperSearch = new SerperSearchService();

/**
 * Unified search - tries multiple providers
 */
export async function unifiedSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    // Try Tavily first (usually fastest)
    return await tavilySearch.search(query, options);
  } catch (error) {
    console.warn("Tavily failed, trying Brave...", error);
    try {
      return await braveSearch.search(query, options);
    } catch (error2) {
      console.warn("Brave failed, trying Serper...", error2);
      return await serperSearch.search(query, options);
    }
  }
}
