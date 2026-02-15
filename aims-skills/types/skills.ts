/**
 * @types/skills
 * Type definitions for A.I.M.S. skill system
 */

export interface SkillMetadata {
  name: string;
  version: string;
  owner: string;
  description: string;
  category: string;
  tags: string[];
}

export interface SkillTrigger {
  event: string;
  condition: string;
}

export interface SkillDependencies {
  services: string[];
  skills: string[];
}

export interface SkillInput {
  type: string;
  required: boolean;
  description?: string;
  enum?: string[];
}

export interface SkillOutput {
  type: string;
  description?: string;
  required?: boolean;
}

export interface SkillBehavior {
  system_prompt: string;
  execution_logic?: (context: any) => Promise<any>;
}

export interface SkillTestCase {
  name: string;
  inputs: Record<string, any>;
  expected_outputs: Record<string, any>;
}

export interface SkillDefinition {
  metadata: SkillMetadata;
  triggers: SkillTrigger[];
  dependencies?: SkillDependencies;
  inputs?: Record<string, SkillInput>;
  outputs?: Record<string, SkillOutput>;
  behavior?: SkillBehavior;
  chain_steps?: ChainStep[];
  final_synthesis?: {
    template: string;
    output_format: string;
  };
  testing?: {
    test_cases: SkillTestCase[];
  };
}

export interface ChainStep {
  step: number;
  name: string;
  prompt?: string;
  purpose: string;
  acheevy_behavior: string;
  output_schema: Record<string, string>;
}

export interface OnboardingTemplate {
  header: {
    title: string;
    tagline: string;
  };
  goal_framework: {
    income_target: number;
    fastest_path: {
      offer: string;
      channel: string;
    };
    mentor: {
      name: string;
      expertise: string;
    };
  };
  action_plan: ActionPlan | null;
  mindset: MindsetBlock | null;
  generated_at: Date;
}

export interface ActionPlan {
  budget: string;
  success_rate: string;
  month_1: string[];
  month_2: string[];
  month_3: string[];
  first_customer_action: string;
}

export interface MindsetBlock {
  block: string;
  reframe: string;
  proof_sprint: {
    week_1: string[];
    week_2: string[];
  };
}

export interface ConversationState {
  current_step: number;
  collected_data: Record<string, any>;
  messages_count: number;
  last_updated: Date;
}
