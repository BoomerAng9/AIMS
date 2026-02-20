/**
 * Per|Form Tiered Search Orchestrator
 *
 * Routes search queries to the appropriate intelligence tier:
 *   Tier 1 (Quick): Gemini 3.1 Flash — instant results, cached, high-traffic
 *   Tier 2 (Deep):  Gemini 3.1 Pro via OpenRouter — historical analysis, X-Factor
 *   Tier 3 (Crawl): Brave Search API — hyper-local clippings, community intel
 *
 * POST /api/perform/search
 *   body: { query, tier?: 1|2|3, context?: 'player'|'team'|'school'|'general' }
 *
 * The orchestrator automatically selects tier if not specified.
 */

import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '';

interface SearchRequest {
    query: string;
    tier?: 1 | 2 | 3;
    context?: 'player' | 'team' | 'school' | 'general' | 'state' | 'transfer';
    state?: string;
    position?: string;
}

interface TierResult {
    tier: number;
    model: string;
    latencyMs: number;
    results: any;
    cached: boolean;
    confidence: number;
}

// ── Tier Classification ─────────────────────────────────────
function classifyTier(query: string, context?: string): 1 | 2 | 3 {
    const q = query.toLowerCase();

    // Tier 3: hyper-local / state-level / submission-based
    if (
        context === 'state' ||
        q.includes('local') ||
        q.includes('county') ||
        q.includes('high school') ||
        q.includes('community') ||
        q.includes('0-star') ||
        q.includes('unranked') ||
        q.includes('maxpreps')
    ) {
        return 3;
    }

    // Tier 2: deep research / historical / comparison / X-Factor
    if (
        context === 'transfer' ||
        q.includes('historical') ||
        q.includes('compare') ||
        q.includes('redraft') ||
        q.includes('deep') ||
        q.includes('analysis') ||
        q.includes('x-factor') ||
        q.includes('career') ||
        q.includes('trend') ||
        q.includes('projection') ||
        q.length > 100  // complex queries
    ) {
        return 2;
    }

    // Tier 1: everything else — fast, cached, high-traffic
    return 1;
}

// ── Tier 1: Gemini Flash (Quick Search) ─────────────────────
async function tier1Search(query: string, context?: string): Promise<TierResult> {
    const start = Date.now();

    // Attempt Gemini Flash via Google AI
    if (GOOGLE_AI_KEY) {
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are a sports analytics assistant for the Per|Form platform. Context: ${context || 'general'}. Answer concisely and factually. Query: ${query}`
                            }]
                        }],
                        generationConfig: { maxOutputTokens: 512, temperature: 0.3 }
                    }),
                    signal: AbortSignal.timeout(5000),
                }
            );
            if (res.ok) {
                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No results found.';
                return {
                    tier: 1,
                    model: 'gemini-2.0-flash',
                    latencyMs: Date.now() - start,
                    results: { answer: text, sources: [] },
                    cached: false,
                    confidence: 0.85,
                };
            }
        } catch { /* fall through */ }
    }

    // Fallback: return a stub response
    return {
        tier: 1,
        model: 'stub-flash',
        latencyMs: Date.now() - start,
        results: { answer: `Quick search results for: "${query}". Configure GOOGLE_AI_API_KEY for live Gemini Flash responses.`, sources: [] },
        cached: false,
        confidence: 0.5,
    };
}

// ── Tier 2: Deep Research via OpenRouter ─────────────────────
async function tier2Search(query: string, context?: string): Promise<TierResult> {
    const start = Date.now();

    if (OPENROUTER_API_KEY) {
        try {
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'https://aims-perform.com',
                    'X-Title': 'Per|Form Deep Research',
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.5-pro-preview',
                    messages: [
                        {
                            role: 'system',
                            content: `You are the Per|Form AGI Deep Research engine. You perform detailed sports analytics, historical comparisons, and player evaluations. Context: ${context || 'general'}. Provide comprehensive analysis with data points.`
                        },
                        { role: 'user', content: query }
                    ],
                    max_tokens: 2048,
                    temperature: 0.4,
                }),
                signal: AbortSignal.timeout(30000),
            });

            if (res.ok) {
                const data = await res.json();
                const text = data.choices?.[0]?.message?.content || 'Deep research returned no results.';
                return {
                    tier: 2,
                    model: 'gemini-2.5-pro-preview (OpenRouter)',
                    latencyMs: Date.now() - start,
                    results: { answer: text, sources: [], depth: 'comprehensive' },
                    cached: false,
                    confidence: 0.92,
                };
            }
        } catch { /* fall through */ }
    }

    return {
        tier: 2,
        model: 'stub-deep-research',
        latencyMs: Date.now() - start,
        results: { answer: `Deep research for: "${query}". Configure OPENROUTER_API_KEY for live analysis.`, sources: [], depth: 'stub' },
        cached: false,
        confidence: 0.5,
    };
}

// ── Tier 3: Brave Targeted Crawl ────────────────────────────
async function tier3Search(query: string, context?: string, state?: string): Promise<TierResult> {
    const start = Date.now();
    const enrichedQuery = state
        ? `${query} ${state} high school football local news`
        : `${query} high school football recruiting local media`;

    if (BRAVE_API_KEY) {
        try {
            const params = new URLSearchParams({
                q: enrichedQuery,
                count: '10',
                freshness: 'py',  // past year
            });

            const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip',
                    'X-Subscription-Token': BRAVE_API_KEY,
                },
                signal: AbortSignal.timeout(8000),
            });

            if (res.ok) {
                const data = await res.json();
                const results = (data.web?.results || []).map((r: any) => ({
                    title: r.title,
                    url: r.url,
                    description: r.description,
                    age: r.age,
                }));

                return {
                    tier: 3,
                    model: 'brave-search-v1',
                    latencyMs: Date.now() - start,
                    results: { answer: `Found ${results.length} local sources for "${query}"`, sources: results, depth: 'hyper-local' },
                    cached: false,
                    confidence: 0.88,
                };
            }
        } catch { /* fall through */ }
    }

    return {
        tier: 3,
        model: 'stub-brave',
        latencyMs: Date.now() - start,
        results: { answer: `Targeted crawl for: "${query}". Configure BRAVE_API_KEY for hyper-local results.`, sources: [], depth: 'stub' },
        cached: false,
        confidence: 0.5,
    };
}

// ── Main Handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body: SearchRequest = await req.json();
        const { query, context, state, position } = body;

        if (!query || query.trim().length === 0) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const tier = body.tier || classifyTier(query, context);

        let result: TierResult;

        switch (tier) {
            case 3:
                result = await tier3Search(query, context, state);
                break;
            case 2:
                result = await tier2Search(query, context);
                break;
            default:
                result = await tier1Search(query, context);
        }

        return NextResponse.json({
            query,
            requestedTier: body.tier || null,
            resolvedTier: tier,
            context: context || 'general',
            ...result,
            meta: {
                timestamp: new Date().toISOString(),
                position: position || null,
                state: state || null,
            },
        });
    } catch (err) {
        console.error('[Search Orchestrator] Error:', err);
        return NextResponse.json(
            { error: 'Search orchestrator failed', details: String(err) },
            { status: 500 }
        );
    }
}
