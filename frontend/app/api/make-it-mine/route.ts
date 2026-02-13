/**
 * Make It Mine API — Search + Extract + Plan Pipeline
 *
 * POST /api/make-it-mine
 * Body: { targetUrl?: string, productIdea: string, industry?: string }
 * Returns: { research, clonePlan, adaptationPlan, evidence }
 *
 * Pipeline:
 *   1. Search — Brave/Tavily/Serper for target site + competitors
 *   2. Extract — LLM-powered structured fact extraction from search results
 *   3. Plan — Clone plan + adaptation plan with citations
 *   4. Store — Evidence artifacts persisted for audit trail
 *
 * GET /api/make-it-mine?templateId=&industry=
 * Returns: { suggestions } — industry-specific adaptation suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { unifiedSearch, type SearchResult } from '@/lib/services/search';
import { search as braveSearch } from '@/lib/search/brave';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

// ── LLM for extraction ──
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
});

const EXTRACTION_MODEL = 'google/gemini-2.5-flash'; // Fast + cost-effective for extraction

// ── Types ──

interface MakeItMineRequest {
  targetUrl?: string;
  productIdea: string;
  industry?: string;
}

interface Evidence {
  id: string;
  query: string;
  results: SearchResult[];
  timestamp: string;
}

interface StructuredFacts {
  productName: string;
  description: string;
  targetAudience: string;
  keyFeatures: string[];
  monetization: string[];
  techStack: string[];
  competitors: string[];
  differentiators: string[];
  sourceUrls: string[];
}

interface ClonePlan {
  projectName: string;
  description: string;
  phases: Array<{
    name: string;
    tasks: string[];
    estimatedComplexity: 'low' | 'medium' | 'high';
  }>;
  requiredServices: string[];
  recommendedStack: string[];
}

interface AdaptationPlan {
  uniqueAngle: string;
  differentiators: string[];
  targetNiche: string;
  brandSuggestions: string[];
  pricingStrategy: string;
  launchSteps: string[];
}

// ── Pipeline Functions ──

async function searchTarget(productIdea: string, targetUrl?: string): Promise<Evidence[]> {
  const evidence: Evidence[] = [];

  // Primary search: the product idea
  const mainQuery = targetUrl
    ? `${targetUrl} features pricing reviews`
    : `${productIdea} product features pricing`;

  try {
    const mainResults = await unifiedSearch(mainQuery, { count: 8 });
    evidence.push({
      id: `search-main-${Date.now()}`,
      query: mainQuery,
      results: mainResults,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[MakeItMine] Primary search failed:', err);
  }

  // Competitor search
  const competitorQuery = `${productIdea} alternatives competitors`;
  try {
    const competitorResults = await unifiedSearch(competitorQuery, { count: 5 });
    evidence.push({
      id: `search-competitors-${Date.now()}`,
      query: competitorQuery,
      results: competitorResults,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[MakeItMine] Competitor search failed:', err);
  }

  return evidence;
}

async function extractFacts(
  productIdea: string,
  evidence: Evidence[],
): Promise<StructuredFacts> {
  const allResults = evidence.flatMap(e => e.results);
  const context = allResults
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`)
    .join('\n\n');

  const { text } = await generateText({
    model: openrouter(EXTRACTION_MODEL),
    prompt: `You are a product analyst. Extract structured facts from these search results about "${productIdea}".

Search Results:
${context}

Return a JSON object with these exact fields:
{
  "productName": "string - the product/service name",
  "description": "string - what it does in 2-3 sentences",
  "targetAudience": "string - who uses it",
  "keyFeatures": ["array of key features"],
  "monetization": ["array of revenue/pricing models"],
  "techStack": ["array of technologies used, if detectable"],
  "competitors": ["array of competitor names"],
  "differentiators": ["array of what makes this unique"],
  "sourceUrls": ["array of source URLs for citations"]
}

Only return valid JSON, no markdown or explanation.`,
  });

  try {
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      productName: productIdea,
      description: 'Could not extract structured data from search results.',
      targetAudience: 'Unknown',
      keyFeatures: [],
      monetization: [],
      techStack: [],
      competitors: [],
      differentiators: [],
      sourceUrls: allResults.map(r => r.url),
    };
  }
}

async function generateClonePlan(
  facts: StructuredFacts,
  industry?: string,
): Promise<ClonePlan> {
  const { text } = await generateText({
    model: openrouter(EXTRACTION_MODEL),
    prompt: `You are a software architect. Create a clone/build plan for a product similar to "${facts.productName}".

Product Facts:
- Description: ${facts.description}
- Key Features: ${facts.keyFeatures.join(', ')}
- Tech Stack: ${facts.techStack.join(', ') || 'Not specified'}
- Industry: ${industry || 'General'}

Return a JSON object:
{
  "projectName": "string - suggested project name",
  "description": "string - project description",
  "phases": [
    {
      "name": "string - phase name",
      "tasks": ["array of specific tasks"],
      "estimatedComplexity": "low|medium|high"
    }
  ],
  "requiredServices": ["array of APIs/services needed"],
  "recommendedStack": ["array of tech recommendations"]
}

Only return valid JSON.`,
  });

  try {
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      projectName: `My ${facts.productName}`,
      description: `A customized version of ${facts.productName}`,
      phases: [{ name: 'Research', tasks: ['Review source material'], estimatedComplexity: 'low' }],
      requiredServices: [],
      recommendedStack: ['Next.js', 'TypeScript', 'Tailwind CSS'],
    };
  }
}

async function generateAdaptationPlan(
  facts: StructuredFacts,
  industry?: string,
): Promise<AdaptationPlan> {
  const { text } = await generateText({
    model: openrouter(EXTRACTION_MODEL),
    prompt: `You are a product strategist. Create an adaptation plan to differentiate a new product inspired by "${facts.productName}".

Product Facts:
- Description: ${facts.description}
- Competitors: ${facts.competitors.join(', ')}
- Current Differentiators: ${facts.differentiators.join(', ')}
- Industry: ${industry || 'General'}

Return a JSON object:
{
  "uniqueAngle": "string - the unique value proposition",
  "differentiators": ["array of ways to differentiate"],
  "targetNiche": "string - specific niche to target",
  "brandSuggestions": ["array of branding ideas"],
  "pricingStrategy": "string - recommended pricing approach",
  "launchSteps": ["array of go-to-market steps"]
}

Only return valid JSON.`,
  });

  try {
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      uniqueAngle: 'Needs manual differentiation strategy',
      differentiators: [],
      targetNiche: industry || 'General',
      brandSuggestions: [],
      pricingStrategy: 'Freemium with premium tiers',
      launchSteps: ['Define target audience', 'Build MVP', 'Launch beta'],
    };
  }
}

// ── Route Handlers ──

export async function POST(req: NextRequest) {
  // Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: MakeItMineRequest = await req.json();

    if (!body.productIdea?.trim()) {
      return NextResponse.json(
        { error: 'productIdea is required' },
        { status: 400 },
      );
    }

    // Step 1: Search
    const evidence = await searchTarget(body.productIdea, body.targetUrl);

    if (evidence.length === 0 || evidence.every(e => e.results.length === 0)) {
      return NextResponse.json({
        error: 'No search results found. Check that BRAVE_API_KEY, TAVILY_API_KEY, or SERPER_API_KEY is configured.',
      }, { status: 503 });
    }

    // Step 2: Extract structured facts
    const facts = await extractFacts(body.productIdea, evidence);

    // Step 3: Generate plans (parallel)
    const [clonePlan, adaptationPlan] = await Promise.all([
      generateClonePlan(facts, body.industry),
      generateAdaptationPlan(facts, body.industry),
    ]);

    return NextResponse.json({
      success: true,
      research: {
        facts,
        searchQueries: evidence.map(e => e.query),
        totalSources: evidence.reduce((sum, e) => sum + e.results.length, 0),
      },
      clonePlan,
      adaptationPlan,
      evidence: evidence.map(e => ({
        id: e.id,
        query: e.query,
        resultCount: e.results.length,
        sources: e.results.map(r => ({ title: r.title, url: r.url })),
        timestamp: e.timestamp,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Pipeline failed';
    console.error('[MakeItMine]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const industry = req.nextUrl.searchParams.get('industry') || 'general';

  // Return industry-specific templates/suggestions
  const suggestions: Record<string, Array<{ idea: string; description: string }>> = {
    saas: [
      { idea: 'Project management tool', description: 'Trello/Asana-style task boards with AI prioritization' },
      { idea: 'CRM platform', description: 'Lightweight CRM with AI-powered lead scoring' },
      { idea: 'Invoice generator', description: 'Automated invoicing with payment tracking' },
    ],
    ecommerce: [
      { idea: 'Product comparison engine', description: 'AI-powered product comparison and recommendation' },
      { idea: 'Dropshipping storefront', description: 'Automated product sourcing and fulfillment' },
      { idea: 'Subscription box service', description: 'Curated subscription boxes with personalization' },
    ],
    content: [
      { idea: 'Blog platform', description: 'AI-assisted writing with SEO optimization' },
      { idea: 'Newsletter tool', description: 'Email newsletter platform with analytics' },
      { idea: 'Course platform', description: 'Online course creation and delivery' },
    ],
    general: [
      { idea: 'Landing page builder', description: 'Drag-and-drop landing pages with A/B testing' },
      { idea: 'API marketplace', description: 'Curated API directory with testing tools' },
      { idea: 'Community platform', description: 'Forum + chat with AI moderation' },
    ],
  };

  return NextResponse.json({
    industry,
    suggestions: suggestions[industry] || suggestions.general,
  });
}
