/**
 * @hook claude-agent-loop-controller
 * @version 1.0.0
 * @description Orchestrates the 4-step Claude Agent SDK Loop
 */

import { HookDefinition, HookContext } from '../types/hooks';

export const ClaudeLoopHook: HookDefinition = {
  metadata: {
    name: 'claude_loop_controller',
    version: '1.0.0',
    description: 'Enforces Gather → Action → Verify → Output loop structure',
    attached_to: ['ACHEEVY.execution_flow'],
    priority: 90
  },

  lifecycle_points: {
    before_acheevy_response: {
      async execute(context: HookContext) {
        // Only active if specific triggering conditions are met (e.g., complex task flag)
        if (context.conversation_mode === 'autonomous_loop') {
          // Inject instructions to force the 4-step process
          context.system_prompt = (context.system_prompt || '') + `
            
            [OPERATING MODE: CLAUDE AGENT LOOP]
            You are operating in an autonomous loop. Follow these steps strictly:
            
            1. GATHER CONTEXT: Use grep/search to understand the codebase.
            2. TAKE ACTION: Use tools/scripts to execute changes.
            3. VERIFY OUTPUT: Check your work using available verification tools.
            4. FINAL OUTPUT: Report completion only after verification.
          `;
        }
        return context;
      }
    }
  },
  
  state_schema: {
    current_stage: 'string', // 'gather' | 'action' | 'verify' | 'output'
    context_gathered: 'boolean',
    actions_verified: 'boolean',
    iteration_count: 'number'
  }
};

export default ClaudeLoopHook;
