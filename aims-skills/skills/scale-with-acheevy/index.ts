/**
 * Scale with ACHEEVY — Business Builder Skills
 *
 * Your AI co-founder for launching and scaling businesses.
 * Triggered when NLP detects user wants to start/build a business.
 *
 * ACHEEVY orchestrates:
 * - Boomer_Angs: Task execution agents
 * - Chicken Hawk: Rapid deployment bot
 * - Lil_Hawks: Specialized micro-agents
 */

export interface ScaleContext {
  userId: string;
  interests?: string[];
  industry?: string;
  targetAudience?: string;
  businessIdea?: string;
  problem?: string;
  product?: string;
  niche?: string;
}

export interface SkillResult {
  skill: string;
  output: string;
  followUp?: string;
  refinementPrompt?: string;
}

// ─────────────────────────────────────────────────────────────
// Intent Detection
// ─────────────────────────────────────────────────────────────

const BUSINESS_INTENT_PATTERNS = [
  /start(ing)?\s*(a|my)?\s*business/i,
  /business\s*idea/i,
  /startup\s*idea/i,
  /launch(ing)?\s*(a|my)?\s*(company|product|service)/i,
  /build(ing)?\s*(a|my)?\s*business/i,
  /entrepreneur/i,
  /side\s*hustle/i,
  /validate\s*(my|an?)?\s*idea/i,
  /mvp/i,
  /go\s*to\s*market/i,
  /what\s*should\s*i\s*build/i,
];

export function detectBusinessIntent(message: string): boolean {
  return BUSINESS_INTENT_PATTERNS.some(pattern => pattern.test(message));
}

// ─────────────────────────────────────────────────────────────
// Skill Matching
// ─────────────────────────────────────────────────────────────

export type ScaleSkill =
  | 'idea-generator'
  | 'pain-points'
  | 'brand-name'
  | 'value-prop'
  | 'mvp-plan'
  | 'persona'
  | 'social-hooks'
  | 'cold-outreach'
  | 'automation'
  | 'content-calendar';

const SKILL_PATTERNS: Record<ScaleSkill, RegExp[]> = {
  'idea-generator': [/business\s*ideas?/i, /startup\s*ideas?/i, /what\s*should\s*i\s*build/i, /suggest.*ideas/i],
  'pain-points': [/pain\s*points?/i, /problems?\s*in/i, /market\s*gaps?/i, /customer\s*frustrations?/i],
  'brand-name': [/brand\s*name/i, /company\s*name/i, /what\s*to\s*call/i, /name.*business/i],
  'value-prop': [/value\s*proposition/i, /why\s*us/i, /unique\s*selling/i, /usp/i],
  'mvp-plan': [/mvp/i, /launch\s*plan/i, /get\s*started/i, /first\s*steps?/i, /minimum\s*viable/i],
  'persona': [/target\s*customer/i, /who\s*buys/i, /ideal\s*customer/i, /customer\s*persona/i, /buyer\s*persona/i],
  'social-hooks': [/launch\s*tweet/i, /social\s*post/i, /announce/i, /twitter\s*hook/i, /x\s*hook/i],
  'cold-outreach': [/cold\s*email/i, /outreach/i, /pitch\s*email/i, /reach\s*out/i],
  'automation': [/automat/i, /save\s*time/i, /streamline/i, /repetitive\s*tasks?/i],
  'content-calendar': [/content\s*plan/i, /posting\s*schedule/i, /content\s*calendar/i, /social\s*media\s*plan/i],
};

