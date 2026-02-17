/**
 * Per|Form Subscription Models — Frontend Data
 *
 * 4 models on the 3-6-9 commitment ladder, with SEPARATE token allocation tiers.
 *
 * Commitment = how many months you want (3, 6, or 9).
 * Token Tier = how many tokens per month (Casual, Intermediate, Heavy).
 * These are independent — a 3-month user can get the Heavy token tier.
 *
 * Pricing is cost-based: Open Router model rates → our markup → user price.
 * Free models (Kimi K2.5, GLM 4.7) keep base costs near zero.
 * Premium features (Gemini Deep Think for deep research) cost more.
 *
 * Models:
 *   1. CREATOR   — Podcasters, YouTubers, bloggers covering CFB recruiting
 *   2. PARTNER   — Schools, colleges, athletic programs
 *   3. FAMILIES  — Parents who can't afford $500-$2000 camps (the "Anti-Camp" mentality)
 *   4. ALL-IN-ONE — Everything bundled at a competitive price
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type CommitmentTerm = 'p2p' | '3mo' | '6mo' | '9mo';
export type SubscriptionModelId = 'creator' | 'partner' | 'families' | 'all_in_one';
export type TokenTierId = 'casual' | 'intermediate' | 'heavy';

export interface CommitmentPricing {
  term: CommitmentTerm;
  label: string;
  monthlyPrice: number;
  commitmentMonths: number;
  deliveredMonths: number;
  totalPrice: number;
  savings: string;
}

export interface TokenTier {
  id: TokenTierId;
  name: string;
  tokensPerMonth: number;
  description: string;
  /** Monthly addon price for this token tier (on top of base subscription) */
  monthlyAddon: number;
  /** Overage rate per 1K tokens beyond allocation */
  overageRatePer1K: number;
}

export interface SubscriptionModel {
  id: SubscriptionModelId;
  name: string;
  tagline: string;
  description: string;
  targetAudience: string;
  icon: string;
  color: string;
  pricing: CommitmentPricing[];
  features: string[];
  /** Short summary of what's included */
  includes: string[];
  /** Features this model does NOT include (helps differentiate from All-In-One) */
  excludes: string[];
}

// ─── Token Tiers (Independent of Commitment) ───────────────────────────────
//
// These are based on Open Router cost analysis:
//   - Kimi K2.5 (free tier): $0 input/output (data may be used for training)
//   - Kimi K2.5 (paid): $0.50/1M input, $2.80/1M output
//   - GLM 4.7 (free tier): $0 input/output
//   - GLM 4.7 (paid): $0.40/1M input, $1.50/1M output
//   - Gemini 2.5 Pro (deep research): $1.25/1M input, $10.00/1M output
//
// At free tier rates, token cost is effectively $0 for standard operations.
// We charge a small markup to cover infrastructure, delivery, and value-add.
// Heavy tier includes Gemini Deep Think access at higher cost.

export const TOKEN_TIERS: TokenTier[] = [
  {
    id: 'casual',
    name: 'Casual',
    tokensPerMonth: 200_000,
    description: 'A few chats per week, basic alerts and updates',
    monthlyAddon: 0,       // Included with any subscription
    overageRatePer1K: 0.05,
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    tokensPerMonth: 1_000_000,
    description: 'Daily use, content generation, film breakdowns, API access',
    monthlyAddon: 4.99,
    overageRatePer1K: 0.04,
  },
  {
    id: 'heavy',
    name: 'Heavy',
    tokensPerMonth: 5_000_000,
    description: 'Power use, deep research, bulk exports, agentic workflows',
    monthlyAddon: 14.99,
    overageRatePer1K: 0.03,
  },
];

// ─── Internal Cost Ledger ───────────────────────────────────────────────────
//
// NOT exported to the frontend UI — used for internal pricing decisions.
// Keeping it here as documentation of our cost basis.
//
// Model Costs via Open Router (per 1M tokens):
//
// | Model              | Input   | Output  | Free Tier? | Daily Limit (free) |
// |--------------------|---------|---------|------------|-------------------|
// | Kimi K2.5          | $0.50   | $2.80   | Yes        | 50-1000 req/day   |
// | GLM 4.7            | $0.40   | $1.50   | Yes        | 50-1000 req/day   |
// | Gemini 2.5 Pro     | $1.25   | $10.00  | No         | Paid only         |
//
// Blended cost estimate (70% free Kimi, 20% free GLM, 10% paid Gemini):
//   - Casual (200K tok/mo):  ~$0.00 (all free tier)
//   - Intermediate (1M tok/mo): ~$0.50 (mostly free + some paid overflow)
//   - Heavy (5M tok/mo): ~$8.00 (free tier maxed, paid models needed)
//
// Our markup covers:
//   - Infrastructure: hosting, CDN, database, monitoring (~$200/mo fixed)
//   - Data pipeline: Brave API, scraping, 6x/day updates (~$50/mo)
//   - Security: encryption, auth, audit logging (~$30/mo)
//   - Support: email, account management
//   - Margin: 30-50% on paid tiers

