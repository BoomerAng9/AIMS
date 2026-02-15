/**
 * ACHEEVY Revenue Verticals — 10 Upgraded Definitions
 *
 * Each vertical defines BOTH:
 *   Phase A: Conversational chain (NLP trigger → collect requirements)
 *   Phase B: Execution blueprint (R-R-S → governance → agents → artifacts)
 *
 * Upgraded from aims-skills/skills/scale-with-acheevy/index.ts
 * which had prompt-only verticals with no downstream execution.
 *
 * The step_generation_prompt is the key R-R-S mechanism:
 *   - Receives SPECIFIC user data collected during Phase A
 *   - Instructs LLM to generate step descriptions containing STEP_AGENT_MAP keywords
 *   - Keywords ensure Chicken Hawk routes each step to the right Boomer_Ang
 *
 * STEP_AGENT_MAP keyword routing:
 *   scaffold/generate/implement → engineer-ang
 *   brand/campaign/copy/content → marketer-ang
 *   research/analyze/market/data → analyst-ang
 *   verify/audit/test/security   → quality-ang
 *   deploy                       → engineer-ang
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import type { VerticalDefinition } from './types';

// ---------------------------------------------------------------------------
// 10 Revenue Verticals
// ---------------------------------------------------------------------------

export const VERTICALS: Record<string, VerticalDefinition> = {

  // ── 1. IDEA GENERATOR ────────────────────────────────────────────────────

  'idea-generator': {
    id: 'idea-generator',
    name: 'Business Idea Generator',
    category: 'ideation',
    tags: ['business', 'startup', 'ideas', 'brainstorm', 'entrepreneur'],
    triggers: [
      /business\s*ideas?/i,
      /startup\s*ideas?/i,
      /what\s*should\s*i\s*build/i,
      /suggest.*ideas/i,
      /start(ing)?\s*(a|my)?\s*business/i,
      /entrepreneur/i,
      /side\s*hustle/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Capture Vision',
        purpose: 'Understand what the user wants to build and for whom',
        acheevy_behavior: 'Ask: "What problem do you want to solve? And who has this problem the most?"',
        output_schema: { problem_space: 'string', target_demographic: 'string' },
      },
      {
        step: 2,
        name: 'Skills & Assets Audit',
        purpose: 'Identify the user\'s unique advantages',
        acheevy_behavior: 'Ask: "What skills, experience, or access do YOU have that most people don\'t? This is your unfair advantage."',
        output_schema: { skills: 'string[]', unfair_advantage: 'string' },
      },
      {
        step: 3,
        name: 'Market Opportunity',
        purpose: 'Validate there\'s money in the problem space',
        acheevy_behavior: 'Present 3 specific market opportunities based on their skills + problem space. For each: name it, size it, show who\'s paying today.',
        output_schema: { opportunities: 'string[]', selected_opportunity: 'string' },
      },
      {
        step: 4,
        name: 'Expert Perspective',
        purpose: 'Channel an industry expert for contrarian insight',
        acheevy_behavior: 'Channel the matched digital twin. Give ONE contrarian insight, ONE tactical step, ONE warning.',
        output_schema: { expert_insight: 'string', confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'business-builder',
    expert_domain: ['ideation', 'research'],

    execution: {
      primary_agent: 'analyst-ang',
      step_generation_prompt: `
Generate a research and validation pipeline for a business idea:
Problem space: {problem_space}
Target demographic: {target_demographic}
User's unfair advantage: {unfair_advantage}
Selected opportunity: {selected_opportunity}

Generate 5-7 step descriptions. Each step MUST contain one of these keywords
so the pipeline router can assign the right specialist:
- "research" or "analyze" for market research and data gathering
- "content" or "copy" for marketing materials
- "scaffold" or "generate" for any technical prototyping
- "verify" or "audit" for validation checks

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['problem_space', 'target_demographic', 'unfair_advantage', 'selected_opportunity'],
      fallback_steps: [
        'Research the target market size, growth trends, and competitor landscape',
        'Analyze the top 5 competitors in this space and identify gaps',
        'Generate a detailed customer persona based on the target demographic',
        'Research pricing models and revenue strategies used by similar businesses',
        'Generate a one-page business model canvas summary',
        'Verify market assumptions with data-backed validation checks',
      ],
      requires_verification: true,
      max_steps: 8,
    },

    revenue_signal: {
      service: 'Research Lab (Analyst_Ang + market validation)',
      transition_prompt: 'Ready to validate this idea? I can run a full market analysis, build your competitor map, and generate your business model — right now.',
    },
  },

  // ── 2. PAIN POINTS ANALYZER ──────────────────────────────────────────────

  'pain-points': {
    id: 'pain-points',
    name: 'Pain Points Deep Dive',
    category: 'research',
    tags: ['pain points', 'customer', 'problems', 'market gaps', 'frustrations'],
    triggers: [
      /pain\s*points?/i,
      /problems?\s*in/i,
      /market\s*gaps?/i,
      /customer\s*frustrations?/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Industry Focus',
        purpose: 'Nail down the specific industry/niche',
        acheevy_behavior: 'Ask: "What industry are we looking at? Be specific — not just \'tech\' but \'B2B SaaS for dentists\' or \'DTC pet food\'."',
        output_schema: { industry: 'string', niche: 'string' },
      },
      {
        step: 2,
        name: 'Customer Segment',
        purpose: 'Who specifically experiences these problems?',
        acheevy_behavior: 'Ask: "Who in this industry has the WORST experience? The person who loses the most time/money/sanity? That\'s your entry point."',
        output_schema: { customer_segment: 'string', worst_pain: 'string' },
      },
      {
        step: 3,
        name: 'Current Solutions Audit',
        purpose: 'What solutions exist and where they fail',
        acheevy_behavior: 'Present 3 current solutions people use. For each: what it does, how much it costs, and where it fails spectacularly.',
        output_schema: { current_solutions: 'string[]', failure_points: 'string[]' },
      },
      {
        step: 4,
        name: 'Expert Perspective',
        purpose: 'Industry expert contrarian view on the opportunity',
        acheevy_behavior: 'Channel the matched digital twin. Expose the hidden pain point nobody is talking about.',
        output_schema: { expert_insight: 'string', confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'business-builder',
    expert_domain: ['research', 'ideation'],

    execution: {
      primary_agent: 'analyst-ang',
      step_generation_prompt: `
Generate a pain point analysis pipeline for:
Industry: {industry}
Niche: {niche}
Customer segment: {customer_segment}
Worst pain identified: {worst_pain}
Current solutions failing: {failure_points}

Generate 5-7 step descriptions. Keywords for routing:
- "research" or "analyze" for data gathering and market analysis
- "data" for quantitative analysis
- "content" for report generation
- "verify" for assumption validation

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['industry', 'niche', 'customer_segment', 'worst_pain', 'failure_points'],
      fallback_steps: [
        'Research the competitive landscape and analyze existing solutions in this niche',
        'Analyze customer reviews and complaints for the top 5 existing products',
        'Research quantitative data on market pain point frequency and severity',
        'Generate a detailed pain point priority matrix with opportunity scores',
        'Analyze adjacent industries for transferred solutions',
        'Verify findings with cross-referenced data sources',
      ],
      requires_verification: true,
      max_steps: 8,
    },

    revenue_signal: {
      service: 'Research Lab (Analyst_Ang + competitive intelligence)',
      transition_prompt: 'Want me to run the full analysis? I\'ll map every competitor, quantify the pain, and show you the gap nobody is filling.',
    },
  },

  // ── 3. BRAND NAME GENERATOR ──────────────────────────────────────────────

  'brand-name': {
    id: 'brand-name',
    name: 'Brand Name Generator',
    category: 'branding',
    tags: ['brand', 'naming', 'company name', 'identity', 'logo'],
    triggers: [
      /brand\s*name/i,
      /company\s*name/i,
      /what\s*to\s*call/i,
      /name.*business/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Brand DNA',
        purpose: 'Understand what the brand represents',
        acheevy_behavior: 'Ask: "What does your brand stand for in ONE sentence? Not what it does — what it MEANS. Nike doesn\'t sell shoes, they sell victory."',
        output_schema: { brand_essence: 'string', industry: 'string' },
      },
      {
        step: 2,
        name: 'Audience & Tone',
        purpose: 'Who the brand speaks to and how',
        acheevy_behavior: 'Ask: "Who\'s your audience, and should the brand feel premium, playful, technical, or edgy? Give me a vibe."',
        output_schema: { target_audience: 'string', brand_tone: 'string' },
      },
      {
        step: 3,
        name: 'Competitive Positioning',
        purpose: 'Where the brand sits relative to competitors',
        acheevy_behavior: 'Present 3 naming approaches: descriptive (Blue Apron), invented (Spotify), metaphorical (Amazon). Which feels right?',
        output_schema: { naming_style: 'string', avoid_words: 'string[]' },
      },
      {
        step: 4,
        name: 'Expert Perspective',
        purpose: 'Branding expert insight on naming strategy',
        acheevy_behavior: 'Channel the matched digital twin. Critique the naming direction. Push for something unforgettable.',
        output_schema: { expert_insight: 'string', confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'business-builder',
    expert_domain: ['branding', 'marketing'],

    execution: {
      primary_agent: 'marketer-ang',
      step_generation_prompt: `
Generate a brand naming and identity pipeline for:
Brand essence: {brand_essence}
Industry: {industry}
Target audience: {target_audience}
Brand tone: {brand_tone}
Naming style: {naming_style}
Words to avoid: {avoid_words}

Generate 5-7 step descriptions. Keywords for routing:
- "brand" or "content" or "copy" for brand identity work
- "research" for competitor naming analysis
- "generate" for creative asset generation
- "verify" for trademark/domain availability checks

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['brand_essence', 'industry', 'target_audience', 'brand_tone', 'naming_style'],
      fallback_steps: [
        'Research competitor brand names and identify naming patterns in the industry',
        'Generate 10 brand name candidates using the selected naming style',
        'Create brand copy: tagline, mission statement, and elevator pitch for each top candidate',
        'Research domain availability and social handle availability for top 5 names',
        'Generate a brand voice guide with tone, vocabulary, and communication do\'s and don\'ts',
        'Verify brand names against trademark databases and competitor conflicts',
      ],
      requires_verification: true,
      max_steps: 8,
    },

    revenue_signal: {
      service: 'Brand Factory (Marketer_Ang + identity package)',
      transition_prompt: 'Ready to build this brand? I\'ll generate names, check domains, create your brand guide, and deliver a full identity package.',
    },
  },

  // ── 4. VALUE PROPOSITION BUILDER ─────────────────────────────────────────

  'value-prop': {
    id: 'value-prop',
    name: 'Value Proposition Builder',
    category: 'marketing',
    tags: ['value proposition', 'USP', 'positioning', 'messaging', 'unique selling'],
    triggers: [
      /value\s*proposition/i,
      /why\s*us/i,
      /unique\s*selling/i,
      /usp/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'The Offer',
        purpose: 'Define what you\'re selling',
        acheevy_behavior: 'Ask: "What\'s the offer? Not the product — the TRANSFORMATION. What does your customer\'s life look like AFTER using this?"',
        output_schema: { offer: 'string', transformation: 'string' },
      },
      {
        step: 2,
        name: 'The Alternative',
        purpose: 'What happens if they don\'t buy',
        acheevy_behavior: 'Ask: "What\'s the alternative to your product? What do people do TODAY to solve this problem — and why does it suck?"',
        output_schema: { alternative: 'string', alternative_pain: 'string' },
      },
      {
        step: 3,
        name: 'The Proof',
        purpose: 'Why should they believe you',
        acheevy_behavior: 'Ask: "What proof do you have? Numbers, testimonials, case studies, demo results — anything that proves this works."',
        output_schema: { proof_points: 'string[]', social_proof: 'string' },
      },
      {
        step: 4,
        name: 'Expert Perspective',
        purpose: 'Marketing expert perspective on positioning',
        acheevy_behavior: 'Channel the matched digital twin. Sharpen the value prop to be undeniable.',
        output_schema: { expert_insight: 'string', confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'business-builder',
    expert_domain: ['marketing', 'branding'],

    execution: {
      primary_agent: 'marketer-ang',
      step_generation_prompt: `
Generate a value proposition and messaging pipeline for:
The offer: {offer}
Transformation: {transformation}
Alternative (what they do today): {alternative}
Why alternative sucks: {alternative_pain}
Proof points: {proof_points}

Generate 5-7 step descriptions. Keywords for routing:
- "copy" or "content" for messaging and copywriting
- "research" for competitive positioning analysis
- "campaign" for ad copy and landing page content
- "verify" for message testing frameworks

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['offer', 'transformation', 'alternative', 'alternative_pain', 'proof_points'],
      fallback_steps: [
        'Research competitor value propositions and messaging in this market',
        'Generate the core value proposition in 3 formats: one-sentence, elevator pitch, and full-page copy',
        'Create landing page copy with headline, subhead, benefits, and CTA',
        'Generate email sequence copy for lead nurturing (3 emails)',
        'Create ad copy variants for social media campaigns',
        'Verify messaging resonance with target audience framework analysis',
      ],
      requires_verification: true,
      max_steps: 8,
    },

    revenue_signal: {
      service: 'Copy Lab (Marketer_Ang + messaging package)',
      transition_prompt: 'Ready to craft your messaging? I\'ll build your value prop, landing page copy, email sequences, and ad copy — all ready to deploy.',
    },
  },

  // ── 5. MVP LAUNCH PLAN ──────────────────────────────────────────────────

  'mvp-plan': {
    id: 'mvp-plan',
    name: 'MVP Launch Plan',
    category: 'engineering',
    tags: ['mvp', 'launch', 'build', 'startup', 'first steps', 'minimum viable'],
    triggers: [
      /mvp/i,
      /launch\s*plan/i,
      /get\s*started/i,
      /first\s*steps?/i,
      /minimum\s*viable/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Capture Vision',
        purpose: 'Get the core product vision',
        acheevy_behavior: 'Ask: "What does your product DO in one sentence? Who is it for?"',
        output_schema: { product_vision: 'string', target_user: 'string' },
      },
      {
        step: 2,
        name: 'Feature Prioritization',
        purpose: 'Identify MVP-critical features',
        acheevy_behavior: 'List features. For each: "Is this day-1 essential or nice-to-have?" Be ruthless. Ship small.',
        output_schema: { must_have: 'string[]', nice_to_have: 'string[]' },
      },
      {
        step: 3,
        name: 'Tech Stack Decision',
        purpose: 'Recommend stack based on requirements',
        acheevy_behavior: 'Based on features, recommend tech stack. Be specific: "React + Node + Postgres". No hand-waving.',
        output_schema: { frontend: 'string', backend: 'string', database: 'string', hosting: 'string' },
      },
      {
        step: 4,
        name: 'Launch Readiness',
        purpose: 'Confirm and prepare for execution',
        acheevy_behavior: 'Summarize the plan. "Ready to build this? I can scaffold the entire project right now."',
        output_schema: { confirmed: 'boolean', timeline: 'string' },
      },
    ],

    acheevy_mode: 'business-builder',
    expert_domain: ['engineering', 'ideation'],

    execution: {
      primary_agent: 'chicken-hawk',
      step_generation_prompt: `
Generate a build pipeline for an MVP with these specs:
Product: {product_vision}
Target: {target_user}
Must-have features: {must_have}
Stack: {frontend} + {backend} + {database}
Hosting: {hosting}

Generate 6-9 step descriptions. Each step MUST contain one of these keywords
so the pipeline router can assign the right specialist:
- "scaffold" or "generate" or "implement" for engineering work
- "deploy" for deployment
- "test" or "verify" for quality checks
- "content" or "copy" for marketing assets
- "research" or "analyze" for research tasks

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['product_vision', 'target_user', 'must_have', 'frontend', 'backend', 'database'],
      fallback_steps: [
        'Scaffold project structure with React frontend and Node.js backend',
        'Generate database schema and migration files for core features',
        'Implement core API endpoints for must-have features',
        'Generate component tree for user-facing pages',
        'Implement authentication and user management',
        'Apply responsive styling and UX patterns',
        'Deploy to staging environment with Docker',
        'Run ORACLE security and quality verification',
      ],
      requires_verification: true,
      max_steps: 10,
    },

    revenue_signal: {
      service: 'Plug Factory (Engineer_Ang + Chicken Hawk deploy)',
      transition_prompt: 'Ready to build this? I can scaffold the entire project, generate the code, and deploy a staging environment right now.',
    },
  },

  // ── 6. CUSTOMER PERSONA BUILDER ──────────────────────────────────────────

  'persona': {
    id: 'persona',
    name: 'Customer Persona Builder',
    category: 'research',
    tags: ['customer persona', 'buyer persona', 'target customer', 'ideal customer', 'audience'],
    triggers: [
      /target\s*customer/i,
      /who\s*buys/i,
      /ideal\s*customer/i,
      /customer\s*persona/i,
      /buyer\s*persona/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Product Context',
        purpose: 'What are you selling and to whom',
        acheevy_behavior: 'Ask: "What\'s the product/service, and who do you THINK your ideal customer is? Give me demographics, psychographics, anything."',
        output_schema: { product: 'string', assumed_customer: 'string' },
      },
      {
        step: 2,
        name: 'Behavioral Deep Dive',
        purpose: 'How does this customer actually behave',
        acheevy_behavior: 'Ask: "Where does this person hang out online? What do they search for? What keeps them up at night?"',
        output_schema: { online_behavior: 'string', pain_triggers: 'string[]' },
      },
      {
        step: 3,
        name: 'Purchase Psychology',
        purpose: 'What drives their buying decisions',
        acheevy_behavior: 'Ask: "What objections would they have? What would make them say YES instantly? What\'s their budget reality?"',
        output_schema: { objections: 'string[]', instant_yes: 'string', budget_range: 'string' },
      },
      {
        step: 4,
        name: 'Expert Perspective',
        purpose: 'Expert challenge of assumptions',
        acheevy_behavior: 'Channel the matched digital twin. Challenge the assumed customer. Is there a BETTER customer hiding?',
        output_schema: { expert_insight: 'string', confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'growth-mode',
    expert_domain: ['research', 'marketing'],

    execution: {
      primary_agent: 'analyst-ang',
      step_generation_prompt: `
Generate a customer persona research pipeline for:
Product: {product}
Assumed customer: {assumed_customer}
Online behavior: {online_behavior}
Pain triggers: {pain_triggers}
Key objections: {objections}
Budget range: {budget_range}

Generate 5-7 step descriptions. Keywords for routing:
- "research" or "analyze" for customer research
- "data" for quantitative persona building
- "content" or "copy" for persona documentation
- "verify" for persona validation

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['product', 'assumed_customer', 'online_behavior', 'pain_triggers', 'objections', 'budget_range'],
      fallback_steps: [
        'Research demographic and psychographic data for the target customer segment',
        'Analyze online behavior patterns, platforms, and content consumption',
        'Research purchase decision triggers and objection patterns',
        'Generate 3 detailed customer personas with names, stories, and buying journeys',
        'Create a customer journey map for the primary persona',
        'Verify persona accuracy against available market data',
      ],
      requires_verification: true,
      max_steps: 8,
    },

    revenue_signal: {
      service: 'Research Lab (Analyst_Ang + persona package)',
      transition_prompt: 'Want me to build the full persona package? I\'ll generate detailed profiles, journey maps, and targeting recommendations.',
    },
  },

  // ── 7. SOCIAL LAUNCH CAMPAIGN ────────────────────────────────────────────

  'social-hooks': {
    id: 'social-hooks',
    name: 'Social Launch Campaign',
    category: 'marketing',
    tags: ['social media', 'launch', 'twitter', 'x', 'hooks', 'viral', 'announce'],
    triggers: [
      /launch\s*tweet/i,
      /social\s*post/i,
      /announce/i,
      /twitter\s*hook/i,
      /x\s*hook/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Launch Context',
        purpose: 'What\'s being launched and where',
        acheevy_behavior: 'Ask: "What are you launching, on which platforms, and what\'s the ONE thing you want people to remember?"',
        output_schema: { product: 'string', platforms: 'string[]', core_message: 'string' },
      },
      {
        step: 2,
        name: 'Audience & Angle',
        purpose: 'Who to target and what angle to take',
        acheevy_behavior: 'Ask: "Who needs to see this FIRST? And should we lead with controversy, story, value, or social proof?"',
        output_schema: { target_audience: 'string', angle: 'string' },
      },
      {
        step: 3,
        name: 'Content Strategy',
        purpose: 'Plan the content sequence',
        acheevy_behavior: 'Present a 7-day launch sequence: pre-launch tease, launch day, follow-up. Show the cadence.',
        output_schema: { content_sequence: 'string[]', launch_date: 'string' },
      },
      {
        step: 4,
        name: 'Expert Perspective',
        purpose: 'Social media expert review',
        acheevy_behavior: 'Channel the matched digital twin. Critique the launch plan. What would go viral vs. what would flop?',
        output_schema: { expert_insight: 'string', confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'business-builder',
    expert_domain: ['marketing', 'branding'],

    execution: {
      primary_agent: 'marketer-ang',
      step_generation_prompt: `
Generate a social media launch campaign pipeline for:
Product: {product}
Platforms: {platforms}
Core message: {core_message}
Target audience: {target_audience}
Angle: {angle}
Content sequence: {content_sequence}

Generate 5-7 step descriptions. Keywords for routing:
- "content" or "copy" for social media content creation
- "campaign" for campaign strategy and scheduling
- "seo" for hashtag and discovery optimization
- "research" for audience analysis
- "verify" for content compliance checks

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['product', 'platforms', 'core_message', 'target_audience', 'angle'],
      fallback_steps: [
        'Research trending hashtags and optimal posting times for target platforms',
        'Generate 10 hook variants for the launch announcement post',
        'Create a 7-day content calendar with daily post copy and visual descriptions',
        'Generate campaign copy for paid social ads (3 variants)',
        'Create an SEO-optimized launch blog post for organic discovery',
        'Verify all content against platform guidelines and brand voice',
      ],
      requires_verification: true,
      max_steps: 8,
    },

    revenue_signal: {
      service: 'Content Lab (Marketer_Ang + social package)',
      transition_prompt: 'Ready to launch? I\'ll generate all the content, schedule the sequence, and build your ad copy — let\'s go viral.',
    },
  },

  // ── 8. COLD OUTREACH ENGINE ──────────────────────────────────────────────

  'cold-outreach': {
    id: 'cold-outreach',
    name: 'Cold Outreach Engine',
    category: 'marketing',
    tags: ['cold email', 'outreach', 'pitch', 'sales', 'lead generation'],
    triggers: [
      /cold\s*email/i,
      /outreach/i,
      /pitch\s*email/i,
      /reach\s*out/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Target Definition',
        purpose: 'Who are you reaching out to',
        acheevy_behavior: 'Ask: "Who\'s the target? Job title, company size, industry. Be specific — \'VP of Marketing at mid-market SaaS companies ($5M-$50M ARR)\'."',
        output_schema: { target_role: 'string', company_profile: 'string' },
      },
      {
        step: 2,
        name: 'The Hook',
        purpose: 'Why should they open your email',
        acheevy_behavior: 'Ask: "What\'s the result you deliver? Not features — RESULTS. \'We helped [similar company] increase pipeline by 40% in 60 days.\'"',
        output_schema: { result_statement: 'string', proof: 'string' },
      },
      {
        step: 3,
        name: 'Sequence Design',
        purpose: 'Map the multi-touch outreach sequence',
        acheevy_behavior: 'Design the sequence: Email 1 (cold open), Email 2 (follow-up), Email 3 (breakup). Plus LinkedIn touchpoints.',
        output_schema: { sequence_length: 'number', channels: 'string[]' },
      },
      {
        step: 4,
        name: 'Expert Perspective',
        purpose: 'Sales expert review of the approach',
        acheevy_behavior: 'Channel the matched digital twin. Critique the outreach approach. What gets replies vs. what gets deleted.',
        output_schema: { expert_insight: 'string', confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'business-builder',
    expert_domain: ['marketing', 'ideation'],

    execution: {
      primary_agent: 'marketer-ang',
      step_generation_prompt: `
Generate a cold outreach campaign pipeline for:
Target role: {target_role}
Company profile: {company_profile}
Result statement: {result_statement}
Proof/social proof: {proof}
Sequence length: {sequence_length} touches
Channels: {channels}

Generate 5-7 step descriptions. Keywords for routing:
- "copy" or "email" for email template writing
- "content" for LinkedIn message and social touchpoints
- "research" for prospect list criteria and ICP analysis
- "campaign" for sequence scheduling and automation
- "verify" for spam score and deliverability checks

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['target_role', 'company_profile', 'result_statement', 'proof', 'sequence_length', 'channels'],
      fallback_steps: [
        'Research the ideal customer profile and build prospect qualification criteria',
        'Generate cold email copy: initial outreach, follow-up, and breakup sequence',
        'Create LinkedIn connection request and message templates',
        'Generate email subject line variants for A/B testing',
        'Create a campaign automation setup guide with scheduling',
        'Verify email copy for spam trigger words and deliverability best practices',
      ],
      requires_verification: true,
      max_steps: 8,
    },

    revenue_signal: {
      service: 'Outreach Lab (Marketer_Ang + sales enablement)',
      transition_prompt: 'Ready to fill your pipeline? I\'ll generate the full outreach sequence, subject lines, LinkedIn messages, and A/B test variants.',
    },
  },

  // ── 9. TASK AUTOMATION BUILDER ───────────────────────────────────────────

  'automation': {
    id: 'automation',
    name: 'Task Automation Builder',
    category: 'automation',
    tags: ['automation', 'workflow', 'efficiency', 'streamline', 'repetitive'],
    triggers: [
      /automat/i,
      /save\s*time/i,
      /streamline/i,
      /repetitive\s*tasks?/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Workflow Audit',
        purpose: 'Identify what to automate',
        acheevy_behavior: 'Ask: "What tasks eat up your time every week? List the top 3 things you wish happened automatically."',
        output_schema: { repetitive_tasks: 'string[]', time_spent: 'string' },
      },
      {
        step: 2,
        name: 'Tool Ecosystem',
        purpose: 'Understand current tools',
        acheevy_behavior: 'Ask: "What tools do you already use? (Slack, Gmail, Sheets, Zapier, n8n, Notion, etc.) I\'ll build bridges between them."',
        output_schema: { current_tools: 'string[]', desired_integrations: 'string[]' },
      },
      {
        step: 3,
        name: 'Automation Design',
        purpose: 'Design the automation workflow',
        acheevy_behavior: 'Present the automation blueprint: trigger → action → result. Show time savings per week.',
        output_schema: { automations: 'string[]', estimated_savings: 'string' },
      },
      {
        step: 4,
        name: 'Expert Perspective',
        purpose: 'Automation expert review',
        acheevy_behavior: 'Channel the matched digital twin. Are there automations they missed? What breaks at scale?',
        output_schema: { expert_insight: 'string', confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'growth-mode',
    expert_domain: ['automation', 'engineering'],

    execution: {
      primary_agent: 'chicken-hawk',
      step_generation_prompt: `
Generate an automation build pipeline for:
Tasks to automate: {repetitive_tasks}
Current tools: {current_tools}
Desired integrations: {desired_integrations}
Automation designs: {automations}
Estimated time savings: {estimated_savings}

Generate 5-8 step descriptions. Keywords for routing:
- "implement" or "generate" for building automation workflows
- "scaffold" for project/integration setup
- "deploy" for deploying automations to production
- "test" or "verify" for automation testing
- "research" for tool evaluation and API documentation

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['repetitive_tasks', 'current_tools', 'desired_integrations', 'automations'],
      fallback_steps: [
        'Research API capabilities for each tool in the current stack',
        'Scaffold n8n workflow templates for the identified automations',
        'Implement webhook triggers and API connectors between tools',
        'Generate error handling and retry logic for each automation',
        'Deploy automation workflows to staging environment',
        'Test all automations end-to-end with sample data',
        'Verify automation reliability and add monitoring alerts',
      ],
      requires_verification: true,
      max_steps: 10,
    },

    revenue_signal: {
      service: 'Automation Factory (Chicken Hawk + n8n integration)',
      transition_prompt: 'Ready to automate? I\'ll build the workflows, connect your tools, and deploy them — saving you hours every week.',
    },
  },

  // ── 10. CONTENT CALENDAR GENERATOR ───────────────────────────────────────

  'content-calendar': {
    id: 'content-calendar',
    name: 'Content Calendar Generator',
    category: 'marketing',
    tags: ['content calendar', 'posting schedule', 'social media plan', 'content strategy'],
    triggers: [
      /content\s*plan/i,
      /posting\s*schedule/i,
      /content\s*calendar/i,
      /social\s*media\s*plan/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Brand & Goals',
        purpose: 'What the content serves',
        acheevy_behavior: 'Ask: "What\'s the business, and what\'s the #1 goal for your content? Leads? Brand awareness? Community? Pick ONE."',
        output_schema: { business: 'string', primary_goal: 'string' },
      },
      {
        step: 2,
        name: 'Platforms & Frequency',
        purpose: 'Where and how often to post',
        acheevy_behavior: 'Ask: "Which platforms are you on (or want to be on), and how many times per week can you REALISTICALLY post?"',
        output_schema: { platforms: 'string[]', frequency: 'string' },
      },
      {
        step: 3,
        name: 'Content Pillars',
        purpose: 'Define the content themes',
        acheevy_behavior: 'Present 4-5 content pillar options based on their goal. Each pillar has a theme, content types, and example topics.',
        output_schema: { content_pillars: 'string[]', content_types: 'string[]' },
      },
      {
        step: 4,
        name: 'Expert Perspective',
        purpose: 'Content strategy expert review',
        acheevy_behavior: 'Channel the matched digital twin. What content strategy mistakes are they about to make?',
        output_schema: { expert_insight: 'string', confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'growth-mode',
    expert_domain: ['marketing', 'branding'],

    execution: {
      primary_agent: 'marketer-ang',
      step_generation_prompt: `
Generate a content calendar creation pipeline for:
Business: {business}
Primary goal: {primary_goal}
Platforms: {platforms}
Posting frequency: {frequency}
Content pillars: {content_pillars}
Content types: {content_types}

Generate 5-7 step descriptions. Keywords for routing:
- "content" or "copy" for content creation
- "campaign" for content scheduling and calendar building
- "seo" for search optimization and hashtag strategy
- "research" for audience and trending topic analysis
- "verify" for brand voice and quality checks

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['business', 'primary_goal', 'platforms', 'frequency', 'content_pillars', 'content_types'],
      fallback_steps: [
        'Research trending topics and keywords in the business niche for SEO optimization',
        'Generate a 30-day content calendar with daily topics mapped to content pillars',
        'Create 4 weeks of social media copy (captions, hooks, CTAs)',
        'Generate content templates for each content type (carousel, thread, reel script)',
        'Create a brand voice guide for content consistency',
        'Verify content calendar against best posting times and platform algorithms',
      ],
      requires_verification: true,
      max_steps: 8,
    },

    revenue_signal: {
      service: 'Content Lab (Marketer_Ang + content package)',
      transition_prompt: 'Ready to fill your calendar? I\'ll generate 30 days of content, write the copy, and create templates for every content type.',
    },
  },

  // ── 11. LIVESIM — AUTONOMOUS SIMULATION SPACE ───────────────────────────

  'livesim': {
    id: 'livesim',
    name: 'LiveSim Autonomous Space',
    category: 'simulation',
    tags: ['simulation', 'autonomous', 'agents', 'live', 'multi-agent', 'blog', 'content farm'],
    triggers: [
      /live\s*sim/i,
      /simulation\s*space/i,
      /autonomous\s*space/i,
      /agent\s*simulation/i,
      /let\s*the\s*agents?\s*work/i,
      /watch\s*the\s*team/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Simulation Topic',
        purpose: 'Define what the agents will work on autonomously',
        acheevy_behavior: 'Ask: "What should the crew work on? Give me a topic, project, or content objective. They\'ll handle the rest autonomously."',
        output_schema: { topic: 'string', objective: 'string' },
      },
      {
        step: 2,
        name: 'Agent Selection',
        purpose: 'Choose which agents participate',
        acheevy_behavior: 'Present available agents: MarketingAng, AnalystAng, Lil_Research_Hawk, Lil_Builder_Hawk, etc. "Who do you want on this crew?"',
        output_schema: { seed_agents: 'string[]' },
      },
      {
        step: 3,
        name: 'Scope & Duration',
        purpose: 'Set simulation boundaries',
        acheevy_behavior: 'Ask: "How long should they run? And do you want to jump in and ask questions along the way, or just watch?"',
        output_schema: { max_rounds: 'number', user_interaction: 'boolean' },
      },
      {
        step: 4,
        name: 'Launch Confirmation',
        purpose: 'Confirm and launch the simulation',
        acheevy_behavior: 'Summarize: "[N] agents will work on [topic] for [duration]. Ready to launch?" Then spawn the room.',
        output_schema: { confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'livesim',
    expert_domain: ['simulation', 'automation'],

    execution: {
      primary_agent: 'router-ang',
      step_generation_prompt: `
Launch an autonomous simulation for:
Topic: {topic}
Objective: {objective}
Agents: {seed_agents}
Max rounds: {max_rounds}
User interaction allowed: {user_interaction}

The simulation loop runs autonomously. ACHEEVY acts as conductor,
routing sub-tasks to the selected agents. Each round produces:
- Agent action description (what they worked on)
- Artifacts produced (drafts, data, analysis)
- Status update for the timeline

This is NOT a step-generation task — the simulation loop runs
via SKILL:spawn_simulation_room.
      `.trim(),
      required_context: ['topic', 'objective', 'seed_agents', 'max_rounds'],
      fallback_steps: [
        'Initialize simulation room with selected agents',
        'Research phase: agents gather data on the topic',
        'Analysis phase: agents process and synthesize findings',
        'Creation phase: agents produce content/artifacts',
        'Review phase: agents cross-check and refine output',
        'Delivery: compile all artifacts into final deliverable',
      ],
      requires_verification: true,
      max_steps: 50,
    },

    revenue_signal: {
      service: 'Autonomous Ops (Multi-Agent Simulation)',
      transition_prompt: 'Want to see the team in action? I\'ll spin up a live simulation — you can watch them work, jump in with questions, or just let them run.',
    },
  },

  // ── 12. CHICKEN HAWK — CODE & DEPLOY VERTICAL ─────────────────────────

  'chicken-hawk': {
    id: 'chicken-hawk',
    name: 'Chicken Hawk Code & Deploy',
    category: 'devops',
    tags: ['code', 'deploy', 'build', 'app', 'tool', 'automation', 'chicken hawk', 'claw'],
    triggers: [
      /chicken\s*hawk/i,
      /build\s*me\s*(an?\s*)?(app|tool|website|api|service)/i,
      /deploy\s*(my|this|the)\s*(app|project|code)/i,
      /claw\s*(agent|build|code)/i,
      /code\s*agent/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Project Scope',
        purpose: 'Define what to build',
        acheevy_behavior: 'Ask: "What are we building? Give me the one-liner. App, API, automation, or something else?"',
        output_schema: { project_type: 'string', description: 'string' },
      },
      {
        step: 2,
        name: 'Technical Requirements',
        purpose: 'Nail down the tech stack and constraints',
        acheevy_behavior: 'Ask: "What tech stack? Any constraints? Existing code to build on? Deployment target (VPS, GCP, Vercel)?"',
        output_schema: { tech_stack: 'string', constraints: 'string[]', deploy_target: 'string' },
      },
      {
        step: 3,
        name: 'Acceptance Criteria',
        purpose: 'Define what "done" looks like',
        acheevy_behavior: 'Ask: "What does \'done\' look like? List the must-have features for v1. Everything else is v2."',
        output_schema: { acceptance_criteria: 'string[]', nice_to_have: 'string[]' },
      },
      {
        step: 4,
        name: 'Launch Confirmation',
        purpose: 'Confirm and dispatch to Chicken Hawk',
        acheevy_behavior: 'Summarize the build spec. "Ready? Chicken Hawk will handle the build, tests, and deploy."',
        output_schema: { confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'default',
    expert_domain: ['engineering', 'automation'],

    execution: {
      primary_agent: 'chicken-hawk',
      step_generation_prompt: `
Generate a build and deploy pipeline for:
Project type: {project_type}
Description: {description}
Tech stack: {tech_stack}
Constraints: {constraints}
Deploy target: {deploy_target}
Acceptance criteria: {acceptance_criteria}

Generate 6-10 step descriptions. Keywords for routing:
- "scaffold" or "generate" or "implement" for code generation
- "test" or "verify" for testing and QA
- "deploy" for deployment
- "research" for technical research or API docs
- "audit" or "security" for security review

All steps execute via live HTTP/gRPC against the CLAW replacement.
No mock results. Return logs and status as natural-language updates.

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['project_type', 'description', 'tech_stack', 'deploy_target', 'acceptance_criteria'],
      fallback_steps: [
        'Scaffold project structure with the specified tech stack',
        'Generate core application code and configuration files',
        'Implement primary features from acceptance criteria',
        'Generate and run unit tests for all core modules',
        'Implement API endpoints and data models',
        'Run security audit on generated code',
        'Deploy to staging environment on target platform',
        'Run end-to-end tests against staging',
        'Deploy to production and verify health checks',
      ],
      requires_verification: true,
      max_steps: 12,
    },

    revenue_signal: {
      service: 'Code Factory (Chicken Hawk + CLAW Agent)',
      transition_prompt: 'Ready to build? Chicken Hawk will scaffold, code, test, and deploy — from zero to production.',
    },
  },
};

// ---------------------------------------------------------------------------
// Lookup Functions
// ---------------------------------------------------------------------------

/**
 * Get a specific vertical by ID.
 */
