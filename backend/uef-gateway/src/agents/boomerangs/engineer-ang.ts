/**
 * Engineer_Ang — Full-Stack Builder
 *
 * Handles BUILD_PLUG intents, code generation tasks, infrastructure work.
 * Specialties: React / Next.js, Node.js APIs, Cloud Deploy
 */

import logger from '../../logger';
import { ByteRover } from '../../byterover';
import { agentChat } from '../../llm';
import { Agent, AgentTaskInput, AgentTaskOutput, makeOutput, failOutput } from '../types';

const profile = {
  id: 'engineer-ang' as const,
  name: 'Engineer_Ang',
  role: 'Full-Stack Builder',
  capabilities: [
    { name: 'react-nextjs', weight: 0.95 },
    { name: 'node-api', weight: 0.90 },
    { name: 'cloud-deploy', weight: 0.80 },
    { name: 'database-design', weight: 0.70 },
    { name: 'typescript', weight: 0.95 },
  ],
  maxConcurrency: 3,
};

async function execute(input: AgentTaskInput): Promise<AgentTaskOutput> {
  logger.info({ taskId: input.taskId }, '[Engineer_Ang] Starting task');

  try {
    // 1. Retrieve context from ByteRover for pattern reuse
    const ctx = await ByteRover.retrieveContext(input.query);
    const logs: string[] = [
      `Retrieved ${ctx.patterns.length} patterns (relevance: ${ctx.relevance})`,
    ];

    // 2. Try LLM-powered analysis via OpenRouter
    const llmResult = await agentChat({
      agentId: 'engineer-ang',
      query: input.query,
      intent: input.intent,
      context: ctx.patterns.length > 0 ? `Reusable patterns: ${ctx.patterns.join(', ')}` : undefined,
    });

    if (llmResult) {
      // LLM-powered response — real AI analysis
      logs.push(`LLM model: ${llmResult.model}`);
      logs.push(`Tokens used: ${llmResult.tokens.total}`);

      return makeOutput(
        input.taskId,
        'engineer-ang',
        llmResult.content,
        [`[llm-analysis] Build plan via ${llmResult.model}`],
        logs,
        llmResult.tokens.total,
        llmResult.cost.usd,
      );
    }

    // 3. Fallback: Heuristic analysis (no OpenRouter key)
    logs.push('Mode: heuristic (configure OPENROUTER_API_KEY for LLM-powered responses)');
    const analysis = analyzeBuildRequest(input.query);
    logs.push(`Analyzed: ${analysis.components.length} components, complexity=${analysis.complexity}`);

    const plan = generateBuildPlan(analysis);
    logs.push(`Plan: ${plan.steps.length} steps generated`);

    const artifacts = plan.steps.map(step => `[artifact] ${step}`);

    const tokens = analysis.complexity * 500;
    const usd = tokens * 0.00003;

    const summary = [
      `Build plan for: ${analysis.type}`,
      `Components: ${analysis.components.join(', ')}`,
      `Steps: ${plan.steps.length}`,
      `Patterns reused: ${ctx.patterns.length}`,
    ].join('\n');

    logger.info({ taskId: input.taskId, steps: plan.steps.length }, '[Engineer_Ang] Task complete');
    return makeOutput(input.taskId, 'engineer-ang', summary, artifacts, logs, tokens, usd);
  } catch (err) {
    return failOutput(input.taskId, 'engineer-ang', err instanceof Error ? err.message : 'Unknown error');
  }
}

// ---------------------------------------------------------------------------
// Internal logic
// ---------------------------------------------------------------------------

interface BuildAnalysis {
  type: string;
  components: string[];
  complexity: number;
}

function analyzeBuildRequest(query: string): BuildAnalysis {
  const lower = query.toLowerCase();
  const components: string[] = [];

  if (lower.includes('dashboard') || lower.includes('ui') || lower.includes('page')) {
    components.push('Frontend UI');
  }
  if (lower.includes('api') || lower.includes('endpoint') || lower.includes('server')) {
    components.push('API Layer');
  }
  if (lower.includes('database') || lower.includes('db') || lower.includes('schema')) {
    components.push('Database Schema');
  }
  if (lower.includes('auth') || lower.includes('login') || lower.includes('signup')) {
    components.push('Authentication');
  }
  if (lower.includes('deploy') || lower.includes('docker') || lower.includes('cloud')) {
    components.push('Deployment');
  }
  if (components.length === 0) {
    components.push('General Build');
  }

  const wordCount = query.split(/\s+/).length;
  const complexity = Math.min(Math.max(wordCount * 2 + components.length * 15, 10), 100);

  let type = 'Feature Build';
  if (lower.includes('plug')) type = 'AI Plug';
  else if (lower.includes('crm')) type = 'CRM Module';
  else if (lower.includes('landing')) type = 'Landing Page';

  return { type, components, complexity };
}

function generateBuildPlan(analysis: BuildAnalysis): { steps: string[] } {
  const steps: string[] = ['Scaffold project structure'];

  for (const comp of analysis.components) {
    switch (comp) {
      case 'Frontend UI':
        steps.push('Generate React component tree');
        steps.push('Apply Tailwind styles (obsidian/gold theme)');
        steps.push('Wire client-side state management');
        break;
      case 'API Layer':
        steps.push('Define Express route handlers');
        steps.push('Add input validation middleware');
        steps.push('Implement business logic');
        break;
      case 'Database Schema':
        steps.push('Design entity-relationship model');
        steps.push('Generate migration scripts');
        break;
      case 'Authentication':
        steps.push('Integrate auth provider');
        steps.push('Add route guards');
        break;
      case 'Deployment':
        steps.push('Generate Dockerfile');
        steps.push('Configure Docker Compose service');
        break;
      default:
        steps.push(`Implement ${comp}`);
    }
  }

  steps.push('Run ORACLE 7-Gate verification');
  steps.push('Package final artifacts');

  return { steps };
}

export const Engineer_Ang: Agent = { profile, execute };
