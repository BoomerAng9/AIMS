/**
 * ACHEEVY — Intent Analyzer
 * Heuristic intent classification from natural language.
 * Runs locally without external API calls. When an LLM is configured,
 * this can be replaced with a Claude-based analyzer.
 */

import { IntentAnalysis } from './types';

interface PatternRule {
  patterns: RegExp[];
  intent: string;
  capabilities: string[];
  strategy: 'parallel' | 'sequential' | 'single';
}

const RULES: PatternRule[] = [
  // Research
  {
    patterns: [/research/i, /find\s+(out|info)/i, /look\s+up/i, /investigate/i, /what\s+is/i, /who\s+is/i],
    intent: 'research',
    capabilities: ['brave_web_search', 'academic_research', 'fact_verification', 'source_citation'],
    strategy: 'single',
  },
  // Website / landing page
  {
    patterns: [/build\s+(a\s+)?(website|site|landing\s*page|web\s*page)/i, /create\s+(a\s+)?(website|site)/i, /deploy\s+(a\s+)?site/i],
    intent: 'build_website',
    capabilities: ['page_creation', 'template_deployment', 'visual_editing', 'copy_generation'],
    strategy: 'sequential',
  },
  // Code / app building
  {
    patterns: [/build\s+(a\s+)?(app|application|api|service|component)/i, /code\s+(a|an|the)/i, /write\s+(a\s+)?(function|class|module)/i, /implement/i],
    intent: 'code',
    capabilities: ['code_generation', 'sandbox_execution', 'debugging'],
    strategy: 'sequential',
  },
  // Debugging
  {
    patterns: [/debug/i, /fix\s+(this|the|a|my)/i, /error/i, /bug/i, /broken/i],
    intent: 'debug',
    capabilities: ['debugging', 'code_review'],
    strategy: 'single',
  },
  // Marketing / SEO
  {
    patterns: [/market/i, /seo/i, /campaign/i, /content\s+strateg/i, /social\s+media/i, /growth/i],
    intent: 'marketing',
    capabilities: ['seo_audit', 'copy_generation', 'campaign_flows', 'social_scheduling'],
    strategy: 'parallel',
  },
  // Content writing
  {
    patterns: [/write\s+(a\s+)?(blog|article|post|email|copy|text)/i, /generate\s+copy/i, /draft/i],
    intent: 'write_content',
    capabilities: ['copy_generation', 'seo_audit'],
    strategy: 'single',
  },
  // Voice
  {
    patterns: [/voice/i, /speak/i, /read\s+aloud/i, /text.to.speech/i, /tts/i, /transcri/i],
    intent: 'voice',
    capabilities: ['text_to_speech', 'audio_transcription'],
    strategy: 'single',
  },
  // Video / image
  {
    patterns: [/video/i, /image/i, /photo/i, /screenshot/i, /ocr/i, /visual/i],
    intent: 'media',
    capabilities: ['image_analysis', 'video_transcoding', 'ocr_extraction'],
    strategy: 'single',
  },
  // Automation / workflow
  {
    patterns: [/automat/i, /workflow/i, /schedule/i, /cron/i, /trigger/i, /webhook/i, /n8n/i],
    intent: 'automate',
    capabilities: ['workflow_creation', 'webhook_triggers', 'scheduled_tasks', 'api_integration'],
    strategy: 'sequential',
  },
  // Data / analytics
  {
    patterns: [/data/i, /analyt/i, /report/i, /chart/i, /graph/i, /dashboard/i, /visualiz/i, /pipeline/i],
    intent: 'data_pipeline',
    capabilities: ['data_extraction', 'data_transformation', 'visualization', 'report_generation'],
    strategy: 'sequential',
  },
  // Quality / audit
  {
    patterns: [/audit/i, /review/i, /verify/i, /compliance/i, /security\s+check/i, /oracle/i],
    intent: 'audit',
    capabilities: ['gate_verification', 'security_audit', 'code_review', 'compliance_check'],
    strategy: 'single',
  },
  // Multi-agent orchestration
  {
    patterns: [/orchestrat/i, /coordinate/i, /multi.?step/i, /complex\s+task/i, /decompose/i],
    intent: 'orchestrate',
    capabilities: ['task_decomposition', 'agent_spawning', 'parallel_execution', 'result_synthesis'],
    strategy: 'parallel',
  },
];

/**
 * Analyze user message and classify intent.
 */
export function analyzeIntent(message: string): IntentAnalysis {
  let bestMatch: PatternRule | null = null;
  let bestScore = 0;

  for (const rule of RULES) {
    let score = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(message)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule;
    }
  }

  if (bestMatch && bestScore > 0) {
    const confidence = Math.min(0.5 + bestScore * 0.15, 0.95);
    return {
      primary_intent: bestMatch.intent,
      capabilities_needed: bestMatch.capabilities,
      execution_strategy: bestMatch.strategy,
      confidence,
      requires_confirmation: confidence < 0.7,
    };
  }

  // Fallback — general chat, no specific capabilities
  return {
    primary_intent: 'chat',
    capabilities_needed: [],
    execution_strategy: 'single',
    confidence: 0.3,
    requires_confirmation: false,
  };
}
