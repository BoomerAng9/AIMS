/**
 * Hybrid Business Manager — Vertical Definitions
 *
 * The Hybrid Business Manager is a vertical that provides fractional
 * executive-level roles automated through ACHEEVY:
 *
 *   - H B Engineer (Hybrid Business Engineer) — AI deployment, production systems
 *   - Architect — Systems/solutions architecture, technical design
 *   - CISO — Security, compliance, risk management, governance
 *   - CTO — Technology strategy, innovation, technical leadership
 *
 * PUBLIC mode: Users access these as ACHEEVY-automated professional services.
 * ACHEEVY delegates to Chicken Hawk → Boomer_Angs → Lil_Hawks.
 *
 * PRIVATE mode (Owner): The "Multus Maven" — Jarrett Risher's fractional
 * FDE practice command center. Multus = many, Maven = expert.
 * All roles converge into one operator.
 *
 * Agent Hierarchy for HBM:
 *   Boomer_Angs: HBEngineer_Ang, Architect_Ang, Security_Ang, CTO_Ang
 *   Lil_Hawks: Lil_Deploy_Hawk, Lil_Audit_Hawk, Lil_Blueprint_Hawk, Lil_Assess_Hawk
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import type { VerticalDefinition, VerticalCategory } from './types';

// ---------------------------------------------------------------------------
// HBM Role Definitions — Each role is a vertical
// ---------------------------------------------------------------------------

/**
 * Extended category type for HBM verticals.
 * These use 'engineering' category from the existing VerticalCategory union.
 */