export function matchSkill(message: string): ScaleSkill | null {
  for (const [skill, patterns] of Object.entries(SKILL_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(message))) {
      return skill as ScaleSkill;
    }
  }
  // Default to idea generator if business intent but no specific skill
  if (detectBusinessIntent(message)) {
    return 'idea-generator';
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Prompt Templates
// ─────────────────────────────────────────────────────────────

export const SKILL_PROMPTS: Record<ScaleSkill, (ctx: ScaleContext) => string> = {
  'idea-generator': (ctx) => `
Suggest 5 business ideas based on my interests: ${ctx.interests?.join(', ') || '[user interests]'}.
Make them modern, digital-first, and feasible for a solo founder.
For each idea, include:
- Name
- One-line description
- Target market
- Revenue model
- Why it could work in 2026
`.trim(),

  'pain-points': (ctx) => `
Analyze the current ${ctx.industry || '[industry]'} landscape.
What are the top 3 pain points customers face?
Give specific examples and explain briefly.
Include:
- The pain point
- Who experiences it most
- Current inadequate solutions
- Opportunity for a new solution
`.trim(),

  'brand-name': (ctx) => `
Generate 5 unique, catchy brand names for a business that solves ${ctx.problem || '[problem]'} for ${ctx.targetAudience || '[target audience]'}.
For each name:
- The name
- Domain availability hint (.com, .io, .co)
- Rationale
- Potential tagline
`.trim(),

  'value-prop': (ctx) => `
Write a one-sentence value proposition for a business offering ${ctx.product || '[product/service]'} to help ${ctx.targetAudience || '[target audience]'} achieve ${ctx.problem || '[outcome]'}.
Then provide:
- Extended version (2-3 sentences)
- Elevator pitch (30 seconds)
- Key differentiators (3 bullet points)
`.trim(),

  'mvp-plan': (ctx) => `
Outline a simple 5-step MVP launch plan for a startup doing ${ctx.businessIdea || '[business idea]'}.
Focus on:
- Fast launch (under 2 weeks)
- Testing assumptions
- Feedback cycles
- Minimum viable features
- First 10 customers strategy
`.trim(),

  'persona': (ctx) => `
Describe 3 detailed customer personas for ${ctx.businessIdea || '[business idea]'}:
For each persona include:
- Name and demographics
- Goals and motivations
- Frustrations and pain points
- Preferred online platforms
- How they'd discover your product
- Objections they might have
`.trim(),

  'social-hooks': (ctx) => `
Generate 3 high-impact Twitter/X hooks to launch ${ctx.product || '[product/service]'} in ${ctx.niche || '[niche]'}.
Requirements:
- Under 120 characters each
- Engagement-focused
- Include a hook, value, and soft CTA
Also provide:
- Best time to post
- Hashtag suggestions
- Thread starter idea
`.trim(),

  'cold-outreach': (ctx) => `
Write a concise cold email template for pitching ${ctx.product || '[offer]'} to ${ctx.targetAudience || '[client type]'}.
Make it:
- Friendly and direct
- Under 150 words
- Strong subject line
- Clear call to action
Also provide:
- Follow-up email (3 days later)
- LinkedIn connection message version
`.trim(),

  'automation': (ctx) => `
Suggest 5 ways to automate repetitive tasks for a ${ctx.businessIdea || '[business type]'}.
For each automation:
- Task to automate
- Tool recommendation
- Setup complexity (Easy/Medium/Hard)
- Time saved per week
- Quick implementation steps
`.trim(),

  'content-calendar': (ctx) => `
Draft a basic monthly content calendar for promoting ${ctx.product || '[business/product]'} online.
Include:
- 4 content themes/pillars
- Posting frequency per platform
- Content types (video, carousel, thread, etc.)
- Sample post ideas for week 1
- Engagement strategy
`.trim(),
};

// ─────────────────────────────────────────────────────────────
// Refinement Flow
// ─────────────────────────────────────────────────────────────

export const REFINEMENT_PROMPTS = {
  clarify: "What's unclear, risky, or missing from this?",
  resonate: (audience: string) => `Make this resonate with ${audience}. Here's what I know about them: [insert data]`,
  expert: (field: string) => `What would the 0.01% top expert in ${field} do here?`,
};

export function getRefinementFlow(skill: ScaleSkill, context: ScaleContext): string[] {
  return [
    `Great! Here's your ${skill.replace('-', ' ')} output.`,
    REFINEMENT_PROMPTS.clarify,
    REFINEMENT_PROMPTS.resonate(context.targetAudience || 'your target audience'),
    REFINEMENT_PROMPTS.expert(context.industry || 'your field'),
  ];
}

// ─────────────────────────────────────────────────────────────
// Main Runner
// ─────────────────────────────────────────────────────────────

export async function runScaleSkill(
  skill: ScaleSkill,
  context: ScaleContext
): Promise<SkillResult> {
  const prompt = SKILL_PROMPTS[skill](context);
  const refinement = getRefinementFlow(skill, context);

  return {
    skill,
    output: prompt,
    followUp: refinement[1],
    refinementPrompt: `After receiving output, continue with:\n${refinement.slice(1).map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
  };
}

// ─────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────

export default {
  detectBusinessIntent,
  matchSkill,
  runScaleSkill,
  SKILL_PROMPTS,
  REFINEMENT_PROMPTS,
};
