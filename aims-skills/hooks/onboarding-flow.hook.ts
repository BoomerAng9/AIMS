/**
 * @hook onboarding-flow
 * @version 1.0.0
 * @description Orchestrates adaptive onboarding conversation flow
 */

import { HookDefinition, HookContext, OnboardingState } from '../types/hooks';
import { db, FieldValue } from '../lib/firebase';

// Industry knowledge lookup
async function getIndustryKnowledge(industry: string): Promise<Record<string, any>> {
  const industryMap: Record<string, any> = {
    'real_estate': {
      key_challenges: ['Lead generation', 'Client retention', 'Market competition'],
      success_patterns: ['Referral networks', 'Social proof', 'Local SEO'],
      top_experts: ['Ryan Serhant', 'Gary Keller'],
      average_deal_size: 15000,
      typical_close_rate: 0.03
    },
    'digital_marketing': {
      key_challenges: ['Client acquisition', 'Proving ROI', 'Scaling operations'],
      success_patterns: ['Case studies', 'LinkedIn outreach', 'Partnerships'],
      top_experts: ['Alex Hormozi', 'Seth Godin'],
      average_deal_size: 5000,
      typical_close_rate: 0.15
    },
    'saas': {
      key_challenges: ['Product-market fit', 'Churn reduction', 'Sales cycle'],
      success_patterns: ['Freemium model', 'Content marketing', 'Product-led growth'],
      top_experts: ['Jason Lemkin', 'Hiten Shah'],
      average_deal_size: 2000,
      typical_close_rate: 0.05
    },
    'consulting': {
      key_challenges: ['Pricing', 'Client acquisition', 'Scope creep'],
      success_patterns: ['Value-based pricing', 'Thought leadership', 'Referrals'],
      top_experts: ['Alan Weiss', 'David C. Baker'],
      average_deal_size: 10000,
      typical_close_rate: 0.25
    }
  };

  const normalizedIndustry = industry.toLowerCase().replace(/\s+/g, '_');
  return industryMap[normalizedIndustry] || {};
}

// Extract structured data from user message
async function extractOnboardingData(message: string, currentStep: number): Promise<{ field: string; value: any }> {
  const data: { field: string; value: any } = { field: '', value: null };

  if (currentStep === 1) {
    // Extract income goal
    const incomeMatch = message.match(/\$?([\d,]+)\s*(k|K|thousand)?/i);
    if (incomeMatch) {
      let value = parseInt(incomeMatch[1].replace(/,/g, ''));
      if (incomeMatch[2]?.toLowerCase() === 'k' || incomeMatch[2]?.toLowerCase() === 'thousand') {
        value *= 1000;
      }
      data.field = 'income_goal';
      data.value = value;
    }

    // Extract industry
    const industries = ['real estate', 'marketing', 'saas', 'consulting', 'ecommerce', 'e-commerce'];
    const foundIndustry = industries.find(ind => message.toLowerCase().includes(ind));
    if (foundIndustry) {
      data.field = 'industry';
      data.value = foundIndustry;
    }

    // Extract purpose
    const purposes = ['solutions', 'content', 'agency', 'partner', 'build', 'scale', 'grow'];
    const foundPurpose = purposes.find(p => message.toLowerCase().includes(p));
    if (foundPurpose) {
      data.field = 'purpose';
      data.value = foundPurpose;
    }
  }

  if (currentStep === 2) {
    // Check for validation response
    const positiveResponses = ['yes', 'sounds good', 'makes sense', 'agree', 'resonates', "let's do it"];
    const isPositive = positiveResponses.some(r => message.toLowerCase().includes(r));
    data.field = 'user_validated_path';
    data.value = isPositive;
  }

  if (currentStep === 3) {
    // Check for mentor simulation acceptance
    const wantsSimulation = message.toLowerCase().includes('yes') || 
                            message.toLowerCase().includes('simulate') ||
                            message.toLowerCase().includes('session');
    data.field = 'user_wants_simulation';
    data.value = wantsSimulation;
  }

  return data;
}

// Check if we should advance to next prompt
async function shouldAdvanceToNextPrompt(currentStep: number, extractedData: any): Promise<boolean> {
  return extractedData.value !== null && extractedData.value !== undefined;
}

// Generate next prompt based on collected data
async function generateNextPrompt(nextStep: number, context: any): Promise<string> {
  const prompts: Record<number, string> = {
    2: `Based on ${context.industry || 'your industry'} and $${(context.income_goal || 100000).toLocaleString()} goal, here's your fastest path...`,
    3: `The #1 person to learn from for this approach is...`,
    4: `Here's your 90-day plan to hit $${(context.income_goal || 100000).toLocaleString()}...`,
    5: `Let's diagnose what's holding you back...`
  };

  return prompts[nextStep] || '';
}

// Complete onboarding and generate template
async function completeOnboarding(userId: string): Promise<void> {
  console.log(`[Onboarding] Completing onboarding for user ${userId}`);
  // Mark complete in Firebase
  // Generate personalized template
}

// Generate personalized template from collected data
async function generatePersonalizedTemplate(userId: string): Promise<Record<string, any>> {
  return {
    header: {
      title: 'Your A.I.M.S. Roadmap',
      tagline: 'Personalized success path'
    },
    generated_at: new Date()
  };
}

