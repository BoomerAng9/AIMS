/**
 * @skill idea-validation
 * @version 1.0.0
 * @owner ACHEEVY
 * @description Modernized 4-step idea validation chain
 */

import { SkillDefinition } from '../types/skills';

export const IdeaValidationSkill: SkillDefinition = {
  metadata: {
    name: 'modern_idea_validation_chain',
    version: '1.0.0',
    owner: 'ACHEEVY',
    description: 'M.I.M. (MakeItMine) 4-step validation: raw idea → gaps → audience fit → expert lens',
    category: 'validation',
    tags: ['mim', 'validation', 'idea-testing', 'market-fit']
  },

  triggers: [
    {
      event: 'user_shares_idea',
      condition: 'message contains idea/concept/business/product'
    },
    {
      event: 'explicit_validation_request',
      condition: 'user says "validate this" or "test my idea"'
    }
  ],

  inputs: {
    raw_idea: {
      type: 'string',
      required: true,
      description: 'The user\'s unpolished idea'
    },
    industry: {
      type: 'string',
      required: false,
      description: 'Industry context if known'
    },
    target_audience: {
      type: 'string',
      required: false,
      description: 'Initial target audience if specified'
    }
  },

  outputs: {
    validated_idea: {
      type: 'object',
      description: 'Refined and validated idea'
    },
    gaps_identified: {
      type: 'array',
      description: 'List of identified gaps and risks'
    },
    expert_insights: {
      type: 'object',
      description: 'Expert perspective and advice'
    },
    next_action: {
      type: 'string',
      description: 'Immediate next step'
    }
  },

  chain_steps: [
    {
      step: 1,
      name: 'Raw Idea Capture',
      prompt: 'Share your raw idea with me. Don\'t polish it—just tell me what you\'re thinking.',
      purpose: 'Get unfiltered concept',
      acheevy_behavior: `
        - Listen without judgment
        - Reflect back what you heard: "So you want to [restate idea]—is that right?"
        - Ask ONE clarifying question if needed: "Who is this for?"
        - DO NOT critique yet
      `,
      output_schema: {
        raw_idea: 'string',
        initial_target_audience: 'string',
        core_value_prop: 'string'
      }
    },

    {
      step: 2,
      name: 'Gap Analysis',
      prompt: 'What\'s unclear, risky, or missing in this idea?',
      purpose: 'Identify vulnerabilities and assumptions',
      acheevy_behavior: `
        Analyze through 3 lenses:
        
        1. CLARITY: What assumptions aren't validated?
           - "You assume customers will pay $X—have you tested this?"
           - "You're targeting 'small businesses'—can you be more specific?"
        
        2. RISK: What could break this?
           - Market: "What if a competitor launches first?"
           - Execution: "Do you have the skills/resources for this?"
           - Timing: "Is the market ready for this now?"
        
        3. GAPS: What's needed to execute?
           - "You need X customers—how will you reach them?"
           - "This requires Y technology—do you have access?"
        
        Be direct but constructive. End with: "These aren't deal-breakers—they're what we need to address."
      `,
      output_schema: {
        clarity_issues: 'string[]',
        risks: 'string[]',
        execution_gaps: 'string[]'
      }
    },

    {
      step: 3,
      name: 'Audience Resonance',
      prompt: 'Now make this resonate with your specific audience. Here\'s what I know about them: [DATA]',
      purpose: 'Align idea with market reality',
      acheevy_behavior: `
        If you don't have audience data yet, ASK:
        "Who EXACTLY is this for? Not 'small businesses'—give me:
        - Industry (e.g., 'boutique fitness studios')
        - Size (e.g., '1-3 locations, $500K-$2M revenue')
        - Pain point (e.g., 'struggling with class booking no-shows')
        - Location (if relevant)"
        
        Once you have specifics, reframe the idea in THEIR language:
        - Their pain: "You're solving [specific problem they complain about]"
        - Their outcome: "This gets them [specific result they want]"
        - Their objection: "They'll worry about [X]—here's how to address it"
        
        Use industry-specific data from Firebase /industry_knowledge/{industry}
      `,
      output_schema: {
        target_audience_refined: 'string',
        pain_point_articulated: 'string',
        value_prop_in_their_words: 'string',
        objection_handling: 'string'
      }
    },

    {
      step: 4,
      name: 'Expert Perspective',
      prompt: 'What would a top 0.01% expert in your field do here?',
      purpose: 'Inject world-class insights',
      acheevy_behavior: `
        Identify the recognized authority in their space:
        - Real Estate → Ryan Serhant, Gary Keller
        - Marketing → Alex Hormozi, Seth Godin
        - SaaS → Jason Lemkin, Hiten Shah
        - Consulting → Alan Weiss, David C. Baker
        - E-commerce → Ezra Firestone, Nik Sharma
        
        Simulate their advice:
        "If I were [Expert], here's what I'd tell you:
        
        [ONE contrarian or non-obvious insight]
        [ONE tactical next step]
        [ONE warning about a common mistake]"
        
        End with: "This is what separates top performers from everyone else in [industry]."
      `,
      output_schema: {
        identified_expert: 'string',
        expert_insight: 'string',
        tactical_next_step: 'string',
        common_mistake_warning: 'string'
      }
    }
  ],

  final_synthesis: {
    template: `
## Your Refined Idea

**ORIGINAL:** {raw_idea}

**REFINED:** {validated_version}

---

## What We Fixed
- CLARITY: {clarity_improvements}
- RISKS: {risk_mitigation}
- AUDIENCE FIT: {resonance_improvements}

---

## Key Risks to Watch
1. {risk_1}
2. {risk_2}
3. {risk_3}

---

## Next Action (Do This First)
{immediate_next_step}

---

## Expert Insight from {expert_name}
{expert_perspective}

---

Ready to build this? I can help you create the first version.
`,
    output_format: 'markdown'
  },

  behavior: {
    system_prompt: `
When validating ideas:
- NEVER skip steps (all 4 required)
- WAIT for response before advancing
- Store each step's output in Firebase /users/{uid}/validations/{validation_id}
- Reference previous validations: "Remember when we tested your [X] idea? This is similar but..."
- If user gets defensive: "I'm here to strengthen your idea, not kill it. These questions make it bulletproof."
`
  },

  testing: {
    test_cases: [
      {
        name: 'SaaS Product Idea',
        inputs: {
          raw_idea: 'AI scheduling assistant for dentists',
          industry: 'Healthcare SaaS',
          target_audience: 'Dental practices'
        },
        expected_outputs: {
          gaps_identified: ['HIPAA compliance', 'Integration with existing PMS', 'Dentist tech adoption'],
          expert: 'Jason Lemkin',
          refined_audience: 'Solo/small dental practices (1-3 dentists) doing $500K-$2M annually'
        }
      },
      {
        name: 'Agency Service Idea',
        inputs: {
          raw_idea: 'AI-powered marketing agency for local businesses',
          industry: 'Marketing Agency',
          target_audience: 'Local businesses'
        },
        expected_outputs: {
          gaps_identified: ['Differentiation from other agencies', 'AI capability proof', 'Local market sizing'],
          expert: 'Alex Hormozi',
          refined_audience: 'Service-based local businesses ($500K-$5M) with 5-20 employees'
        }
      }
    ]
  }
};

export default IdeaValidationSkill;
