/**
 * Synthetic Persona Engine — "The Crowd"
 *
 * Generates 100-1,000 synthetic users with real demographics, biases,
 * and spending habits. They "use" the product/idea and provide raw,
 * unfiltered feedback. This is Six Sigma Measure/Analyze on steroids.
 *
 * Flow:
 *   1. PROFILE  — Generate diverse synthetic personas from target demo
 *   2. SIMULATE — Each persona "experiences" the product/idea
 *   3. REACT    — Each persona gives brutally honest feedback
 *   4. ANALYZE  — Aggregate sentiment, friction, willingness to pay
 *   5. REPORT   — Structured field report with statistical breakdown
 */

import { callLLM } from '../server.js';

// ─── Types ────────────────────────────────────────────────────────────────

export interface SyntheticPersona {
  id: string;
  name: string;
  age: number;
  gender: string;
  location: string;
  income: string;
  occupation: string;
  techSavviness: 'low' | 'medium' | 'high';
  spendingStyle: 'frugal' | 'balanced' | 'impulsive';
  personality: string;      // e.g., "skeptical early-adopter"
  painPoints: string[];
  biases: string[];          // e.g., "brand-loyal", "price-sensitive"
}

export interface PersonaReaction {
  personaId: string;
  firstImpression: string;
  wouldUse: boolean;
  wouldPay: boolean;
  maxPrice: number | null;
  frictionPoints: string[];
  delightPoints: string[];
  rawFeedback: string;       // Unfiltered voice-of-customer
  sentiment: 'negative' | 'neutral' | 'positive' | 'enthusiastic';
  npsScore: number;           // 0-10
}

export interface CrowdReport {
  reportId: string;
  productName: string;
  totalPersonas: number;
  completedAt: string;
  sentimentBreakdown: {
    negative: number;
    neutral: number;
    positive: number;
    enthusiastic: number;
  };
  avgNPS: number;
  wouldUsePercent: number;
  wouldPayPercent: number;
  avgMaxPrice: number | null;
  topFrictionPoints: Array<{ issue: string; frequency: number }>;
  topDelightPoints: Array<{ feature: string; frequency: number }>;
  personas: SyntheticPersona[];
  reactions: PersonaReaction[];
  executiveSummary: string;
  recommendations: string[];
}

// ─── Persona Generation ───────────────────────────────────────────────────

export async function generatePersonas(
  targetDemo: string,
  count: number,
): Promise<SyntheticPersona[]> {
  const batchSize = Math.min(count, 20); // LLM generates in batches of 20
  const batches = Math.ceil(count / batchSize);
  const personas: SyntheticPersona[] = [];

  for (let batch = 0; batch < batches; batch++) {
    const remaining = Math.min(batchSize, count - personas.length);
    const response = await callLLM(
      `You generate realistic synthetic user personas for market simulation. Output ONLY a JSON array. Each persona must feel real — not a caricature. Include genuine biases and contradictions that real people have. Vary income, age, location, and personality widely.`,
      `Generate ${remaining} synthetic personas for this target demographic:
"${targetDemo}"

Each persona needs:
- id: "SP-{batch number}-{index}" (e.g., "SP-${batch}-1")
- name: realistic full name (diverse backgrounds)
- age: number
- gender: string
- location: US city + state
- income: bracket (e.g., "$35K-$50K")
- occupation: specific job title
- techSavviness: "low" | "medium" | "high"
- spendingStyle: "frugal" | "balanced" | "impulsive"
- personality: 2-3 word personality type
- painPoints: 2-3 real problems this person has
- biases: 1-2 cognitive or purchasing biases

Make them DIVERSE. Don't default to tech-bro stereotypes. Include:
- Different income levels, ages 18-65+
- Rural and urban
- Different education levels
- At least 30% skeptics or non-adopters`,
    );

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as SyntheticPersona[];
        personas.push(...parsed);
      }
    } catch {
      console.warn(`[Crowd] Batch ${batch} persona generation parse failed`);
    }
  }

  return personas.slice(0, count);
}