// Initialize onboarding state for new user
async function initializeOnboarding(userId: string): Promise<void> {
  const initialState: OnboardingState = {
    onboarding_active: true,
    current_step: 1,
    step_started_at: new Date(),
    collected_data: {
      purpose: null,
      industry: null,
      income_goal: null,
      career_stage: null,
      fastest_offer: null,
      fastest_channel: null,
      user_validated_path: null,
      identified_mentor: null,
      mentor_expertise: null,
      user_wants_simulation: null,
      action_plan_90day: null,
      first_customer_path: null,
      mindset_block: null,
      reframe: null,
      proof_sprint_2week: null,
      raw_idea: null,
      validated_idea: null
    },
    generated_template: null,
    messages_count: 0,
    last_updated: new Date()
  };

  console.log(`[Onboarding] Initializing onboarding for user ${userId}`);
  // Save to Firebase
}

export const OnboardingFlowHook: HookDefinition = {
  metadata: {
    name: 'onboarding_flow_controller',
    version: '1.0.0',
    description: 'Manages state and flow for adaptive onboarding conversations',
    attached_to: ['ACHEEVY.conversation_loop'],
    priority: 100 // High priority - runs before other hooks
  },

  lifecycle_points: {
    before_acheevy_response: {
      async execute(context: HookContext) {
        const user = context.user;

        // Check if onboarding is active
        if (!user.onboarding_complete) {
          // Get current onboarding state
          const onboardingStateRef = db
            .collection('users')
            .doc(user.id)
            .collection('onboarding_state')
            .doc('current');

          const onboardingState = await onboardingStateRef.get();

          if (!onboardingState.exists) {
            // Initialize onboarding
            await initializeOnboarding(user.id);
          }

          const state = onboardingState.data() as OnboardingState;

          // Inject onboarding behavior into ACHEEVY
          context.system_prompt = (context.system_prompt || '') + `\n\n[ONBOARDING MODE ACTIVE]`;
          context.conversation_mode = 'onboarding';
          context.current_step = state?.current_step || 1;
          context.collected_data = state?.collected_data || {};

          // Add industry knowledge if available
          if (state?.collected_data?.industry) {
            const industryKnowledge = await getIndustryKnowledge(state.collected_data.industry);
            context.industry_context = industryKnowledge;
          }
        }

        return context;
      }
    },

    after_user_message: {
      async execute(context: HookContext, userMessage: string) {
        if (context.conversation_mode === 'onboarding') {
          // Extract structured data from user's response
          const extractedData = await extractOnboardingData(
            userMessage,
            context.current_step || 1
          );

          // Update state in Firebase
          if (extractedData.field && extractedData.value !== null) {
            await db
              .collection('users')
              .doc(context.user.id)
              .collection('onboarding_state')
              .doc('current')
              .update({
                [`collected_data.${extractedData.field}`]: extractedData.value,
                last_updated: new Date(),
                messages_count: FieldValue.increment(1)
              });
          }

          // Check if we should advance to next prompt
          const shouldAdvance = await shouldAdvanceToNextPrompt(
            context.current_step || 1,
            extractedData
          );

          if (shouldAdvance) {
            const nextStep = (context.current_step || 1) + 1;

            // Move to next step
            await db
              .collection('users')
              .doc(context.user.id)
              .collection('onboarding_state')
              .doc('current')
              .update({
                current_step: nextStep,
                step_started_at: new Date()
              });

            // Generate next prompt
            context.next_prompt = await generateNextPrompt(nextStep, extractedData);
          }

          // Check if onboarding is complete
          if ((context.current_step || 1) === 5 && shouldAdvance) {
            await completeOnboarding(context.user.id);
          }
        }

        return context;
      }
    },

    before_tool_call: {
      async execute(context: HookContext, toolName: string, toolParams: any) {
        if (context.conversation_mode === 'onboarding') {
          // Inject onboarding data into tool calls
          switch (toolName) {
            case 'generate_action_plan':
              toolParams.industry = context.collected_data?.industry;
              toolParams.income_goal = context.collected_data?.income_goal;
              toolParams.mentor = context.collected_data?.identified_mentor;
              toolParams.career_stage = context.collected_data?.career_stage;
              break;

            case 'simulate_mentor':
              toolParams.mentor_name = context.collected_data?.identified_mentor;
              toolParams.user_context = context.collected_data;
              break;

            case 'diagnose_mindset_block':
              toolParams.previous_attempts = context.collected_data?.previous_attempts;
              toolParams.fears = context.collected_data?.fears;
              break;
          }
        }

        return { toolName, toolParams };
      }
    }
  },

  state_schema: {
    onboarding_active: 'boolean',
    current_step: 'number',
    step_started_at: 'timestamp',
    collected_data: {
      purpose: 'string | null',
      industry: 'string | null',
      income_goal: 'number | null',
      career_stage: 'string | null',
      fastest_offer: 'string | null',
      fastest_channel: 'string | null',
      user_validated_path: 'boolean | null',
      identified_mentor: 'string | null',
      mentor_expertise: 'string | null',
      user_wants_simulation: 'boolean | null',
      action_plan_90day: 'object | null',
      first_customer_path: 'string | null',
      mindset_block: 'string | null',
      reframe: 'string | null',
      proof_sprint_2week: 'object | null',
      raw_idea: 'string | null',
      validated_idea: 'object | null'
    },
    generated_template: 'object | null',
    messages_count: 'number',
    last_updated: 'timestamp'
  }
};

export default OnboardingFlowHook;
