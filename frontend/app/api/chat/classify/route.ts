import { NextRequest, NextResponse } from 'next/server';

/**
 * PMO Intent Classification Endpoint
 *
 * Lightweight client-side classifier that mirrors the backend pmo-router.
 * Returns PMO office, director, confidence, and execution lane for a message.
 * Used by the Chat w/ACHEEVY UI to show pipeline routing in real-time.
 */

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

const OFFICE_LABELS: Record<PmoId, string> = {
  'tech-office': 'Technology Office',
  'finance-office': 'Finance Office',
  'ops-office': 'Operations Office',
  'marketing-office': 'Marketing Office',
  'design-office': 'Design Office',
  'publishing-office': 'Publishing Office',
  'hr-office': 'HR Office',
  'dtpmo-office': 'DT-PMO Office',
};

const ACTION_VERBS = [
  'deploy', 'build', 'create', 'implement', 'fix', 'update', 'run',
  'execute', 'start', 'launch', 'install', 'configure', 'setup', 'migrate',
];

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    const lower = message.toLowerCase();
    const words = lower.split(/\s+/);

    // Score each office
    const scores: Record<PmoId, { score: number; keywords: string[] }> = {
      'tech-office': { score: 0, keywords: [] },
      'finance-office': { score: 0, keywords: [] },
      'ops-office': { score: 0, keywords: [] },
      'marketing-office': { score: 0, keywords: [] },
      'design-office': { score: 0, keywords: [] },
      'publishing-office': { score: 0, keywords: [] },
      'hr-office': { score: 0, keywords: [] },
      'dtpmo-office': { score: 0, keywords: [] },
    };

    for (const [office, keywords] of Object.entries(PMO_KEYWORDS)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          scores[office as PmoId].score += 1;
          scores[office as PmoId].keywords.push(kw);
        }
      }
    }

    let bestOffice: PmoId = 'tech-office';
    let bestScore = 0;
    for (const [office, data] of Object.entries(scores)) {
      if (data.score > bestScore) {
        bestScore = data.score;
        bestOffice = office as PmoId;
      }
    }

    const confidence = Math.min(bestScore / Math.max(words.length, 1), 1);
    const executionLane = ACTION_VERBS.some(v => lower.includes(v)) ? 'deploy_it' : 'guide_me';

    // Complexity scoring
    let complexity = 0;
    complexity += Math.min(words.length * 1.5, 30);
    const techSignals = ['api', 'docker', 'database', 'deploy', 'architecture', 'pipeline', 'webhook', 'oauth', 'ssl', 'kubernetes'];
    for (const sig of techSignals) { if (lower.includes(sig)) complexity += 5; }
    const multiStep = ['and then', 'after that', 'next', 'first', 'second', 'finally', 'step'];
    for (const sig of multiStep) { if (lower.includes(sig)) complexity += 8; }
    complexity = Math.min(Math.round(complexity), 100);

    return NextResponse.json({
      pmoOffice: bestOffice,
      officeLabel: OFFICE_LABELS[bestOffice],
      director: DIRECTOR_MAP[bestOffice],
      confidence: Math.round(confidence * 100) / 100,
      keywords: scores[bestOffice].keywords,
      executionLane,
      complexity,
    });
  } catch {
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 });
  }
}
