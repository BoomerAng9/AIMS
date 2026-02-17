/**
 * N.I.L. Content Data Layer — Name, Image & Likeness
 *
 * Single source of truth for all NIL content, deal types, valuation
 * factors, compliance landscape, and the Per|Form ↔ NIL connection.
 *
 * DOMAIN SEPARATION — CRITICAL:
 * This file is SPORTS BUSINESS. Real-world athlete empowerment, contracts,
 * and NIL (Name, Image & Likeness) valuation.
 *
 * The Book of V.I.B.E. universe lives in lore.ts — that is FICTION/STORYTELLING.
 * "NIL" in lore.ts means "the void / anti-creation." "N.I.L." here means
 * "Name, Image & Likeness" — a completely separate domain.
 *
 * DO NOT reference V.I.B.E. characters, lore races, or mythology in this file.
 * DO NOT reference sports, athletes, or Per|Form in lore.ts.
 * These are parallel verticals under the A.I.M.S. umbrella, not the same world.
 */

// ─────────────────────────────────────────────────────────────
// What Is N.I.L.?
// ─────────────────────────────────────────────────────────────

export interface NILBook {
  title: string;
  author: string;
  platform: string;
  description: string;
  url: string;
}

export interface NILFoundation {
  acronym: string;
  fullName: string;
  tagline: string;
  summary: string;
  book: NILBook;
  sections: NILSection[];
  timeline: NILTimelineEvent[];
}

export interface NILSection {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  color: string;
  icon: string;
}

export interface NILTimelineEvent {
  year: number;
  month?: string;
  event: string;
  significance: string;
}