export const HBM_VERTICALS: Record<string, VerticalDefinition> = {

  // ── H B ENGINEER (Hybrid Business Engineer) ──────────────────────────────
  // The fractional Forward Deployment Engineer role.
  // Takes AI from pilot to production. Embeds with teams.

  'hbm-engineer': {
    id: 'hbm-engineer',
    name: 'Hybrid Business Engineer',
    category: 'engineering' as VerticalCategory,
    tags: [
      'fde', 'forward deployment', 'ai deployment', 'production',
      'pilot to production', 'embedded engineer', 'fractional engineer',
      'ai integration', 'rag', 'agentic ai', 'mcp', 'gcp',
    ],
    triggers: [
      /hybrid\s*business\s*engineer/i,
      /forward\s*deploy/i,
      /ai\s*deploy(ment)?/i,
      /pilot\s*to\s*production/i,
      /embedded?\s*engineer/i,
      /production\s*ai/i,
      /ai\s*integration/i,
      /deploy\s*(my|our|the)?\s*ai/i,
      /rag\s*(pipeline|architecture|system)/i,
      /agentic\s*ai/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Deployment Assessment',
        purpose: 'Understand the current AI maturity and deployment readiness',
        acheevy_behavior: 'Ask: "Where is your AI today? Prototype, pilot, or stuck somewhere in between? What\'s the biggest blocker to getting it into production?"',
        output_schema: { ai_maturity: 'string', deployment_blocker: 'string', current_stack: 'string' },
      },
      {
        step: 2,
        name: 'Technical Landscape',
        purpose: 'Map the technical environment and constraints',
        acheevy_behavior: 'Ask: "What\'s your stack? Cloud provider, languages, frameworks, data stores? Any compliance requirements — HIPAA, SOC2, FedRAMP, air-gapped?"',
        output_schema: { tech_stack: 'string', cloud_provider: 'string', compliance_requirements: 'string[]' },
      },
      {
        step: 3,
        name: 'Production Requirements',
        purpose: 'Define what production-ready means for this use case',
        acheevy_behavior: 'Ask: "What does production look like for you? How many users, what SLA, what\'s the monitoring story? Give me the numbers."',
        output_schema: { user_scale: 'string', sla_requirements: 'string', monitoring_needs: 'string' },
      },
      {
        step: 4,
        name: 'Deployment Blueprint',
        purpose: 'Generate the forward deployment plan',
        acheevy_behavior: 'Present a phased deployment roadmap: Week 1-2 (embed & assess), Week 3-4 (architect & build), Week 5-6 (deploy & monitor). Include specific agent assignments.',
        output_schema: { deployment_plan: 'string', timeline: 'string', confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'business-builder',
    expert_domain: ['engineering', 'devops', 'automation'],

    execution: {
      primary_agent: 'engineer-ang',
      step_generation_prompt: `
Generate an AI forward deployment pipeline for:
Current AI maturity: {ai_maturity}
Deployment blocker: {deployment_blocker}
Tech stack: {tech_stack}
Cloud provider: {cloud_provider}
Compliance: {compliance_requirements}
Scale: {user_scale}
SLA: {sla_requirements}

Generate 6-9 step descriptions. Keywords for routing:
- "scaffold" or "implement" for engineering infrastructure
- "deploy" for deployment operations
- "research" or "analyze" for architecture analysis
- "verify" or "audit" for security and compliance checks
- "test" for load testing and validation

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['ai_maturity', 'deployment_blocker', 'tech_stack', 'cloud_provider', 'compliance_requirements', 'user_scale'],
      fallback_steps: [
        'Analyze the current AI architecture and identify production gaps',
        'Research the deployment target environment and compliance constraints',
        'Scaffold the CI/CD pipeline for AI model deployment with versioning',
        'Implement monitoring and observability layer (metrics, logs, traces)',
        'Generate RAG pipeline architecture with vector store integration',
        'Deploy staging environment with health checks and rollback capability',
        'Verify security compliance (SOC2, HIPAA, FedRAMP as applicable)',
        'Implement load testing framework and validate SLA targets',
        'Deploy to production with blue-green deployment strategy',
      ],
      requires_verification: true,
      max_steps: 10,
    },

    revenue_signal: {
      service: 'Forward Deployment Engineering (HBEngineer_Ang + production pipeline)',
      transition_prompt: 'Ready to move this AI to production? I\'ll embed with your team, build the deployment pipeline, and get this live. Let\'s ship it.',
    },
  },

  // ── ARCHITECT ────────────────────────────────────────────────────────────
  // Systems and solutions architecture. Technical design at scale.

  'hbm-architect': {
    id: 'hbm-architect',
    name: 'Solutions Architect',
    category: 'engineering' as VerticalCategory,
    tags: [
      'architecture', 'system design', 'solutions architect', 'technical design',
      'infrastructure', 'scalability', 'cloud architecture', 'microservices',
      'event-driven', 'platform design',
    ],
    triggers: [
      /solutions?\s*architect/i,
      /system\s*design/i,
      /architecture\s*(review|design|plan)/i,
      /cloud\s*architect/i,
      /infrastructure\s*(design|plan)/i,
      /scalab(le|ility)\s*(design|architecture)/i,
      /microservice/i,
      /platform\s*architect/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'System Context',
        purpose: 'Understand the system being designed or reviewed',
        acheevy_behavior: 'Ask: "What are we building or re-architecting? What\'s the business problem this system solves? Who are the users and what scale are we targeting?"',
        output_schema: { system_purpose: 'string', business_problem: 'string', target_scale: 'string' },
      },
      {
        step: 2,
        name: 'Constraints & Requirements',
        purpose: 'Map non-functional requirements and constraints',
        acheevy_behavior: 'Ask: "What are the hard constraints? Budget ceiling, compliance mandates, existing vendor locks, team skill gaps? And what are the quality attributes that matter most — latency, throughput, availability, cost?"',
        output_schema: { constraints: 'string[]', quality_attributes: 'string[]', budget: 'string' },
      },
      {
        step: 3,
        name: 'Current State Assessment',
        purpose: 'Evaluate what exists today',
        acheevy_behavior: 'Ask: "Show me what you have today. Monolith? Microservices? Serverless? What\'s the biggest architectural pain point right now?"',
        output_schema: { current_architecture: 'string', pain_points: 'string[]', tech_debt: 'string' },
      },
      {
        step: 4,
        name: 'Architecture Blueprint',
        purpose: 'Generate the target architecture recommendation',
        acheevy_behavior: 'Present the architecture: component diagram, data flow, technology choices, migration path. Include trade-offs for each major decision.',
        output_schema: { architecture_recommendation: 'string', trade_offs: 'string[]', confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'business-builder',
    expert_domain: ['engineering', 'devops'],

    execution: {
      primary_agent: 'engineer-ang',
      step_generation_prompt: `
Generate a solutions architecture pipeline for:
System purpose: {system_purpose}
Business problem: {business_problem}
Target scale: {target_scale}
Constraints: {constraints}
Quality attributes: {quality_attributes}
Current architecture: {current_architecture}
Pain points: {pain_points}

Generate 5-8 step descriptions. Keywords for routing:
- "research" or "analyze" for architecture analysis and benchmarking
- "scaffold" or "generate" for architecture documentation and diagrams
- "verify" or "audit" for architecture review and compliance
- "implement" for proof-of-concept components

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['system_purpose', 'business_problem', 'target_scale', 'constraints', 'quality_attributes', 'current_architecture'],
      fallback_steps: [
        'Analyze the current system architecture and document component relationships',
        'Research best-fit architecture patterns for the target scale and constraints',
        'Generate C4 architecture diagrams (Context, Container, Component, Code)',
        'Scaffold the target architecture with service boundaries and data contracts',
        'Analyze data flow patterns and identify bottlenecks or single points of failure',
        'Generate infrastructure-as-code templates for the recommended architecture',
        'Verify the architecture against compliance requirements and quality attributes',
        'Audit security boundaries and network segmentation in the design',
      ],
      requires_verification: true,
      max_steps: 9,
    },

    revenue_signal: {
      service: 'Architecture Advisory (Architect_Ang + design documentation)',
      transition_prompt: 'Ready for the full architecture blueprint? I\'ll generate the diagrams, data flow, IaC templates, and migration plan — production-grade documentation.',
    },
  },

  // ── CISO (Chief Information Security Officer) ────────────────────────────
  // Security posture, compliance, risk management, governance.

  'hbm-ciso': {
    id: 'hbm-ciso',
    name: 'Chief Information Security Officer',
    category: 'engineering' as VerticalCategory,
    tags: [
      'ciso', 'security', 'cybersecurity', 'compliance', 'risk management',
      'soc2', 'hipaa', 'fedramp', 'nist', 'iso27001', 'governance',
      'penetration testing', 'vulnerability', 'incident response',
    ],
    triggers: [
      /ciso/i,
      /security\s*(assessment|audit|review|posture)/i,
      /compliance\s*(audit|assessment|gap)/i,
      /risk\s*(assessment|management|analysis)/i,
      /soc\s*2/i,
      /hipaa\s*(compliance|audit)/i,
      /fedramp/i,
      /nist\s*(framework|800)/i,
      /iso\s*27001/i,
      /penetration\s*test/i,
      /vulnerability\s*(scan|assessment)/i,
      /incident\s*response/i,
      /cybersecurity/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Security Landscape',
        purpose: 'Understand the organization and its security context',
        acheevy_behavior: 'Ask: "What\'s your organization type and size? What industry? What\'s your current security maturity — do you have a CISO, SOC team, or is security ad-hoc?"',
        output_schema: { org_type: 'string', industry: 'string', security_maturity: 'string' },
      },
      {
        step: 2,
        name: 'Compliance Requirements',
        purpose: 'Map the regulatory and compliance landscape',
        acheevy_behavior: 'Ask: "What compliance frameworks are you subject to or targeting? SOC2, HIPAA, FedRAMP, NIST 800-53, ISO 27001, PCI-DSS? Any upcoming audits?"',
        output_schema: { compliance_frameworks: 'string[]', audit_timeline: 'string', gaps_known: 'string[]' },
      },
      {
        step: 3,
        name: 'Threat Assessment',
        purpose: 'Identify the threat landscape and current controls',
        acheevy_behavior: 'Ask: "What keeps you up at night? Data breaches, insider threats, ransomware, supply chain attacks? What controls do you have today — MFA, EDR, SIEM, DLP?"',
        output_schema: { top_threats: 'string[]', current_controls: 'string[]', incident_history: 'string' },
      },
      {
        step: 4,
        name: 'Security Roadmap',
        purpose: 'Generate the security program and remediation plan',
        acheevy_behavior: 'Present a prioritized security roadmap: Quick wins (30 days), Foundation (90 days), Maturity (6 months). Include budget estimates and compliance alignment.',
        output_schema: { security_roadmap: 'string', priority_actions: 'string[]', confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'business-builder',
    expert_domain: ['engineering', 'research'],

    execution: {
      primary_agent: 'quality-ang',
      step_generation_prompt: `
Generate a security assessment and remediation pipeline for:
Organization: {org_type} in {industry}
Security maturity: {security_maturity}
Compliance frameworks: {compliance_frameworks}
Audit timeline: {audit_timeline}
Top threats: {top_threats}
Current controls: {current_controls}

Generate 6-8 step descriptions. Keywords for routing:
- "audit" or "verify" for security assessments and compliance checks
- "research" or "analyze" for threat intelligence and gap analysis
- "generate" or "scaffold" for policy and procedure documentation
- "implement" for security control deployment

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['org_type', 'industry', 'security_maturity', 'compliance_frameworks', 'top_threats', 'current_controls'],
      fallback_steps: [
        'Audit the current security posture against NIST Cybersecurity Framework',
        'Analyze compliance gaps for targeted frameworks (SOC2, HIPAA, etc.)',
        'Research the threat landscape specific to the organization\'s industry',
        'Generate a risk register with likelihood and impact scoring',
        'Scaffold security policies: access control, incident response, data classification',
        'Verify network segmentation and access control configurations',
        'Generate a compliance remediation roadmap with prioritized actions',
        'Audit identity and access management (IAM) controls and MFA coverage',
      ],
      requires_verification: true,
      max_steps: 9,
    },

    revenue_signal: {
      service: 'Security Advisory (Security_Ang + compliance pipeline)',
      transition_prompt: 'Ready for the full security assessment? I\'ll audit your posture, map compliance gaps, generate your risk register, and deliver a prioritized remediation roadmap.',
    },
  },

  // ── CTO (Chief Technology Officer) ───────────────────────────────────────
  // Technology strategy, innovation, technical leadership.

  'hbm-cto': {
    id: 'hbm-cto',
    name: 'Chief Technology Officer',
    category: 'engineering' as VerticalCategory,
    tags: [
      'cto', 'technology strategy', 'technical leadership', 'innovation',
      'digital transformation', 'tech stack', 'engineering team',
      'technical roadmap', 'build vs buy', 'platform strategy',
    ],
    triggers: [
      /cto/i,
      /tech(nology)?\s*strate(gy|gic)/i,
      /technical\s*leadership/i,
      /digital\s*transformation/i,
      /tech\s*stack\s*(decision|choice|evaluation)/i,
      /engineering\s*team\s*(build|hire|scale)/i,
      /technical\s*road\s*map/i,
      /build\s*vs?\s*buy/i,
      /platform\s*strategy/i,
      /fractional\s*cto/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Technology Vision',
        purpose: 'Understand the business goals and technology ambition',
        acheevy_behavior: 'Ask: "What\'s the business trying to achieve in the next 12-18 months? And where does technology fit — is it a cost center, a differentiator, or THE product?"',
        output_schema: { business_goals: 'string', tech_role: 'string', timeline: 'string' },
      },
      {
        step: 2,
        name: 'Current State & Team',
        purpose: 'Assess existing technology and team capabilities',
        acheevy_behavior: 'Ask: "What\'s your current tech stack and team composition? How many engineers, what seniority mix? What\'s the biggest technical bottleneck today?"',
        output_schema: { current_stack: 'string', team_size: 'string', bottleneck: 'string' },
      },
      {
        step: 3,
        name: 'Strategic Decisions',
        purpose: 'Identify the key technology decisions to make',
        acheevy_behavior: 'Present 3-5 critical technology decisions: build vs. buy evaluations, architecture choices, AI strategy, team structure. For each: what\'s at stake and the recommendation.',
        output_schema: { strategic_decisions: 'string[]', ai_strategy: 'string', build_vs_buy: 'string[]' },
      },
      {
        step: 4,
        name: 'Technology Roadmap',
        purpose: 'Generate the comprehensive technology roadmap',
        acheevy_behavior: 'Deliver the roadmap: Q1 foundations, Q2 platform capabilities, Q3 scale and optimize, Q4 competitive differentiation. Include hiring plan and budget allocation.',
        output_schema: { tech_roadmap: 'string', hiring_plan: 'string', confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'business-builder',
    expert_domain: ['engineering', 'ideation', 'automation'],

    execution: {
      primary_agent: 'analyst-ang',
      step_generation_prompt: `
Generate a technology strategy and roadmap pipeline for:
Business goals: {business_goals}
Technology role: {tech_role}
Timeline: {timeline}
Current stack: {current_stack}
Team: {team_size}
Bottleneck: {bottleneck}
Strategic decisions: {strategic_decisions}
AI strategy: {ai_strategy}

Generate 6-8 step descriptions. Keywords for routing:
- "research" or "analyze" for market research and technology evaluation
- "generate" or "scaffold" for documentation and roadmap creation
- "verify" or "audit" for architecture and security review
- "content" for executive communication materials

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['business_goals', 'tech_role', 'timeline', 'current_stack', 'team_size', 'bottleneck', 'strategic_decisions'],
      fallback_steps: [
        'Research the competitive technology landscape and identify differentiation opportunities',
        'Analyze the current tech stack against business goals and identify gaps',
        'Generate a build vs. buy decision matrix for key platform capabilities',
        'Research AI integration opportunities with ROI projections',
        'Scaffold a 12-month technology roadmap with quarterly milestones',
        'Generate an engineering hiring plan aligned to the roadmap',
        'Analyze budget allocation across infrastructure, tooling, and headcount',
        'Verify the roadmap against industry best practices and competitive benchmarks',
      ],
      requires_verification: true,
      max_steps: 9,
    },

    revenue_signal: {
      service: 'CTO Advisory (CTO_Ang + strategy package)',
      transition_prompt: 'Ready for the full technology strategy? I\'ll analyze your landscape, build the roadmap, plan the hires, and deliver executive-ready documentation.',
    },
  },

  // ── MULTUS MAVEN (Owner-Only Meta-Vertical) ─────────────────────────────
  // The convergence of all HBM roles into one fractional practice.
  // Only accessible in PRIVATE mode by the platform owner.

  'hbm-multus-maven': {
    id: 'hbm-multus-maven',
    name: 'Multus Maven',
    category: 'engineering' as VerticalCategory,
    tags: [
      'multus maven', 'fractional', 'fde', 'consulting',
      'jarrett risher', 'ai managed solutions', 'hybrid business',
      'lean six sigma', 'dmaic', 'government contracting',
    ],
    triggers: [
      /multus\s*maven/i,
      /fractional\s*(fde|cto|ciso|architect)/i,
      /my\s*practice/i,
      /client\s*pipeline/i,
      /fde\s*practice/i,
      /consulting\s*practice/i,
    ],

    chain_steps: [
      {
        step: 1,
        name: 'Engagement Context',
        purpose: 'Define the client engagement scope',
        acheevy_behavior: 'Ask: "Which hat are we wearing? Engineer (deploy AI), Architect (design systems), CISO (secure it), or CTO (lead tech strategy)? Or all of them — the full Multus Maven package?"',
        output_schema: { engagement_type: 'string', client_name: 'string', industry: 'string' },
      },
      {
        step: 2,
        name: 'Client Assessment',
        purpose: 'Assess the client\'s needs and readiness',
        acheevy_behavior: 'Run the AI Deployment Readiness Assessment: 10 questions covering tech maturity, team capability, data readiness, compliance posture, and budget alignment.',
        output_schema: { readiness_score: 'string', gaps: 'string[]', opportunities: 'string[]' },
      },
      {
        step: 3,
        name: 'Proposal Generation',
        purpose: 'Generate the engagement proposal',
        acheevy_behavior: 'Generate the proposal: scope, deliverables, timeline, pricing (retainer, project, daily rate), and proof points (70% cycle reduction, $2.9M contracts, $50M+ strategy).',
        output_schema: { proposal: 'string', pricing_model: 'string', proof_points: 'string[]' },
      },
      {
        step: 4,
        name: 'Execution Plan',
        purpose: 'Build the execution plan for the engagement',
        acheevy_behavior: 'Build the execution plan: assign HBM roles, schedule agent workflows, set milestones, define evidence requirements. The full Multus Maven playbook.',
        output_schema: { execution_plan: 'string', milestones: 'string[]', confirmed: 'boolean' },
      },
    ],

    acheevy_mode: 'business-builder',
    expert_domain: ['engineering', 'research', 'automation', 'devops'],

    execution: {
      primary_agent: 'chicken-hawk',
      step_generation_prompt: `
Generate a fractional engagement execution pipeline for:
Engagement type: {engagement_type}
Client: {client_name} in {industry}
Readiness score: {readiness_score}
Identified gaps: {gaps}
Opportunities: {opportunities}
Pricing model: {pricing_model}

Generate 7-10 step descriptions. Keywords for routing:
- "research" or "analyze" for client research and market analysis
- "scaffold" or "generate" for proposal and documentation generation
- "implement" for technical setup and deployment
- "verify" or "audit" for security and compliance review
- "deploy" for production deployment
- "content" for client-facing materials

Return ONLY a JSON array of step description strings.
      `.trim(),
      required_context: ['engagement_type', 'client_name', 'industry', 'readiness_score', 'gaps', 'opportunities', 'pricing_model'],
      fallback_steps: [
        'Research the client\'s industry landscape and competitive technology positioning',
        'Analyze the client\'s current AI maturity against the deployment readiness framework',
        'Generate the Statement of Work with scope, deliverables, and timeline',
        'Scaffold the technical assessment report template',
        'Research compliance requirements specific to the client\'s industry',
        'Generate the deployment architecture recommendation document',
        'Implement the monitoring and reporting dashboard for engagement tracking',
        'Verify all deliverables against quality gates and evidence requirements',
        'Generate the executive summary and ROI projection report',
        'Deploy the engagement tracking workspace with milestone automation',
      ],
      requires_verification: true,
      max_steps: 12,
    },

    revenue_signal: {
      service: 'Multus Maven Practice (Full HBM Suite + Engagement Automation)',
      transition_prompt: 'The Multus Maven playbook is ready. All four roles engaged, pipeline active, evidence tracking live. Let\'s execute.',
    },
  },
};

// ---------------------------------------------------------------------------
// HBM Agent Definitions — Boomer_Angs and Lil_Hawks
// ---------------------------------------------------------------------------

export interface HBMAgent {
  id: string;
  name: string;
  tier: 'boomer_ang' | 'lil_hawk';
  role: string;
  capabilities: string[];
  hbm_vertical: string;
}

export const HBM_AGENTS: HBMAgent[] = [
  // Boomer_Angs
  {
    id: 'hbengineer-ang',
    name: 'HBEngineer_Ang',
    tier: 'boomer_ang',
    role: 'Hybrid Business Engineer',
    capabilities: [
      'ai-deployment', 'rag-architecture', 'agentic-ai',
      'ci-cd-pipeline', 'production-systems', 'mcp-integration',
      'gcp-deployment', 'docker-orchestration',
    ],
    hbm_vertical: 'hbm-engineer',
  },
  {
    id: 'architect-ang',
    name: 'Architect_Ang',
    tier: 'boomer_ang',
    role: 'Solutions Architect',
    capabilities: [
      'system-design', 'cloud-architecture', 'microservices',
      'event-driven', 'infrastructure-as-code', 'c4-diagrams',
      'data-modeling', 'api-design',
    ],
    hbm_vertical: 'hbm-architect',
  },
  {
    id: 'security-ang',
    name: 'Security_Ang',
    tier: 'boomer_ang',
    role: 'Chief Information Security Officer',
    capabilities: [
      'security-assessment', 'compliance-audit', 'risk-management',
      'incident-response', 'penetration-testing', 'policy-generation',
      'nist-framework', 'soc2-compliance',
    ],
    hbm_vertical: 'hbm-ciso',
  },
  {
    id: 'cto-ang',
    name: 'CTO_Ang',
    tier: 'boomer_ang',
    role: 'Chief Technology Officer',
    capabilities: [
      'technology-strategy', 'roadmap-planning', 'build-vs-buy',
      'engineering-hiring', 'digital-transformation', 'ai-strategy',
      'budget-planning', 'vendor-evaluation',
    ],
    hbm_vertical: 'hbm-cto',
  },

  // Lil_Hawks
  {
    id: 'lil-deploy-hawk',
    name: 'Lil_Deploy_Hawk',
    tier: 'lil_hawk',
    role: 'Deployment Specialist',
    capabilities: [
      'docker-deployment', 'ci-cd', 'blue-green-deploy',
      'health-checks', 'rollback',
    ],
    hbm_vertical: 'hbm-engineer',
  },
  {
    id: 'lil-audit-hawk',
    name: 'Lil_Audit_Hawk',
    tier: 'lil_hawk',
    role: 'Security Audit Specialist',
    capabilities: [
      'vulnerability-scanning', 'compliance-checks',
      'access-review', 'log-analysis',
    ],
    hbm_vertical: 'hbm-ciso',
  },
  {
    id: 'lil-blueprint-hawk',
    name: 'Lil_Blueprint_Hawk',
    tier: 'lil_hawk',
    role: 'Architecture Documentation Specialist',
    capabilities: [
      'diagram-generation', 'documentation',
      'api-specification', 'data-flow-mapping',
    ],
    hbm_vertical: 'hbm-architect',
  },
  {
    id: 'lil-assess-hawk',
    name: 'Lil_Assess_Hawk',
    tier: 'lil_hawk',
    role: 'Readiness Assessment Specialist',
    capabilities: [
      'readiness-assessment', 'gap-analysis',
      'roi-projection', 'maturity-scoring',
    ],
    hbm_vertical: 'hbm-cto',
  },
];

// ---------------------------------------------------------------------------
// Multus Maven Profile — The convergence persona
// ---------------------------------------------------------------------------

export interface MultusMavenProfile {
  name: string;
  title: string;
  tagline: string;
  brand_pillars: Array<{ id: string; name: string; description: string }>;
  proof_points: Array<{ metric: string; description: string }>;
  engagement_models: Array<{ name: string; rate: string; description: string }>;
  target_segments: string[];
}

export const MULTUS_MAVEN: MultusMavenProfile = {
  name: 'Multus Maven',
  title: 'Fractional AI Forward Deployment Engineer',
  tagline: 'From Pilot to Production. AI That Actually Ships.',

  brand_pillars: [
    {
      id: 'ai-deployment',
      name: 'AI Deployment Engineering',
      description: 'RAG architecture, agentic AI orchestration, LLM integration, MCP, production AI systems.',
    },
    {
      id: 'process-rigor',
      name: 'Process Rigor Meets AI',
      description: 'Applying DMAIC and Lean Six Sigma to AI deployment. Why 95% of AI deployments fail — and the operational framework that fixes it.',
    },
    {
      id: 'strategic-consulting',
      name: 'Strategic Consulting & Market Intelligence',
      description: 'Data-driven decision-making for physical and digital expansion. The $50M+ retail expansion strategy methodology.',
    },
    {
      id: 'gov-regulated-ai',
      name: 'Government & Regulated AI',
      description: 'FAR/DFARS compliance, government contracting, deploying AI in regulated environments. $2.9M contract management.',
    },
    {
      id: 'global-operations',
      name: 'Global Operations & Scale',
      description: 'International operations, cross-cultural technology deployment. Saudi Arabia launch experience.',
    },
  ],

  proof_points: [
    { metric: '70%', description: 'Reduced AI application development cycle time' },
    { metric: '$2.9M', description: 'Government contracts managed' },
    { metric: '$50M+', description: 'Retail expansion strategy created' },
    { metric: '800-1,165%', description: 'Growth in FDE job postings (2025)' },
    { metric: '95%', description: 'Enterprise AI deployment failure rate — the gap we fill' },
  ],

  engagement_models: [
    { name: 'Monthly Retainer', rate: '$10,000-$15,000/mo', description: '15-20 hours/month embedded' },
    { name: 'Daily Embedded', rate: '$2,000-$3,000/day', description: 'Full-day embedded deployment' },
    { name: 'Hourly Advisory', rate: '$200-$300/hr', description: 'Strategic consultation' },
    { name: 'Expert Network', rate: '$300-$500/hr', description: 'GLG/AlphaSights calls' },
  ],

  target_segments: [
    'AI Startups (Series B-D, $50M-$300M+ raised)',
    'Enterprise / Fortune 500 (AI transformation)',
    'Government / Public Sector (Federal AI, State AI)',
    'Fractional Platforms (A.Team, Catalant, Toptal)',
  ],
};

// ---------------------------------------------------------------------------
// Lookup Helpers
// ---------------------------------------------------------------------------

export function getHBMVertical(id: string): VerticalDefinition | undefined {
  return HBM_VERTICALS[id];
}

export function getAllHBMVerticals(): VerticalDefinition[] {
  return Object.values(HBM_VERTICALS);
}

export function getHBMAgentsByVertical(verticalId: string): HBMAgent[] {
  return HBM_AGENTS.filter(a => a.hbm_vertical === verticalId);
}

export function getHBMAgentsByTier(tier: 'boomer_ang' | 'lil_hawk'): HBMAgent[] {
  return HBM_AGENTS.filter(a => a.tier === tier);
}
