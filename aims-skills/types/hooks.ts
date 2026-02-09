/**
 * @types/hooks
 * Type definitions for A.I.M.S. hook system
 */

export interface HookMetadata {
  name: string;
  version: string;
  owner?: string;
  description: string;
  attached_to?: string[];
  priority: number;
}

export interface HookContext {
  user: {
    id: string;
    email?: string;
    onboarding_complete: boolean;
    profile?: Record<string, any>;
  };
  message?: string;
  conversation_id?: string;
  conversation_history?: ConversationMessage[];
  conversation_metadata?: Record<string, any>;
  conversation_mode?: 'onboarding' | 'chat' | 'validation' | 'autonomous_loop';
  current_step?: number;
  collected_data?: Record<string, any>;
  system_prompt?: string;
  next_prompt?: string;
  industry_context?: Record<string, any>;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface LifecyclePoint {
  execute: (context: HookContext, ...args: any[]) => Promise<HookContext | any>;
}

export interface HookLifecyclePoints {
  before_acheevy_response?: LifecyclePoint;
  after_acheevy_response?: LifecyclePoint;
  after_user_message?: LifecyclePoint;
  before_tool_call?: LifecyclePoint;
  after_tool_call?: LifecyclePoint;
}

export interface HookDefinition {
  metadata: HookMetadata;
  lifecycle_points: HookLifecyclePoints;
  state_schema?: Record<string, any>;
  testing?: {
    test_cases: Array<{
      name: string;
      input: Record<string, any>;
      expected: Record<string, any>;
    }>;
  };
}

export interface OnboardingState {
  onboarding_active: boolean;
  current_step: number;
  step_started_at: Date;
  collected_data: {
    // Discovery
    purpose: string | null;
    industry: string | null;
    income_goal: number | null;
    career_stage: string | null;
    
    // Prompt 1: Fastest Path
    fastest_offer: string | null;
    fastest_channel: string | null;
    user_validated_path: boolean | null;
    
    // Prompt 2: Mentor
    identified_mentor: string | null;
    mentor_expertise: string | null;
    user_wants_simulation: boolean | null;
    
    // Prompt 3: Action Plan
    action_plan_90day: Record<string, any> | null;
    first_customer_path: string | null;
    
    // Bonus: Mindset
    mindset_block: string | null;
    reframe: string | null;
    proof_sprint_2week: Record<string, any> | null;
    
    // Idea Validation
    raw_idea: string | null;
    validated_idea: Record<string, any> | null;
  };
  generated_template: Record<string, any> | null;
  messages_count: number;
  last_updated: Date;
}
