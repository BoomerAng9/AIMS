/**
 * Tests for Idea Validation Skill
 */

import { IdeaValidationSkill } from '../skills/idea-validation.skill';

describe('IdeaValidationSkill', () => {
  describe('metadata', () => {
    it('should have correct name and owner', () => {
      expect(IdeaValidationSkill.metadata.name).toBe('modern_idea_validation_chain');
      expect(IdeaValidationSkill.metadata.owner).toBe('ACHEEVY');
      expect(IdeaValidationSkill.metadata.version).toBe('1.0.0');
    });

    it('should have validation category', () => {
      expect(IdeaValidationSkill.metadata.category).toBe('validation');
    });

    it('should have M.I.M. tag', () => {
      expect(IdeaValidationSkill.metadata.tags).toContain('mim');
    });
  });

  describe('chain_steps', () => {
    it('should have exactly 4 steps', () => {
      expect(IdeaValidationSkill.chain_steps?.length).toBe(4);
    });

    it('should start with Raw Idea Capture', () => {
      const step1 = IdeaValidationSkill.chain_steps?.[0];
      expect(step1?.step).toBe(1);
      expect(step1?.name).toBe('Raw Idea Capture');
      expect(step1?.purpose).toContain('unfiltered');
    });

    it('should have Gap Analysis as step 2', () => {
      const step2 = IdeaValidationSkill.chain_steps?.[1];
      expect(step2?.step).toBe(2);
      expect(step2?.name).toBe('Gap Analysis');
      expect(step2?.acheevy_behavior).toContain('CLARITY');
      expect(step2?.acheevy_behavior).toContain('RISK');
      expect(step2?.acheevy_behavior).toContain('GAPS');
    });

    it('should have Audience Resonance as step 3', () => {
      const step3 = IdeaValidationSkill.chain_steps?.[2];
      expect(step3?.step).toBe(3);
      expect(step3?.name).toBe('Audience Resonance');
    });

    it('should end with Expert Perspective', () => {
      const step4 = IdeaValidationSkill.chain_steps?.[3];
      expect(step4?.step).toBe(4);
      expect(step4?.name).toBe('Expert Perspective');
      expect(step4?.acheevy_behavior).toContain('Alex Hormozi');
      expect(step4?.acheevy_behavior).toContain('Jason Lemkin');
    });
  });

  describe('final_synthesis', () => {
    it('should have markdown template', () => {
      expect(IdeaValidationSkill.final_synthesis?.output_format).toBe('markdown');
    });

    it('should include all key sections', () => {
      const template = IdeaValidationSkill.final_synthesis?.template || '';
      expect(template).toContain('ORIGINAL');
      expect(template).toContain('REFINED');
      expect(template).toContain('What We Fixed');
      expect(template).toContain('Key Risks');
      expect(template).toContain('Next Action');
      expect(template).toContain('Expert Insight');
    });
  });

  describe('triggers', () => {
    it('should trigger on user sharing idea', () => {
      const trigger = IdeaValidationSkill.triggers.find(
        t => t.event === 'user_shares_idea'
      );
      expect(trigger).toBeDefined();
    });

    it('should trigger on explicit validation request', () => {
      const trigger = IdeaValidationSkill.triggers.find(
        t => t.event === 'explicit_validation_request'
      );
      expect(trigger).toBeDefined();
      expect(trigger?.condition).toContain('validate');
    });
  });

  describe('test cases', () => {
    it('should have SaaS Product test case', () => {
      const testCase = IdeaValidationSkill.testing!.test_cases.find(
        t => t.name.includes('SaaS')
      );
      expect(testCase).toBeDefined();
      expect(testCase?.inputs.raw_idea).toContain('dentists');
      expect(testCase?.expected_outputs.expert).toBe('Jason Lemkin');
      expect(testCase?.expected_outputs.gaps_identified).toContain('HIPAA compliance');
    });

    it('should have Agency Service test case', () => {
      const testCase = IdeaValidationSkill.testing!.test_cases.find(
        t => t.name.includes('Agency')
      );
      expect(testCase).toBeDefined();
      expect(testCase?.expected_outputs.expert).toBe('Alex Hormozi');
    });
  });

  describe('output schemas', () => {
    it('should have correct output schema for each step', () => {
      const steps = IdeaValidationSkill.chain_steps || [];
      
      // Step 1 outputs
      expect(steps[0]?.output_schema.raw_idea).toBe('string');
      expect(steps[0]?.output_schema.core_value_prop).toBe('string');
      
      // Step 2 outputs
      expect(steps[1]?.output_schema.clarity_issues).toBe('string[]');
      expect(steps[1]?.output_schema.risks).toBe('string[]');
      
      // Step 4 outputs
      expect(steps[3]?.output_schema.identified_expert).toBe('string');
      expect(steps[3]?.output_schema.tactical_next_step).toBe('string');
    });
  });
});
