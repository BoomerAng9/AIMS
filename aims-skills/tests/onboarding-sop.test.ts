/**
 * Tests for Onboarding SOP Skill
 */

import { OnboardingSopSkill } from '../skills/onboarding-sop.skill';

describe('OnboardingSopSkill', () => {
  describe('metadata', () => {
    it('should have correct name and owner', () => {
      expect(OnboardingSopSkill.metadata.name).toBe('adaptive_onboarding_sop');
      expect(OnboardingSopSkill.metadata.owner).toBe('ACHEEVY');
      expect(OnboardingSopSkill.metadata.version).toBe('1.0.0');
    });

    it('should have onboarding category', () => {
      expect(OnboardingSopSkill.metadata.category).toBe('onboarding');
    });

    it('should have required tags', () => {
      expect(OnboardingSopSkill.metadata.tags).toContain('sop');
      expect(OnboardingSopSkill.metadata.tags).toContain('adaptive');
      expect(OnboardingSopSkill.metadata.tags).toContain('personalization');
    });
  });

  describe('triggers', () => {
    it('should trigger on user_first_login', () => {
      const trigger = OnboardingSopSkill.triggers.find(
        t => t.event === 'user_first_login'
      );
      expect(trigger).toBeDefined();
      expect(trigger?.condition).toContain('onboarding_complete');
    });

    it('should trigger on industry change', () => {
      const trigger = OnboardingSopSkill.triggers.find(
        t => t.event === 'user_industry_change'
      );
      expect(trigger).toBeDefined();
    });

    it('should trigger on goal reset', () => {
      const trigger = OnboardingSopSkill.triggers.find(
        t => t.event === 'user_goal_reset'
      );
      expect(trigger).toBeDefined();
    });
  });

  describe('inputs', () => {
    it('should require user_id', () => {
      expect(OnboardingSopSkill.inputs!.user_id.required).toBe(true);
      expect(OnboardingSopSkill.inputs!.user_id.type).toBe('string');
    });

    it('should require trigger_event', () => {
      expect(OnboardingSopSkill.inputs!.trigger_event.required).toBe(true);
      expect(OnboardingSopSkill.inputs!.trigger_event.enum).toContain('first_login');
    });

    it('should have optional existing_profile', () => {
      expect(OnboardingSopSkill.inputs!.existing_profile.required).toBe(false);
    });
  });

  describe('outputs', () => {
    it('should output personalized_template', () => {
      expect(OnboardingSopSkill.outputs!.personalized_template.type).toBe('OnboardingTemplate');
    });

    it('should output conversation_state', () => {
      expect(OnboardingSopSkill.outputs!.conversation_state.type).toBe('ConversationState');
    });

    it('should have optional action_plan', () => {
      expect(OnboardingSopSkill.outputs!.action_plan.required).toBe(false);
    });
  });

  describe('behavior', () => {
    it('should have system_prompt with onboarding instructions', () => {
      const prompt = OnboardingSopSkill.behavior!.system_prompt;
      expect(prompt).toContain('ACHEEVY');
      expect(prompt).toContain('ONE QUESTION AT A TIME');
      expect(prompt).toContain('DISCOVERY PHASE');
      expect(prompt).toContain('3-PROMPT CHAIN');
    });

    it('should include mentor identification', () => {
      const prompt = OnboardingSopSkill.behavior!.system_prompt;
      expect(prompt).toContain('Mentor Identification');
      expect(prompt).toContain('EXPERTISE');
    });

    it('should include mindset diagnosis bonus', () => {
      const prompt = OnboardingSopSkill.behavior!.system_prompt;
      expect(prompt).toContain('Mindset Diagnosis');
      expect(prompt).toContain('2-WEEK PROOF SPRINT');
    });
  });

  describe('test cases', () => {
    it('should have Real Estate Agent test case', () => {
      const testCase = OnboardingSopSkill.testing!.test_cases.find(
        t => t.name.includes('Real Estate')
      );
      expect(testCase).toBeDefined();
      expect(testCase?.inputs.responses.industry).toBe('Real Estate');
      expect(testCase?.expected_outputs.mentor).toBe('Ryan Serhant');
    });

    it('should have Marketing Agency test case', () => {
      const testCase = OnboardingSopSkill.testing!.test_cases.find(
        t => t.name.includes('Marketing')
      );
      expect(testCase).toBeDefined();
      expect(testCase?.inputs.responses.income_goal).toBe(250000);
      expect(testCase?.expected_outputs.mentor).toBe('Alex Hormozi');
    });
  });

  describe('dependencies', () => {
    it('should depend on required services', () => {
      expect(OnboardingSopSkill.dependencies?.services).toContain('firebase/user_profile');
      expect(OnboardingSopSkill.dependencies?.services).toContain('anthropic/claude-sonnet');
    });

    it('should depend on related skills', () => {
      expect(OnboardingSopSkill.dependencies?.skills).toContain('mentor_simulation');
      expect(OnboardingSopSkill.dependencies?.skills).toContain('action_plan_generator');
    });
  });
});