export function getVertical(id: string): VerticalDefinition | undefined {
  return VERTICALS[id];
}

/**
 * Get all registered verticals.
 */
export function getAllVerticals(): VerticalDefinition[] {
  return Object.values(VERTICALS);
}

/**
 * Match a user message to a vertical via NLP trigger patterns.
 * Returns the first matching vertical, or null.
 */
export function matchVertical(message: string): VerticalDefinition | null {
  for (const vertical of Object.values(VERTICALS)) {
    if (vertical.triggers.some(trigger => trigger.test(message))) {
      return vertical;
    }
  }
  return null;
}

/**
 * Detect any business-building intent in a message.
 * Broader than matchVertical — catches general entrepreneurial intent.
 */
export function detectBusinessIntent(message: string): boolean {
  const INTENT_PATTERNS = [
    /start(ing)?\s*(a|my)?\s*business/i,
    /business\s*idea/i,
    /startup\s*idea/i,
    /launch(ing)?\s*(a|my)?\s*(company|product|service)/i,
    /build(ing)?\s*(a|my)?\s*business/i,
    /entrepreneur/i,
    /side\s*hustle/i,
    /validate\s*(my|an?)?\s*idea/i,
    /go\s*to\s*market/i,
    /what\s*should\s*i\s*build/i,
    /make\s*money/i,
  ];
  return INTENT_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Get verticals by category.
 */
export function getVerticalsByCategory(category: string): VerticalDefinition[] {
  return Object.values(VERTICALS).filter(v => v.category === category);
}