// ─── Product Simulation ───────────────────────────────────────────────────

export async function simulateReactions(
  productDescription: string,
  personas: SyntheticPersona[],
): Promise<PersonaReaction[]> {
  const reactions: PersonaReaction[] = [];

  // Process in batches of 5 to avoid rate limits but keep speed
  const batchSize = 5;
  for (let i = 0; i < personas.length; i += batchSize) {
    const batch = personas.slice(i, i + batchSize);

    const batchPromises = batch.map(async (persona) => {
      const response = await callLLM(
        `You ARE this person. Respond AS them, not about them. Be brutally honest. Don't be nice just to be nice. If the product is wack, say it's wack. If it's fire, say it's fire. Stay in character.

YOUR IDENTITY:
- Name: ${persona.name}, ${persona.age}, ${persona.gender}
- Location: ${persona.location}
- Job: ${persona.occupation} | Income: ${persona.income}
- Tech level: ${persona.techSavviness} | Spending: ${persona.spendingStyle}
- Personality: ${persona.personality}
- Pain points: ${persona.painPoints.join(', ')}
- Biases: ${persona.biases.join(', ')}`,
        `Someone just pitched you this product/idea:

"${productDescription}"

React naturally. Output ONLY JSON:
{
  "firstImpression": "your gut reaction in 1-2 sentences, in YOUR voice",
  "wouldUse": true/false,
  "wouldPay": true/false,
  "maxPrice": number or null (monthly, what you'd actually pay),
  "frictionPoints": ["things that would stop you from using this"],
  "delightPoints": ["things that genuinely excited you"],
  "rawFeedback": "2-3 sentences of unfiltered feedback as yourself",
  "sentiment": "negative" | "neutral" | "positive" | "enthusiastic",
  "npsScore": 0-10 (would you recommend this to a friend?)
}`,
      );

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return { personaId: persona.id, ...parsed } as PersonaReaction;
        }
      } catch {
        // Fallback
      }

      return {
        personaId: persona.id,
        firstImpression: 'No response generated',
        wouldUse: false,
        wouldPay: false,
        maxPrice: null,
        frictionPoints: [],
        delightPoints: [],
        rawFeedback: 'Simulation failed for this persona',
        sentiment: 'neutral' as const,
        npsScore: 5,
      };
    });

    const batchResults = await Promise.all(batchPromises);
    reactions.push(...batchResults);
  }

  return reactions;
}

// ─── Report Generation ────────────────────────────────────────────────────