// ─── Model 1: CREATOR ──────────────────────────────────────────────────────
// Benchmark: PFF+ $9.99/mo, 247 $9.95/mo, On3 $11.99/mo, The Athletic $7.99/mo

export const CREATOR_MODEL: SubscriptionModel = {
  id: 'creator',
  name: 'Creator',
  tagline: 'Feed your content machine',
  description:
    'For podcasters, YouTubers, and content creators covering college football recruiting. Get AI-generated show prep, prospect graphics, data feeds, and real-time alerts to power your content.',
  targetAudience: 'Podcasters, YouTubers, bloggers, recruiting analysts',
  icon: 'Mic',
  color: 'emerald',
  pricing: [
    {
      term: 'p2p',
      label: 'Pay-per-Use',
      monthlyPrice: 0,
      commitmentMonths: 0,
      deliveredMonths: 0,
      totalPrice: 0,
      savings: '$0.10/alert, $0.50/graphic, $1.00/film breakdown',
    },
    {
      term: '3mo',
      label: '3 Months',
      monthlyPrice: 9.99,
      commitmentMonths: 3,
      deliveredMonths: 3,
      totalPrice: 29.97,
      savings: 'Matches market rate',
    },
    {
      term: '6mo',
      label: '6 Months',
      monthlyPrice: 7.99,
      commitmentMonths: 6,
      deliveredMonths: 6,
      totalPrice: 47.94,
      savings: '20% off — undercuts PFF and 247',
    },
    {
      term: '9mo',
      label: '9 Months',
      monthlyPrice: 5.99,
      commitmentMonths: 9,
      deliveredMonths: 12,
      totalPrice: 53.91,
      savings: 'Best rate — pay 9, get 12',
    },
  ],
  features: [
    'Full Big Board access (300+ HS, 551 college prospects)',
    'Real-time commitment and decommitment alerts',
    'Transfer Portal live tracker',
    'NIL deal feed with valuations',
    'AI-generated show prep packages (daily)',
    'Branded prospect graphics (your logo, our data)',
    'AI film breakdown summaries',
    'P.A.I. Score access for all ranked prospects',
    'Podcast and video script starters',
    'Embeddable widgets for your website',
    'API access for custom integrations',
    'Bulk data exports (CSV/JSON)',
    'Bull vs Bear scouting debate logs',
    'Content calendar with peak-topic scheduling',
  ],
  includes: [
    'Prospect database',
    'Content feed engine',
    'Graphic generator',
    'API access',
    'Data exports',
  ],
  excludes: [
    'Film upload and distribution to schools',
    'Coach contact directory and direct messaging',
    'NIL education center and legal resources',
    'School page and recruiting board',
    'Incoming prospect film inbox',
  ],
};

// ─── Model 2: PARTNER (Institution) ────────────────────────────────────────
// Benchmark: MaxPreps Advantage $600/team/yr, PFF Team Services (undisclosed)

