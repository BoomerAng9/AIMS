/**
 * @skill onboarding-sop
 * @version 1.0.0
 * @owner ACHEEVY
 * @description Living onboarding system that adapts to user career, industry, and goals
 */

import { SkillDefinition } from '../types/skills';

export const OnboardingSopSkill: SkillDefinition = {
  metadata: {
    name: 'adaptive_onboarding_sop',
    version: '1.0.0',
    owner: 'ACHEEVY',
    description: 'Generates personalized, conversational onboarding flows that adapt in real-time',
    category: 'onboarding',
    tags: ['sop', 'adaptive', 'personalization', 'conversation']
  },

  triggers: [
    {
      event: 'user_first_login',
      condition: 'user.onboarding_complete === false'
    },
    {
      event: 'user_industry_change',
      condition: 'user.profile.industry !== previous.industry'
    },
    {
      event: 'user_goal_reset',
      condition: 'user requests onboarding restart'
    }
  ],

  dependencies: {
    services: [
      'firebase/user_profile',
      'firebase/industry_knowledge',
      'anthropic/claude-sonnet',
      'kimi/k2.5-swarm'
    ],
    skills: [
      'mentor_simulation',
      'action_plan_generator',
      'idea_validation'
    ]
  },

  inputs: {
    user_id: {
      type: 'string',
      required: true,
      description: 'Firebase UID of user'
    },
    trigger_event: {
      type: 'string',
      required: true,
      enum: ['first_login', 'industry_change', 'goal_reset']
    },
    existing_profile: {
      type: 'object',
      required: false,
      description: 'Previous profile data if exists'
    }
  },

  outputs: {
    personalized_template: {
      type: 'OnboardingTemplate',
      description: 'Adaptive template reflecting user context'
    },
    conversation_state: {
      type: 'ConversationState',
      description: 'Current position in onboarding chain'
    },
    action_plan: {
      type: 'ActionPlan',
      required: false,
      description: '90-day or 2-week plan based on prompts'
    },
    mindset_diagnosis: {
      type: 'MindsetBlock',
      required: false,
      description: 'Diagnosed block and reframe if bonus prompt triggered'
    }
  },

  behavior: {
    system_prompt: `
You are ACHEEVY, the A.I.M.S. orchestrator conducting an adaptive onboarding.

## Core Principles
1. ONE QUESTION AT A TIME - This is a conversation, not a form
2. ADAPT BASED ON RESPONSES - Each answer shapes the next question
3. NEVER EXPOSE BACKEND TOOLS - User thinks YOU are doing everything
4. STORE CONTEXT - Every answer feeds into the personalized template

## Onboarding Flow

### DISCOVERY PHASE
Start: "Welcome to A.I.M.S.! I'm ACHEEVY. Let's build something incredible together."

Ask ONE at a time:
1. "What brings you to A.I.M.S. today?" 
   (Listen for: Solutions, Content, Agency, Partner)
2. "What industry are you in or targeting?"
   (Listen for: Real Estate, Marketing, SaaS, Consulting, etc.)
3. "What's your income goal for this year?"
   (Listen for: $50K, $100K, $250K, etc.)

WAIT for each response before continuing.

### 3-PROMPT CHAIN

**PROMPT 1: Fastest Path**
"Based on [industry] and [goal], here's your fastest path:

ONE OFFER: [specific offer]
ONE CHANNEL: [specific channel]
WHY: [evidence-based rationale]

Does this resonate?"

**PROMPT 2: Mentor Identification**
"The #1 person to learn from for this is [Expert Name].

EXPERTISE: [why they're the best]
APPROACH: [their signature method]

Want me to simulate a strategy session with them?"

**PROMPT 3: Action Plan (as Mentor)**
Switch to mentor voice:
"[I'm Expert Name]. Here's your 90-day plan:

BUDGET: <$1,000
SUCCESS RATE: 95%+

MONTH 1: [milestones]
MONTH 2: [milestones]  
MONTH 3: [milestones]

FIRST CUSTOMER: [specific action within 30 days]

Questions?"

### BONUS: Mindset Diagnosis (if stuck)

If user says: "I don't know where to start" / "This feels overwhelming"

Respond: "Let's diagnose what's holding you back. One question at a time:

1. What have you tried before?
2. What scared you most?
3. If you couldn't fail, what would you do?
4. What's the smallest action you could take TODAY?"

After diagnosis:
"The block: [name it]
The reframe: [new perspective]
2-WEEK PROOF SPRINT: [compressed plan]

Ready?"

## After Completion
- Save all data to Firebase /users/{uid}/onboarding
- Generate personalized template
- Set onboarding_complete = true
- Make template accessible in dashboard
`,

    execution_logic: async (context) => {
      // Implementation handled by hook system
      return {
        next_action: 'trigger_conversation_flow',
        data: context.collected_data
      };
    }
  },

  testing: {
    test_cases: [
      {
        name: 'Real Estate Agent - $100K Goal',
        inputs: {
          user_id: 'test_user_1',
          trigger_event: 'first_login',
          responses: {
            purpose: 'Build client pipeline',
            industry: 'Real Estate',
            income_goal: 100000
          }
        },
        expected_outputs: {
          offer: 'Luxury home staging consultation',
          channel: 'Instagram + referrals',
          mentor: 'Ryan Serhant',
          first_customer_timeframe: '14 days'
        }
      },
      {
        name: 'Marketing Agency - $250K Goal',
        inputs: {
          user_id: 'test_user_2',
          trigger_event: 'first_login',
          responses: {
            purpose: 'Scale agency',
            industry: 'Digital Marketing',
            income_goal: 250000
          }
        },
        expected_outputs: {
          offer: 'Performance marketing retainer',
          channel: 'LinkedIn outbound',
          mentor: 'Alex Hormozi',
          first_customer_timeframe: '21 days'
        }
      }
    ]
  }
};

export default OnboardingSopSkill;
