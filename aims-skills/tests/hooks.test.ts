/**
 * Tests for Hooks
 */

import { OnboardingFlowHook } from '../hooks/onboarding-flow.hook';
import { ConversationStateHook } from '../hooks/conversation-state.hook';

describe('OnboardingFlowHook', () => {
  describe('metadata', () => {
    it('should have correct name', () => {
      expect(OnboardingFlowHook.metadata.name).toBe('onboarding_flow_controller');
    });

    it('should be attached to ACHEEVY conversation loop', () => {
      expect(OnboardingFlowHook.metadata.attached_to).toContain('ACHEEVY.conversation_loop');
    });

    it('should have high priority (100)', () => {
      expect(OnboardingFlowHook.metadata.priority).toBe(100);
    });
  });

  describe('lifecycle_points', () => {
    it('should have before_acheevy_response hook', () => {
      expect(OnboardingFlowHook.lifecycle_points.before_acheevy_response).toBeDefined();
      expect(typeof OnboardingFlowHook.lifecycle_points.before_acheevy_response?.execute).toBe('function');
    });

    it('should have after_user_message hook', () => {
      expect(OnboardingFlowHook.lifecycle_points.after_user_message).toBeDefined();
      expect(typeof OnboardingFlowHook.lifecycle_points.after_user_message?.execute).toBe('function');
    });

    it('should have before_tool_call hook', () => {
      expect(OnboardingFlowHook.lifecycle_points.before_tool_call).toBeDefined();
    });
  });

  describe('state_schema', () => {
    it('should define onboarding_active', () => {
      expect(OnboardingFlowHook.state_schema?.onboarding_active).toBe('boolean');
    });

    it('should define current_step', () => {
      expect(OnboardingFlowHook.state_schema?.current_step).toBe('number');
    });

    it('should define collected_data structure', () => {
      const collectedData = OnboardingFlowHook.state_schema?.collected_data;
      expect(collectedData).toBeDefined();
      expect(collectedData.industry).toBe('string | null');
      expect(collectedData.income_goal).toBe('number | null');
      expect(collectedData.identified_mentor).toBe('string | null');
    });
  });
});

describe('ConversationStateHook', () => {
  describe('metadata', () => {
    it('should have correct name', () => {
      expect(ConversationStateHook.metadata.name).toBe('conversation_state_manager');
    });

    it('should be attached to ACHEEVY conversation loop', () => {
      expect(ConversationStateHook.metadata.attached_to).toContain('ACHEEVY.conversation_loop');
    });

    it('should have lower priority than onboarding (90)', () => {
      expect(ConversationStateHook.metadata.priority).toBe(90);
    });
  });

  describe('lifecycle_points', () => {
    it('should have before_acheevy_response hook', () => {
      expect(ConversationStateHook.lifecycle_points.before_acheevy_response).toBeDefined();
    });

    it('should have after_acheevy_response hook', () => {
      expect(ConversationStateHook.lifecycle_points.after_acheevy_response).toBeDefined();
    });

    it('should have after_user_message hook', () => {
      expect(ConversationStateHook.lifecycle_points.after_user_message).toBeDefined();
    });
  });
});

describe('Hook Priority Order', () => {
  it('onboarding hook should run before conversation state hook', () => {
    expect(OnboardingFlowHook.metadata.priority).toBeGreaterThan(
      ConversationStateHook.metadata.priority
    );
  });
});