export const PARTNER_MODEL: SubscriptionModel = {
  id: 'partner',
  name: 'Partner',
  tagline: 'We support you, you support us',
  description:
    'For schools, colleges, and athletic programs. Mutual sponsorship — we feature your logo, you assign a team manager. Access incoming prospect film, recruiting analytics, and NIL compliance tools.',
  targetAudience: 'Schools, colleges, athletic programs, team managers',
  icon: 'Building2',
  color: 'blue',
  pricing: [
    {
      term: 'p2p',
      label: 'Basic Listing',
      monthlyPrice: 0,
      commitmentMonths: 0,
      deliveredMonths: 0,
      totalPrice: 0,
      savings: 'Free listing — your school page exists, no premium features',
    },
    {
      term: '3mo',
      label: '3 Months',
      monthlyPrice: 49.99,
      commitmentMonths: 3,
      deliveredMonths: 3,
      totalPrice: 149.97,
      savings: 'Trial partnership',
    },
    {
      term: '6mo',
      label: '6 Months',
      monthlyPrice: 39.99,
      commitmentMonths: 6,
      deliveredMonths: 6,
      totalPrice: 239.94,
      savings: '20% off — half the cost of MaxPreps Advantage',
    },
    {
      term: '9mo',
      label: '9 Months',
      monthlyPrice: 29.99,
      commitmentMonths: 9,
      deliveredMonths: 12,
      totalPrice: 269.91,
      savings: 'Best rate — pay 9, get 12',
    },
  ],
  features: [
    'Branded school page on Per|Form (logo, colors, staff)',
    'Incoming prospect film inbox — parents send film to you',
    'Recruiting board: track, tag, and organize prospects',
    'AI scouting reports on incoming film uploads',
    'Team manager seat (dedicated staff login)',
    'Co-branded graphics (your logo + Per|Form)',
    'NIL compliance dashboard for your program',
    'Revenue share model documentation',
    'Coaching staff directory listing',
    'Direct messaging from verified prospects and parents',
    'Analytics: who views your school, positions, locations',
    'Logo displayed on Per|Form partner wall',
    'Cross-promotion on Per|Form social channels',
    'Camp and event listing and promotion',
  ],
  includes: [
    'School page',
    'Film inbox',
    'Recruiting board',
    'NIL compliance tools',
    'Analytics dashboard',
    'Co-branded graphics',
  ],
  excludes: [
    'Content creation tools (show prep, scripts, widgets)',
    'API access and bulk data exports',
    'Player card generator',
    'Podcast and video script starters',
  ],
};

// ─── Model 3: FAMILIES (The Anti-Camp Mentality) ───────────────────────────
// Target: Parents who can't afford $500-$2000 camps

export const FAMILIES_MODEL: SubscriptionModel = {
  id: 'families',
  name: 'Families',
  tagline: 'Your kid deserves to be seen',
  description:
    'For parents of athletes who can\'t make it to the elite camps. Upload game film, get it in front of coaches, understand NIL, and learn what each school\'s revenue share model means for your family. No more buying stars — earn them with tape.',
  targetAudience: 'Parents of high school athletes, families',
  icon: 'Film',
  color: 'amber',
  pricing: [
    {
      term: 'p2p',
      label: 'Try It Free',
      monthlyPrice: 0,
      commitmentMonths: 0,
      deliveredMonths: 0,
      totalPrice: 0,
      savings: 'Upload 1 film free — see how it works',
    },
    {
      term: '3mo',
      label: '3 Months',
      monthlyPrice: 14.99,
      commitmentMonths: 3,
      deliveredMonths: 3,
      totalPrice: 44.97,
      savings: 'Less than a single camp registration',
    },
    {
      term: '6mo',
      label: '6 Months',
      monthlyPrice: 11.99,
      commitmentMonths: 6,
      deliveredMonths: 6,
      totalPrice: 71.94,
      savings: '20% off — covers the full recruiting season',
    },
    {
      term: '9mo',
      label: '9 Months',
      monthlyPrice: 8.99,
      commitmentMonths: 9,
      deliveredMonths: 12,
      totalPrice: 80.91,
      savings: 'Best rate — pay 9, get 12',
    },
  ],
  features: [
    'Unlimited game film uploads',
    'AI-powered film analysis (strengths, areas to improve)',
    'Direct film distribution to college coaching staffs',
    'School contact directory (coaches, recruiting coordinators)',
    'Send film to any partner school with one click',
    'Track which schools viewed your athlete\'s film',
    'View notifications when coaches watch your film',
    'Player profile page (shareable link for recruiting)',
    'Digital player card with stats and film link',
    'NIL education center: what it is, how it works',
    'School-by-school revenue share breakdown',
    'NIL deal comparison tool across schools',
    'Legal resources: understanding NIL contracts and compliance',
    'Get noticed without the $500-$2000 camp fee',
    'P.A.I. Score generation for your athlete',
  ],
  includes: [
    'Film upload and distribution',
    'Coach contact directory',
    'NIL education',
    'Revenue share intel',
    'Player card generator',
    'Film analytics',
  ],
  excludes: [
    'Content creation tools (show prep, scripts, widgets)',
    'API access and bulk data exports',
    'School page and recruiting board',
    'Co-branded graphics',
  ],
};

