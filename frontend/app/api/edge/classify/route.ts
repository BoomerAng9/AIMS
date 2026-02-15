/**
 * Edge Intent Classifier — PMO routing at the edge
 *
 * Pure computation, zero Node.js dependencies.
 * Mirrors the full /api/chat/classify endpoint but runs on edge runtime
 * with a leaner response payload optimized for wearable/mobile clients.
 *
 * Runtime: Vercel Edge (~10ms globally)
 */

export const runtime = 'edge';

type PmoId =
  | 'tech-office' | 'finance-office' | 'ops-office'
  | 'marketing-office' | 'design-office' | 'publishing-office'
  | 'hr-office' | 'dtpmo-office';

const PMO_KEYWORDS: Record<PmoId, string[]> = {
  'tech-office': [
    'deploy', 'build', 'code', 'api', 'docker', 'infrastructure', 'server',
    'database', 'backend', 'frontend', 'pipeline', 'ci/cd', 'devops',
    'debug', 'fix', 'test', 'refactor', 'architecture', 'vps', 'nginx',
    'kubernetes', 'container', 'microservice', 'git', 'webhook',
  ],
  'finance-office': [
    'budget', 'cost', 'price', 'billing', 'invoice', 'payment', 'stripe',
    'subscription', 'luc', 'quota', 'revenue', 'roi', 'profit', 'expense',
    'forecast', 'financial', 'accounting',
  ],
  'ops-office': [
    'monitor', 'health', 'uptime', 'performance', 'sla', 'incident',
    'alert', 'log', 'metric', 'scale', 'load', 'throughput', 'latency',
    'backup', 'restore', 'maintenance', 'optimize',
  ],
  'marketing-office': [
    'campaign', 'seo', 'content', 'social', 'brand', 'growth', 'user',
    'acquisition', 'funnel', 'conversion', 'engagement', 'audience',
    'analytics', 'advertising', 'promote', 'outreach',
  ],
  'design-office': [
    'design', 'ui', 'ux', 'visual', 'video', 'image', 'animation',
    'logo', 'brand', 'color', 'layout', 'wireframe', 'prototype',
    'figma', 'mockup', 'illustration', 'thumbnail',
  ],
  'publishing-office': [
    'publish', 'blog', 'article', 'documentation', 'readme', 'docs',
    'newsletter', 'release', 'changelog', 'announcement', 'editorial',
    'copywriting', 'post', 'distribution',
  ],
  'hr-office': [
    'hire', 'onboard', 'role', 'assign', 'coach', 'training', 'progression',
    'bench', 'team', 'workforce', 'performance review', 'gap', 'skill',
    'mentor', 'rotation', 'evaluation', 'intern', 'promotion',
  ],
  'dtpmo-office': [
    'governance', 'pattern', 'standard', 'verify', 'verification', 'audit',
    'compliance', 'quality', 'gate', 'iso', 'risk', 'cost meter', 'workflow',
    'priority', 'arbitration', 'template', 'blueprint', 'proof',
  ],
};

const DIRECTOR_MAP: Record<PmoId, string> = {
  'tech-office': 'Boomer_CTO',
  'finance-office': 'Boomer_CFO',
  'ops-office': 'Boomer_COO',
  'marketing-office': 'Boomer_CMO',
  'design-office': 'Boomer_CDO',
  'publishing-office': 'Boomer_CPO',
  'hr-office': 'Betty-Ann_Ang',
  'dtpmo-office': 'Astra_Ang',
};

const ACTION_VERBS = [
  'deploy', 'build', 'create', 'implement', 'fix', 'update', 'run',
  'execute', 'start', 'launch', 'install', 'configure', 'setup', 'migrate',
];

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'message required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lower = message.toLowerCase();
    const words = lower.split(/\s+/);

    // Score each office
    let bestOffice: PmoId = 'tech-office';
    let bestScore = 0;
    const matchedKeywords: string[] = [];

    for (const [office, keywords] of Object.entries(PMO_KEYWORDS)) {
      let score = 0;
      for (const kw of keywords) {
        if (lower.includes(kw)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestOffice = office as PmoId;
      }
    }

    // Collect matched keywords for the winning office
    for (const kw of PMO_KEYWORDS[bestOffice]) {
      if (lower.includes(kw)) matchedKeywords.push(kw);
    }

    const confidence = Math.min(bestScore / Math.max(words.length, 1), 1);
    const lane = ACTION_VERBS.some(v => lower.includes(v)) ? 'deploy_it' : 'guide_me';

    // Lean response — no office labels or complexity scoring (wearable-optimized)
    return new Response(
      JSON.stringify({
        office: bestOffice,
        director: DIRECTOR_MAP[bestOffice],
        confidence: Math.round(confidence * 100) / 100,
        lane,
        keywords: matchedKeywords,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Classification failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
