/**
 * @skill claude-agent-loop
 * @version 1.0.0
 * @owner ACHEEVY
 * @description Core operating loop for ACHEEVY based on Claude Agent SDK architecture
 */

import { SkillDefinition } from '../types/skills';

export const ClaudeAgentLoopSkill: SkillDefinition = {
  metadata: {
    name: 'claude_agent_sdk_loop',
    version: '1.0.0',
    owner: 'ACHEEVY',
    description: '4-step autonomous agent loop: Gather Context → Take Action → Verify Output → Final Output',
    category: 'core_architecture',
    tags: ['agent-loop', 'claude-sdk', 'autonomy', 'orchestrator']
  },

  triggers: [
    {
      event: 'complex_task_request',
      condition: 'User request requires multiple steps or autonomous reasoning'
    },
    {
      event: 'autonomous_mode_enabled',
      condition: 'System is running in full autonomous mode'
    }
  ],

  chain_steps: [
    {
      step: 1,
      name: 'Gather Context',
      purpose: 'Aggregate necessary information to understand the task',
      acheevy_behavior: `
        - Deploy SubAgents for parallel tasks with isolated context
        - Compact conversation history automatically
        - Use Agentic Search (grep, tail) for file system exploration
        - Use Semantic Search for relevant document retrieval
      `,
      output_schema: {
        context_summary: 'string',
        relevant_files: 'string[]',
        sub_agent_findings: 'object'
      }
    },
    {
      step: 2,
      name: 'Take Action',
      purpose: 'Execute the "doing" phase using available capabilities',
      acheevy_behavior: `
        - Execute Tools for specific capabilities
        - Access MCP servers for integrations
        - Run Bash scripts and shell commands ("computer" capability)
        - Generate and run code (Python/TS) to build assets or logic
      `,
      output_schema: {
        actions_taken: 'string[]',
        generated_code: 'object',
        tool_outputs: 'object'
      }
    },
    {
      step: 3,
      name: 'Verify Output',
      purpose: 'Rigorously check work before finalization',
      acheevy_behavior: `
        - check outputs against defined rules
        - Use Visual Feedback (e.g., Playwright) for UI verification
        - Employ LLM-as-a-Judge for fuzzy quality evaluation
      `,
      output_schema: {
        verification_status: 'boolean',
        quality_score: 'number',
        feedback_notes: 'string'
      }
    },
    {
      step: 4,
      name: 'Final Output',
      purpose: 'Deliver completed result',
      acheevy_behavior: `
        - Synthesize all findings and actions
        - Present final deliverable to user
      `,
      output_schema: {
        final_deliverable: 'any',
        completion_metric: 'string'
      }
    }
  ],

  outputs: {
    final_result: {
      type: 'any',
      description: 'The completed task artifact or answer'
    },
    execution_trace: {
      type: 'object',
      description: 'Log of steps taken, context used, and verification results'
    }
  }
};

export default ClaudeAgentLoopSkill;