// ─── Model 4: ALL-IN-ONE ───────────────────────────────────────────────────
// Everything bundled. Competitively priced.

export const ALL_IN_ONE_MODEL: SubscriptionModel = {
  id: 'all_in_one',
  name: 'All-In-One',
  tagline: 'Everything. One price.',
  description:
    'The complete Per|Form experience. All Creator tools, full Partner access, all Families features, plus data visualization, priority processing, and white-label exports. One price covers everything.',
  targetAudience: 'Power users, agencies, families with multiple athletes, serious creators',
  icon: 'Crown',
  color: 'gold',
  pricing: [
    // All-In-One does not offer pay-per-use
    {
      term: '3mo',
      label: '3 Months',
      monthlyPrice: 59.99,
      commitmentMonths: 3,
      deliveredMonths: 3,
      totalPrice: 179.97,
      savings: '20% cheaper than buying separately',
    },
    {
      term: '6mo',
      label: '6 Months',
      monthlyPrice: 49.99,
      commitmentMonths: 6,
      deliveredMonths: 6,
      totalPrice: 299.94,
      savings: '33% cheaper than buying separately',
    },
    {
      term: '9mo',
      label: '9 Months',
      monthlyPrice: 39.99,
      commitmentMonths: 9,
      deliveredMonths: 12,
      totalPrice: 359.91,
      savings: 'Best rate — pay 9, get 12',
    },
  ],
  features: [
    'Everything in Creator',
    'Everything in Partner',
    'Everything in Families',
    'Interactive data visualization (prompt-to-chart)',
    'Full school revenue share comparison (all partner schools)',
    'Priority AI processing (faster film analysis, faster graphics)',
    'White-label export (your brand on everything)',
    'Dedicated account support',
    'Early access to new features',
    'Revenue share on referrals',
    'Gemini Deep Think access for deep research',
  ],
  includes: [
    'Everything in Creator',
    'Everything in Partner',
    'Everything in Families',
    'Data visualization engine',
    'Priority processing',
    'White-label exports',
    'Deep research access',
  ],
  excludes: [], // All-In-One includes everything
};

// ─── All Models ─────────────────────────────────────────────────────────────

export const SUBSCRIPTION_MODELS: SubscriptionModel[] = [
  CREATOR_MODEL,
  PARTNER_MODEL,
  FAMILIES_MODEL,
  ALL_IN_ONE_MODEL,
];

// ─── Cost Transparency ─────────────────────────────────────────────────────
// What annual pricing covers (shown to users for transparency)

export const ANNUAL_COST_BREAKDOWN: Record<string, string> = {
  maintenance: 'Platform hosting, CDN, database, backups, monitoring',
  research: 'Data acquisition (Brave Search, scouting feeds), verification, 6x/day updates',
  security: 'Encryption at rest and in transit, auth, rate limiting, audit logs',
  delivery: 'Real-time alerts, webhook delivery, email digests, API uptime',
  nilResearch: 'School-by-school NIL policy tracking, revenue share analysis, legal updates',
  aiCosts: 'LLM inference (film analysis, content gen), image generation (graphics, player cards)',
  support: 'Email support, account management (All-In-One: dedicated)',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Get a model by ID */
export function getModel(id: SubscriptionModelId): SubscriptionModel | undefined {
  return SUBSCRIPTION_MODELS.find((m) => m.id === id);
}

/** Get pricing for a specific model + commitment term */
export function getPrice(
  modelId: SubscriptionModelId,
  term: CommitmentTerm,
): CommitmentPricing | undefined {
  const model = getModel(modelId);
  return model?.pricing.find((p) => p.term === term);
}

/** Calculate total monthly cost (base subscription + token tier addon) */
export function calculateMonthly(
  modelId: SubscriptionModelId,
  term: CommitmentTerm,
  tokenTierId: TokenTierId,
): { base: number; tokenAddon: number; total: number } | null {
  const price = getPrice(modelId, term);
  const tokenTier = TOKEN_TIERS.find((t) => t.id === tokenTierId);
  if (!price || !tokenTier) return null;

  return {
    base: price.monthlyPrice,
    tokenAddon: tokenTier.monthlyAddon,
    total: price.monthlyPrice + tokenTier.monthlyAddon,
  };
}