export const NIL_FOUNDATION: NILFoundation = {
  acronym: 'N.I.L.',
  fullName: 'Name, Image & Likeness',
  tagline: 'Every athlete is a brand. Every brand deserves protection.',
  summary:
    'Name, Image & Likeness (NIL) refers to an athlete\'s right to profit from their own identity — their name, their face, their reputation. Before July 2021, the NCAA prohibited college athletes from earning money from their personal brand. That changed everything. NIL isn\'t just a rule change — it\'s a fundamental shift in who controls the value an athlete creates.',

  book: {
    title: 'Mastering the N.I.L.',
    author: 'Boomer_Ang',
    platform: 'Amazon',
    description:
      'The definitive guide to understanding and navigating the Name, Image & Likeness landscape. From valuation frameworks and deal structures to compliance strategies and brand building — this book breaks down the NIL ecosystem for athletes, families, agents, and programs. The formulas and frameworks in this platform are rooted in the research and methodology from this book.',
    url: 'https://www.amazon.com/dp/B0DQ5PWPFP',
  },

  sections: [
    {
      id: 'what-is-nil',
      title: 'What Is N.I.L.?',
      subtitle: 'The athlete\'s right to own their own brand.',
      content:
        'NIL stands for Name, Image, and Likeness — the three components of an athlete\'s personal identity that hold commercial value. Your name is who you are. Your image is how you\'re seen. Your likeness is how you\'re recognized. Together, they form a brand — and that brand belongs to the athlete, not the school, not the conference, not the NCAA.\n\nBefore NIL, a college quarterback who sold 80,000 jerseys saw none of that revenue. A gymnast whose routine went viral with 50 million views couldn\'t monetize a single click. A basketball player whose face was on billboards across the state couldn\'t sign a local endorsement deal.\n\nNIL changed the equation. Athletes can now sign endorsement deals, launch merchandise lines, monetize social media, host camps, make appearances, and license their likeness — all while maintaining their eligibility.',
      color: 'amber',
      icon: 'shield',
    },
    {
      id: 'why-nil-matters',
      title: 'Why N.I.L. Matters',
      subtitle: 'Fairness, equity, and the business of being an athlete.',
      content:
        'College athletics generates over $20 billion in annual revenue. Football and basketball alone drive billions through media deals, ticket sales, and licensing. For decades, every stakeholder profited — coaches, administrators, conferences, networks, apparel companies — except the athletes whose talent created the value.\n\nNIL isn\'t about making athletes rich. It\'s about making the system fair. A walk-on volleyball player at a mid-major can now partner with a local business. A track athlete can coach youth clinics for compensation. A softball pitcher can sell pitching tutorials online. NIL scales from five-figure local deals to seven-figure national campaigns, and every tier matters.\n\nFor recruits, NIL is now part of the decision. Where you play determines what deals you can access, what collectives support you, and what your brand is worth. The landscape is competitive, fast-moving, and unforgiving to athletes who don\'t understand it.',
      color: 'emerald',
      icon: 'scale',
    },
    {
      id: 'the-nil-ecosystem',
      title: 'The N.I.L. Ecosystem',
      subtitle: 'Collectives, agents, brands, and platforms.',
      content:
        'The NIL ecosystem is a network of stakeholders that connect athletes with opportunities:\n\nCollectives — Booster-funded organizations that pool donor money to create NIL deals for athletes, often tied to specific schools. Some operate transparently; others push compliance boundaries.\n\nAgents & Advisors — Licensed professionals who negotiate deals, manage brand strategy, and ensure compliance. The best agents understand both the sports and business sides.\n\nBrands & Sponsors — Companies from Fortune 500 corporations to local businesses that partner with athletes for endorsements, appearances, and content creation.\n\nNIL Platforms — Marketplaces that connect athletes with deal opportunities, handle compliance paperwork, and track earnings. They range from simple listing sites to full-service management tools.\n\nSchool Compliance Offices — Institutional gatekeepers who review deals, ensure NCAA/state law compliance, and educate athletes on their rights and responsibilities.\n\nThe ecosystem is young, evolving, and fragmented. That\'s where Per|Form comes in.',
      color: 'cyan',
      icon: 'network',
    },
    {
      id: 'nil-deal-types',
      title: 'N.I.L. Deal Types',
      subtitle: 'How athletes monetize their brand.',
      content:
        'NIL deals come in many forms, each with different value drivers and compliance considerations:\n\nEndorsements — Traditional brand partnerships where athletes promote products or services. Value scales with visibility, follower count, and sport.\n\nSocial Media — Paid posts, stories, and content creation across Instagram, TikTok, X, and YouTube. The most accessible NIL category — any athlete with a following can participate.\n\nAppearances — Paid events including autograph signings, speaking engagements, store openings, and community events. High per-hour value but limited scalability.\n\nCamps & Clinics — Athletes hosting or coaching youth training sessions. Combines NIL revenue with community engagement and skill development.\n\nMerchandise — Custom apparel, trading cards, and branded products using the athlete\'s name and likeness. Requires upfront investment but builds long-term brand equity.\n\nLicensing — Allowing use of name/image in video games, NFTs, trading cards, or media. Typically involves flat fees or royalties.\n\nCollective Deals — Arrangements through school-affiliated collectives that distribute pooled donor funds as NIL compensation. The most controversial and heavily scrutinized category.',
      color: 'purple',
      icon: 'handshake',
    },
    {
      id: 'valuation',
      title: 'N.I.L. Valuation',
      subtitle: 'What determines an athlete\'s NIL worth?',
      content:
        'NIL valuation is part science, part market dynamics, and part perception. The key factors:\n\nOn-Field Performance — The foundation. Production, awards, and competitive level establish baseline value. An All-American QB is worth more than a backup punter.\n\nSocial Media Presence — Follower count, engagement rate, and content quality across platforms. A gymnast with 2M TikTok followers may out-earn a football player with 50K.\n\nMarket Size — The media market where the athlete plays. Austin, TX and Columbus, OH drive larger deals than Pullman, WA. Conference affiliation matters — SEC and Big Ten command premiums.\n\nPosition & Sport — Quarterbacks, point guards, and high-profile skill positions command the largest deals. Football and basketball dominate, but Olympic sports athletes are finding creative opportunities.\n\nBrand Alignment — An athlete\'s personality, values, and public image must align with potential sponsors. Character and reputation are assets.\n\nTeam Success — Winning drives visibility. A national championship run can multiply an athlete\'s NIL value overnight.\n\nAvailability & Exclusivity — Athletes who commit to fewer, higher-quality partnerships command better rates than those who sign everything.',
      color: 'gold',
      icon: 'chart',
    },
    {
      id: 'compliance',
      title: 'N.I.L. Compliance',
      subtitle: 'Rules, regulations, and the evolving legal landscape.',
      content:
        'NIL compliance is a moving target. The regulatory framework includes multiple layers:\n\nNCAA Guidelines — The baseline rules governing NIL for college athletes. Schools cannot arrange NIL deals as recruiting inducements. Athletes must disclose deals to their compliance office. Compensation must be for legitimate NIL activities, not pay-for-play.\n\nState Laws — Over 30 states have enacted NIL legislation, each with different provisions. Some states are more permissive; others impose restrictions on deal types, disclosure requirements, and collective activity.\n\nSchool Policies — Individual institutions set their own NIL policies within NCAA and state frameworks. These can include mandatory financial literacy education, deal review processes, and exclusive licensing agreements.\n\nFederal Proposals — Congress has considered multiple bills to create a uniform national NIL framework. None have passed yet, leaving a patchwork of state-by-state rules.\n\nThe compliance landscape rewards athletes and organizations that stay informed, document everything, and operate transparently. Red flags include deals with no actual deliverables, compensation significantly above market rate, and arrangements tied to enrollment decisions.',
      color: 'red',
      icon: 'gavel',
    },
    {
      id: 'transfer-portal',
      title: 'The Transfer Portal',
      subtitle: 'Free agency meets college athletics.',
      content:
        'The NCAA Transfer Portal changed the game. Athletes can now enter the portal, explore options, and transfer to a new school — often with NIL deals as a deciding factor. The portal has created a de facto free agency system in college sports.\n\nFor athletes, the portal is leverage. If your current school\'s collective isn\'t competitive, or your playing time is limited, the portal opens doors. For programs, the portal is both a recruiting tool and a retention challenge. Losing a star to a higher-bidding collective is real.\n\nPortal dynamics directly impact NIL valuation. An athlete entering the portal with strong production and social presence can see their NIL value spike as programs compete. Conversely, a portal entrant with declining stats may find their leverage shrinking.\n\nPer|Form tracks portal movement as a core data stream. When a prospect enters the portal, their P.A.I. composite scores are recalculated against new competitive contexts. Market size changes, conference affiliation shifts, and collective strength at the destination school all factor into updated NIL projections.\n\nThe Transfer Portal isn\'t just about where you play — it\'s about what your brand is worth when you get there.',
      color: 'blue',
      icon: 'portal',
    },
    {
      id: 'revenue-sharing',
      title: 'Revenue Sharing',
      subtitle: 'The next frontier: schools paying athletes directly.',
      content:
        'Revenue sharing is the evolution of NIL that many predicted and few were ready for. Starting with the House v. NCAA settlement, schools can now share a portion of their athletic revenue directly with athletes.\n\nThis changes the equation fundamentally. NIL was always third-party money — brands, collectives, donors paying athletes for their name and likeness. Revenue sharing is institutional money — the school itself compensating athletes from media rights, ticket sales, and licensing revenue.\n\nThe two systems coexist. An athlete can earn revenue share from their school AND maintain independent NIL deals. But the dynamics shift. Schools with larger revenue pools can offer more competitive revenue sharing, potentially reducing the outsized influence of collectives at certain programs.\n\nRevenue sharing also introduces new compliance complexity. How is the money allocated? Is it per-sport, per-roster-spot, or performance-based? What happens to Olympic sports athletes? How do Title IX requirements apply?\n\nPer|Form models revenue sharing alongside traditional NIL valuation. The P.A.I. formula evaluates an athlete\'s total compensation potential — combining projected revenue share with independent NIL deal capacity. This gives athletes and their advisors a complete picture of what a school is worth, not just what a collective is offering.\n\nThe era of athletes as employees of their universities has effectively begun. Understanding revenue sharing is no longer optional — it\'s essential.',
      color: 'emerald',
      icon: 'revenue',
    },
    {
      id: 'perform-connection',
      title: 'Per|Form & N.I.L.',
      subtitle: 'Where scouting intelligence meets brand value.',
      content:
        'Per|Form\'s autonomous scouting pipeline doesn\'t just evaluate athletic talent — it builds the data foundation that informs NIL valuation.\n\nThe P.A.I. formula — Score = (P × 0.40) + (A × 0.30) + (I × 0.30) — is the engine. Performance data is sourced through Firecrawl, pulling stats from MaxPreps and ESPN. Athleticism is measured via SAM 2 on Vertex AI, analyzing speed bursts and separation distance from actual game film. Intangibles are gathered via Brave Search, analyzing news coverage, leadership signals, captaincy history, and existing NIL deals.\n\nThe Scout Hub runs adversarial analysis with opposing evaluation stances — one argues the prospect is UNDERRATED (NIL value suppressed relative to ability), the other argues OVERRATED (current deals exceed sustainable value). The system mediates the debate, runs the P.A.I. formula, and assigns the final composite score and tier.\n\nA score of 101+ flags a generational talent (PRIME PLAYER). 90-100 is A+ (Elite Prospect). 80-89 is A (Starter Potential). The tiers map directly to NIL valuation brackets — brands and collectives reference Per|Form grades when sizing deals.\n\nPer|Form positions A.I.M.S. as the bridge between raw talent evaluation and NIL market intelligence — giving athletes, agents, and collectives the data they need to make informed decisions.',
      color: 'amber',
      icon: 'bridge',
    },
  ],

  timeline: [
    {
      year: 2009,
      event: 'O\'Bannon v. NCAA filed',
      significance: 'Former UCLA basketball player Ed O\'Bannon sues the NCAA over use of athletes\' likenesses in video games without compensation.',
    },
    {
      year: 2014,
      event: 'O\'Bannon v. NCAA ruling',
      significance: 'Federal judge rules NCAA restrictions on athlete compensation violate antitrust law. The legal foundation for NIL begins.',
    },
    {
      year: 2019,
      month: 'September',
      event: 'California passes SB 206 (Fair Pay to Play Act)',
      significance: 'First state law allowing college athletes to earn NIL income. Takes effect January 2023, but the domino effect is immediate.',
    },
    {
      year: 2020,
      event: 'NCAA begins NIL rule development',
      significance: 'Facing pressure from state legislatures and Congress, the NCAA starts drafting interim NIL policies.',
    },
    {
      year: 2021,
      month: 'June',
      event: 'NCAA v. Alston — Supreme Court rules 9-0',
      significance: 'The Supreme Court unanimously rules the NCAA cannot restrict education-related benefits. Justice Kavanaugh\'s concurrence signals broader NIL rights are inevitable.',
    },
    {
      year: 2021,
      month: 'July',
      event: 'NCAA interim NIL policy takes effect',
      significance: 'On July 1, 2021, college athletes across the country can officially monetize their name, image, and likeness. The NIL era begins.',
    },
    {
      year: 2022,
      event: 'Collectives emerge and scale',
      significance: 'Booster-funded NIL collectives become the primary vehicle for athlete compensation at major programs. Controversy follows.',
    },
    {
      year: 2023,
      event: 'NIL market matures',
      significance: 'Deal structures become more sophisticated. Valuation platforms emerge. Compliance enforcement tightens. The wild west starts to get organized.',
    },
    {
      year: 2024,
      event: 'House v. NCAA settlement proposed',
      significance: 'Landmark $2.8 billion settlement would allow schools to share revenue directly with athletes. If approved, it reshapes college athletics permanently.',
    },
    {
      year: 2025,
      event: 'Revenue sharing era begins',
      significance: 'Schools begin sharing revenue directly with athletes. NIL and revenue sharing coexist, creating a complex but more equitable compensation landscape.',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// N.I.L. Deal Archetypes
// ─────────────────────────────────────────────────────────────

export interface DealArchetype {
  id: string;
  name: string;
  description: string;
  valueRange: string;
  color: string;
  examples: string[];
  accessLevel: 'any' | 'mid-tier' | 'elite';
}

export const DEAL_ARCHETYPES: DealArchetype[] = [
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Paid posts, stories, reels, and content partnerships across platforms. The most accessible NIL category.',
    valueRange: '$50 – $50,000+ per post',
    color: 'purple',
    examples: ['Instagram sponsored post', 'TikTok brand partnership', 'YouTube product review', 'X/Twitter campaign'],
    accessLevel: 'any',
  },
  {
    id: 'endorsement',
    name: 'Brand Endorsement',
    description: 'Traditional sponsorship deals with brands for product promotion, ad campaigns, and ambassador roles.',
    valueRange: '$1,000 – $1,000,000+',
    color: 'gold',
    examples: ['National brand ambassador', 'Regional sponsor deal', 'Product line collaboration', 'TV/digital ad campaign'],
    accessLevel: 'mid-tier',
  },
  {
    id: 'appearance',
    name: 'Appearances',
    description: 'Paid in-person events: autograph signings, store openings, charity events, and speaking engagements.',
    valueRange: '$500 – $25,000+ per event',
    color: 'cyan',
    examples: ['Autograph signing', 'Store grand opening', 'Charity gala appearance', 'Corporate speaking event'],
    accessLevel: 'any',
  },
  {
    id: 'camps-clinics',
    name: 'Camps & Clinics',
    description: 'Hosting or coaching youth training sessions. Combines revenue with community impact.',
    valueRange: '$2,000 – $50,000+ per event',
    color: 'emerald',
    examples: ['Summer football camp', 'Position-specific clinic', 'Youth skills academy', 'Multi-sport training event'],
    accessLevel: 'any',
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    description: 'Custom-branded apparel, accessories, and products using the athlete\'s name and likeness.',
    valueRange: '$500 – $500,000+ annually',
    color: 'amber',
    examples: ['Custom jersey line', 'Branded apparel collection', 'Trading cards', 'Signature accessories'],
    accessLevel: 'mid-tier',
  },
  {
    id: 'licensing',
    name: 'Licensing',
    description: 'Granting rights to use name/image in video games, media, collectibles, and digital products.',
    valueRange: '$1,000 – $250,000+',
    color: 'blue',
    examples: ['EA Sports College Football', 'Trading card licensing', 'Digital collectibles', 'Documentary features'],
    accessLevel: 'mid-tier',
  },
  {
    id: 'collective',
    name: 'Collective Deals',
    description: 'Arrangements through school-affiliated collectives distributing pooled donor funds as NIL compensation.',
    valueRange: '$5,000 – $2,000,000+ annually',
    color: 'red',
    examples: ['Booster collective monthly stipend', 'Collective community service deal', 'Group licensing arrangement', 'Collective media package'],
    accessLevel: 'elite',
  },
];

// ─────────────────────────────────────────────────────────────
// N.I.L. Valuation Factors
// ─────────────────────────────────────────────────────────────

export interface ValuationFactor {
  id: string;
  name: string;
  weight: number;
  description: string;
  metrics: string[];
  color: string;
}

export const VALUATION_FACTORS: ValuationFactor[] = [
  {
    id: 'performance',
    name: 'On-Field Performance',
    weight: 0.30,
    description: 'Statistical production, awards, and competitive results. The athletic foundation of NIL value.',
    metrics: ['Season stats', 'Awards & honors', 'All-conference/All-American selections', 'Win-loss contribution'],
    color: 'amber',
  },
  {
    id: 'social-reach',
    name: 'Social Media Reach',
    weight: 0.25,
    description: 'Total following, engagement rates, and content quality across platforms.',
    metrics: ['Total followers (all platforms)', 'Engagement rate', 'Content frequency', 'Platform diversity'],
    color: 'purple',
  },
  {
    id: 'market-size',
    name: 'Market Size',
    weight: 0.15,
    description: 'The media market, conference affiliation, and fanbase size of the athlete\'s school.',
    metrics: ['DMA ranking', 'Conference media deal value', 'School brand strength', 'Local business density'],
    color: 'cyan',
  },
  {
    id: 'position-sport',
    name: 'Position & Sport',
    weight: 0.15,
    description: 'Revenue sport status and position visibility. QBs command premiums; linemen work harder for deals.',
    metrics: ['Sport revenue tier', 'Position visibility ranking', 'National TV exposure', 'Highlight potential'],
    color: 'emerald',
  },
  {
    id: 'brand-character',
    name: 'Brand & Character',
    weight: 0.10,
    description: 'Personal reputation, community involvement, and alignment with brand values.',
    metrics: ['Public perception', 'Community engagement', 'Academic standing', 'Media savvy'],
    color: 'gold',
  },
  {
    id: 'team-success',
    name: 'Team Success',
    weight: 0.05,
    description: 'Winning drives eyeballs. Playoff runs and championships multiply individual NIL value.',
    metrics: ['Team ranking', 'Playoff/bowl appearances', 'Championship contention', 'National media moments'],
    color: 'red',
  },
];

// ─────────────────────────────────────────────────────────────
// N.I.L. Tiers — Athlete Value Brackets
// ─────────────────────────────────────────────────────────────

export interface NILTier {
  id: string;
  name: string;
  range: string;
  description: string;
  color: string;
  archetype: string;
  prevalence: string;
}

export const NIL_TIERS: NILTier[] = [
  {
    id: 'generational',
    name: 'Generational',
    range: '$2M+',
    description: 'Household names. National brand ambassadors. Multi-platform deals with Fortune 500 companies. These athletes transcend their sport.',
    color: 'gold',
    archetype: 'Heisman-caliber QB, viral sensation, crossover star',
    prevalence: 'Top 0.1% — fewer than 20 athletes nationally',
  },
  {
    id: 'blue-chip',
    name: 'Blue Chip',
    range: '$500K – $2M',
    description: 'Conference stars with strong social presence. Multiple mid-to-large endorsement deals. Regional brand ambassadors with national visibility.',
    color: 'cyan',
    archetype: 'All-Conference starter, 500K+ social followers, top-25 program',
    prevalence: 'Top 1% — approximately 100-200 athletes',
  },
  {
    id: 'starter',
    name: 'Starter',
    range: '$100K – $500K',
    description: 'Established starters at Power 4 programs with solid social engagement. Mix of collective support and independent deals.',
    color: 'emerald',
    archetype: 'P4 starter, 100K+ followers, local market presence',
    prevalence: 'Top 5% — approximately 500-1,000 athletes',
  },
  {
    id: 'contributor',
    name: 'Contributor',
    range: '$10K – $100K',
    description: 'Rotational players, Group of 5 standouts, and athletes with niche but engaged followings. Local business partnerships and collective baseline deals.',
    color: 'purple',
    archetype: 'Rotational P4 or G5 starter, 10K-100K followers, local deals',
    prevalence: 'Top 20% — several thousand athletes',
  },
  {
    id: 'emerging',
    name: 'Emerging',
    range: '$1K – $10K',
    description: 'Walk-ons, freshmen, and athletes in Olympic sports building their brand. Social media monetization, camps, and small local deals.',
    color: 'amber',
    archetype: 'Any athlete with initiative, content skills, and local presence',
    prevalence: 'Available to any athlete willing to build',
  },
];

// ─────────────────────────────────────────────────────────────
// Position Group NIL Dynamics
// ─────────────────────────────────────────────────────────────

export interface PositionNILProfile {
  position: string;
  sport: string;
  nilPotential: 'elite' | 'high' | 'moderate' | 'developing';
  valueDiver: string;
  challenge: string;
  color: string;
}

// ─────────────────────────────────────────────────────────────
// P.A.I. Formula — The Per|Form Grading Algorithm
// Derived from "Mastering the N.I.L." methodology
// ─────────────────────────────────────────────────────────────

export interface PAIFormulaComponent {
  variable: string;
  name: string;
  sourceAgent: string;
  dataSource: string;
  description: string;
  color: string;
}

export interface PAITier {
  scoreRange: string;
  label: string;
  grade: string;
  color: string;
}

export interface PAIFormula {
  name: string;
  description: string;
  components: PAIFormulaComponent[];
  tiers: PAITier[];
}

export const PAI_FORMULA: PAIFormula = {
  name: 'P.A.I. Composite Score',
  // PROPRIETARY: Formula weights are confidential — only component names and descriptions are public
  description:
    'The Per|Form grading algorithm produces a Composite Score (0-100+) using three proprietary-weighted components. Each component is sourced by a specialized pipeline stage in the Per|Form scouting system. The formula is rooted in the methodology from "Mastering the N.I.L." and drives all prospect evaluation, NIL valuation, and content generation.',
  components: [
    {
      variable: 'P',
      name: 'Game Performance',
      sourceAgent: 'Adversarial Evaluation Pipeline',
      dataSource: 'Firecrawl (MaxPreps, ESPN, 247Sports)',
      description:
        'Statistical production normalized to a 0-100 scale. Yards, touchdowns, completion percentage, tackles, sacks — the numbers that define what a player does on the field. The pipeline runs adversarial analysis: one evaluator argues UNDERRATED, the other argues OVERRATED. Both cite stats with confidence scores.',
      color: 'amber',
    },
    {
      variable: 'A',
      name: 'Athleticism',
      sourceAgent: 'SAM 2 Video Analysis',
      dataSource: 'Vertex AI on NVIDIA Tesla T4',
      description:
        'Measurable athletic traits extracted from actual game film. SAM 2 segments the player in video and calculates speed bursts, separation distance from defenders, route sharpness, and play recognition. Separation > 3.0 yards and burst speed > 20 mph are key thresholds.',
      color: 'cyan',
    },
    {
      variable: 'I',
      name: 'Intangibles',
      sourceAgent: 'Enrichment Pipeline',
      dataSource: 'Brave Search (news, interviews, social media)',
      description:
        'Leadership, character, and off-field factors that shape an athlete\'s brand and ceiling. Sourced from news coverage sentiment, captaincy history, community involvement, existing NIL deals, and interview presence. The system mediates the adversarial debate and finalizes the composite score.',
      color: 'emerald',
    },
  ],
  tiers: [
    { scoreRange: '101+', label: 'PRIME PLAYER', grade: 'Generational Talent', color: 'gold' },
    { scoreRange: '90 – 100', label: 'A+', grade: 'Elite Prospect', color: 'amber' },
    { scoreRange: '80 – 89', label: 'A', grade: 'Starter Potential', color: 'cyan' },
    { scoreRange: '70 – 79', label: 'B+', grade: 'High-Upside Prospect', color: 'emerald' },
    { scoreRange: '60 – 69', label: 'B', grade: 'Solid Contributor', color: 'purple' },
    { scoreRange: '50 – 59', label: 'C+', grade: 'Developmental', color: 'blue' },
    { scoreRange: 'Below 50', label: 'C', grade: 'Project', color: 'zinc' },
  ],
};

// ─────────────────────────────────────────────────────────────
// Position Group NIL Dynamics
// ─────────────────────────────────────────────────────────────

export const POSITION_NIL_PROFILES: PositionNILProfile[] = [
  {
    position: 'Quarterback',
    sport: 'Football',
    nilPotential: 'elite',
    valueDiver: 'Maximum visibility, face-of-program status, and national media exposure drive premium valuations.',
    challenge: 'Intense scrutiny. Performance slumps tank value fast. Transfer portal creates musical chairs.',
    color: 'gold',
  },
  {
    position: 'Wide Receiver / Running Back',
    sport: 'Football',
    nilPotential: 'high',
    valueDiver: 'Highlight-reel plays generate viral moments. Skill position athletes are naturally marketable.',
    challenge: 'Dependent on QB play and offensive system. Crowded position room limits individual breakout.',
    color: 'cyan',
  },
  {
    position: 'Offensive / Defensive Line',
    sport: 'Football',
    nilPotential: 'moderate',
    valueDiver: 'Increasingly valued by collectives who understand their on-field impact. Personality-driven deals.',
    challenge: 'Low individual visibility. Stats don\'t tell the story. Requires creative personal branding.',
    color: 'emerald',
  },
  {
    position: 'Point Guard',
    sport: 'Basketball',
    nilPotential: 'elite',
    valueDiver: 'Ball-in-hands role, national TV exposure during March Madness, and crossover appeal.',
    challenge: 'Shorter college careers (one-and-done). NIL window is compressed.',
    color: 'purple',
  },
  {
    position: 'Gymnast / Swimmer / Track',
    sport: 'Olympic Sports',
    nilPotential: 'developing',
    valueDiver: 'Social media savvy athletes in Olympic sports can build massive followings that outpace revenue-sport peers.',
    challenge: 'Smaller built-in fanbase. Requires entrepreneurial mindset and strong content creation skills.',
    color: 'amber',
  },
];