export async function generateCrowdReport(
  productName: string,
  productDescription: string,
  personas: SyntheticPersona[],
  reactions: PersonaReaction[],
): Promise<CrowdReport> {
  // Aggregate stats
  const sentimentBreakdown = {
    negative: reactions.filter(r => r.sentiment === 'negative').length,
    neutral: reactions.filter(r => r.sentiment === 'neutral').length,
    positive: reactions.filter(r => r.sentiment === 'positive').length,
    enthusiastic: reactions.filter(r => r.sentiment === 'enthusiastic').length,
  };

  const avgNPS = reactions.reduce((sum, r) => sum + r.npsScore, 0) / Math.max(1, reactions.length);
  const wouldUsePercent = (reactions.filter(r => r.wouldUse).length / Math.max(1, reactions.length)) * 100;
  const wouldPayPercent = (reactions.filter(r => r.wouldPay).length / Math.max(1, reactions.length)) * 100;

  const pricedReactions = reactions.filter(r => r.maxPrice !== null && r.maxPrice > 0);
  const avgMaxPrice = pricedReactions.length > 0
    ? pricedReactions.reduce((sum, r) => sum + (r.maxPrice || 0), 0) / pricedReactions.length
    : null;

  // Frequency analysis for friction/delight
  const frictionMap = new Map<string, number>();
  const delightMap = new Map<string, number>();

  for (const r of reactions) {
    for (const f of r.frictionPoints) {
      const key = f.toLowerCase().trim();
      frictionMap.set(key, (frictionMap.get(key) || 0) + 1);
    }
    for (const d of r.delightPoints) {
      const key = d.toLowerCase().trim();
      delightMap.set(key, (delightMap.get(key) || 0) + 1);
    }
  }

  const topFrictionPoints = [...frictionMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([issue, frequency]) => ({ issue, frequency }));

  const topDelightPoints = [...delightMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([feature, frequency]) => ({ feature, frequency }));

  // LLM-generated executive summary
  const summaryResponse = await callLLM(
    `You are a Boost|Bridge Companion — educated, chill, direct. Think "strategy meets the barbershop." No corporate fluff. Use analogies. Frame Six Sigma rigor as "high standards" or "top tier." Be real about what works and what doesn't.`,
    `Write an executive summary for this synthetic market simulation:

Product: "${productName}"
Description: "${productDescription}"
Sample Size: ${reactions.length} synthetic personas
NPS Average: ${avgNPS.toFixed(1)}/10
Would Use: ${wouldUsePercent.toFixed(0)}%
Would Pay: ${wouldPayPercent.toFixed(0)}%
Avg Max Price: ${avgMaxPrice ? `$${avgMaxPrice.toFixed(2)}/mo` : 'N/A'}

Sentiment: ${sentimentBreakdown.enthusiastic} enthusiastic, ${sentimentBreakdown.positive} positive, ${sentimentBreakdown.neutral} neutral, ${sentimentBreakdown.negative} negative

Top friction: ${topFrictionPoints.slice(0, 5).map(f => f.issue).join(', ')}
Top delight: ${topDelightPoints.slice(0, 5).map(d => d.feature).join(', ')}

Write 2-3 paragraphs. Be direct about whether this idea has legs or needs a remix. Reference specific numbers.`,
  );

  // Recommendations
  const recsResponse = await callLLM(
    `You are a Boost|Bridge Companion. Give 4-6 actionable recommendations. Be specific. Frame each one as "Do X because Y." No vague advice. If the product needs to pivot, say it straight.`,
    `Based on simulation results for "${productName}":
- NPS: ${avgNPS.toFixed(1)}, Usage intent: ${wouldUsePercent.toFixed(0)}%, Pay intent: ${wouldPayPercent.toFixed(0)}%
- Main friction: ${topFrictionPoints.slice(0, 5).map(f => `${f.issue} (${f.frequency}x)`).join(', ')}
- Main delight: ${topDelightPoints.slice(0, 5).map(d => `${d.feature} (${d.frequency}x)`).join(', ')}
- Some raw feedback: ${reactions.slice(0, 5).map(r => `"${r.rawFeedback}"`).join(' | ')}

Output a JSON array of recommendation strings.`,
  );

  let recommendations: string[] = [];
  try {
    const jsonMatch = recsResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) recommendations = JSON.parse(jsonMatch[0]);
  } catch {
    recommendations = [
      'Review the top friction points and address the most frequently cited issues first.',
      'Consider adjusting pricing based on the willingness-to-pay data from the simulation.',
      'Double down on the delight features — those are your retention hooks.',
    ];
  }

  return {
    reportId: `BB-CROWD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productName,
    totalPersonas: personas.length,
    completedAt: new Date().toISOString(),
    sentimentBreakdown,
    avgNPS: Math.round(avgNPS * 10) / 10,
    wouldUsePercent: Math.round(wouldUsePercent),
    wouldPayPercent: Math.round(wouldPayPercent),
    avgMaxPrice: avgMaxPrice ? Math.round(avgMaxPrice * 100) / 100 : null,
    topFrictionPoints,
    topDelightPoints,
    personas,
    reactions,
    executiveSummary: summaryResponse,
    recommendations,
  };
}
