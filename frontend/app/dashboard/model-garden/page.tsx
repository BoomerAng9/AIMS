'use client';

/**
 * A.I.M.S. Model Garden
 *
 * Browse and select AI models and tools to integrate into your app.
 * Similar to Firebase/Vertex AI model selection experience.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircuitBoardPattern, AIMS_CIRCUIT_COLORS } from '@/components/ui/CircuitBoard';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

// User-friendly categories (what it does, not what it is)
type ModelCategory = 'assistant' | 'researcher' | 'coder' | 'creative' | 'specialist' | 'agent-platform';
type ToolCategory = 'search' | 'voice' | 'video' | 'payment' | 'storage' | 'analytics';
type PricingTier = 'free' | 'pay-as-you-go' | 'provisioned' | 'enterprise';
type ModelStatus = 'stable' | 'preview' | 'beta' | 'deprecated';

interface AIModel {
  id: string;
  name: string;
  friendlyName: string; // User-friendly name like "Smart Assistant"
  provider: string;
  category: ModelCategory;
  description: string;
  useCase: string; // Plain English: "Best for..."
  capabilities: string[];
  pricing: PricingTier;
  status: ModelStatus;
  contextWindow?: string;
  inputCost?: string;
  outputCost?: string;
  enabled?: boolean;
  popular?: boolean;
}

interface Tool {
  id: string;
  name: string;
  provider: string;
  category: ToolCategory;
  description: string;
  features: string[];
  pricing: PricingTier;
  status: ModelStatus;
  enabled?: boolean;
}

interface ConsumptionModel {
  id: string;
  name: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const AI_MODELS: AIModel[] = [
  // Agent Platforms - Full AI assistants that can do tasks
  {
    id: 'openclaw',
    name: 'OpenClaw',
    friendlyName: 'AI Agent Platform',
    provider: 'A.I.M.S.',
    category: 'agent-platform',
    description: 'Multi-model agent platform with sandboxed tool execution',
    useCase: 'Best for: Building AI agents that can browse, code, and complete tasks autonomously',
    capabilities: ['Agent Mode', 'Tool Use', 'Sandboxed', 'Multi-Model'],
    pricing: 'free',
    status: 'stable',
    contextWindow: 'Unlimited',
    inputCost: 'Included',
    outputCost: 'Included',
    popular: true,
  },
  // Anthropic Claude Models (OpenRouter)
  {
    id: 'anthropic/claude-opus-4.6',
    name: 'Claude Opus 4.6',
    friendlyName: 'Chief Strategist',
    provider: 'Anthropic',
    category: 'assistant',
    description: 'Latest flagship — 1M context, advanced reasoning, tool orchestration',
    useCase: 'Best for: Multi-agent orchestration, complex architecture, code-to-production',
    capabilities: ['Reasoning', 'Analysis', 'Code', 'Vision', '1M Context', 'Agentic', 'Extended Thinking'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '1M',
    inputCost: '$5/M tokens',
    outputCost: '$25/M tokens',
    popular: true,
  },
  {
    id: 'anthropic/claude-opus-4.5',
    name: 'Claude Opus 4.5',
    friendlyName: 'Executive Assistant',
    provider: 'Anthropic',
    category: 'assistant',
    description: 'Premium reasoning with 200K context, complex analysis',
    useCase: 'Best for: Complex business decisions, strategic planning, detailed analysis',
    capabilities: ['Reasoning', 'Analysis', 'Code', 'Vision', 'Agentic'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '200K',
    inputCost: '$5/M tokens',
    outputCost: '$25/M tokens',
    popular: false,
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    friendlyName: 'Smart Assistant',
    provider: 'Anthropic',
    category: 'assistant',
    description: 'State-of-the-art for real-world agents and coding workflows',
    useCase: 'Best for: Everyday tasks, writing, coding, extended autonomous operation',
    capabilities: ['Reasoning', 'Code', 'Vision', 'Agentic', 'Tool Orchestration'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '1M',
    inputCost: '$3/M tokens',
    outputCost: '$15/M tokens',
    popular: true,
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    friendlyName: 'Quick Helper',
    provider: 'Anthropic',
    category: 'assistant',
    description: 'Fastest Claude, 2x speed at 1/3 cost, >73% SWE-bench',
    useCase: 'Best for: Real-time agents, high-volume coding, quick answers',
    capabilities: ['Fast', 'Efficient', 'Code', 'Vision', 'Extended Thinking'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '200K',
    inputCost: '$1/M tokens',
    outputCost: '$5/M tokens',
  },
  // OpenAI Models (OpenRouter)
  {
    id: 'openai/gpt-5.2',
    name: 'GPT-5.2',
    friendlyName: 'Multi-Talent Assistant',
    provider: 'OpenAI',
    category: 'creative',
    description: 'Frontier model with adaptive reasoning, 400K context',
    useCase: 'Best for: Complex creative projects, advanced reasoning, agentic tasks',
    capabilities: ['Vision', 'Audio', 'Adaptive Reasoning', 'Code', '400K Context'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '400K',
    inputCost: '$10/M tokens',
    outputCost: '$30/M tokens',
    popular: true,
  },
  {
    id: 'openai/gpt-5.1',
    name: 'GPT-5.1',
    friendlyName: 'Balanced Assistant',
    provider: 'OpenAI',
    category: 'assistant',
    description: 'Strong general-purpose reasoning with natural conversation',
    useCase: 'Best for: General tasks, instruction following, conversational AI',
    capabilities: ['Reasoning', 'Code', 'Vision', 'Natural Style'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '256K',
    inputCost: '$5/M tokens',
    outputCost: '$15/M tokens',
  },
  {
    id: 'openai/o3-pro',
    name: 'o3-pro',
    friendlyName: 'Deep Thinker',
    provider: 'OpenAI',
    category: 'researcher',
    description: 'Extended thinking for math, science, and coding excellence',
    useCase: 'Best for: Complex math, scientific research, reliable code',
    capabilities: ['Extended Thinking', 'Math', 'Science', 'Code', 'Web Search'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '200K',
    inputCost: '$20/M tokens',
    outputCost: '$80/M tokens',
  },
  // Google Gemini Models (OpenRouter)
  {
    id: 'google/gemini-3-flash',
    name: 'Gemini 3 Flash',
    friendlyName: 'Research Assistant',
    provider: 'Google',
    category: 'researcher',
    description: 'High-speed thinking model for agentic workflows',
    useCase: 'Best for: Quick research, multi-turn chat, coding assistance',
    capabilities: ['Fast', 'Vision', 'Reasoning', 'Code', 'Multimodal'],
    pricing: 'pay-as-you-go',
    status: 'preview',
    contextWindow: '1M',
    inputCost: '$0.50/M tokens',
    outputCost: '$1.50/M tokens',
    popular: true,
  },
  {
    id: 'google/gemini-3-pro',
    name: 'Gemini 3 Pro',
    friendlyName: 'Document Analyst',
    provider: 'Google',
    category: 'researcher',
    description: 'Flagship frontier model for high-precision multimodal reasoning',
    useCase: 'Best for: Enterprise documents, video/audio analysis, codebases',
    capabilities: ['Long Context', 'Vision', 'Audio', 'Video', 'Code'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '1M',
    inputCost: '$2.50/M tokens',
    outputCost: '$10/M tokens',
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    friendlyName: 'Math & Science Pro',
    provider: 'Google',
    category: 'researcher',
    description: 'Advanced reasoning for coding, math, and scientific tasks',
    useCase: 'Best for: Complex math, scientific analysis, technical reasoning',
    capabilities: ['Reasoning', 'Math', 'Science', 'Code', 'Thinking'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '1M',
    inputCost: '$1.25/M tokens',
    outputCost: '$5/M tokens',
  },
  {
    id: 'moonshot/kimi-k2.5',
    name: 'KIMI K2.5',
    friendlyName: 'Deep Researcher',
    provider: 'Moonshot',
    category: 'researcher',
    description: 'Long-form content analysis and research',
    useCase: 'Best for: Deep research, complex analysis, Chinese language',
    capabilities: ['Long Context', 'Research', 'Multilingual'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '200K',
    inputCost: '$0.50/M tokens',
    outputCost: '$1.50/M tokens',
  },
  {
    id: 'perplexity/sonar-pro',
    name: 'Perplexity Sonar Pro',
    friendlyName: 'Live Web Searcher',
    provider: 'Perplexity',
    category: 'researcher',
    description: 'Real-time web search with citations',
    useCase: 'Best for: Current events, real-time information, sourced answers',
    capabilities: ['Web Search', 'Citations', 'Real-time'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '128K',
    inputCost: '$3/M tokens',
    outputCost: '$15/M tokens',
  },
  // Coding & Development (OpenRouter)
  {
    id: 'deepseek/deepseek-v3.2',
    name: 'DeepSeek V3.2',
    friendlyName: 'Value Code Writer',
    provider: 'DeepSeek',
    category: 'coder',
    description: 'Frontier performance at 1/100th the cost - the value king',
    useCase: 'Best for: Writing code, debugging, complex technical problems',
    capabilities: ['Code', 'Math', 'Reasoning', 'Long Context'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '128K',
    inputCost: '$0.14/M tokens',
    outputCost: '$0.28/M tokens',
    popular: true,
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    friendlyName: 'Reasoning Coder',
    provider: 'DeepSeek',
    category: 'coder',
    description: 'Advanced reasoning model for complex problems',
    useCase: 'Best for: Complex reasoning, mathematical proofs, hard coding',
    capabilities: ['Reasoning', 'Code', 'Math', 'Chain-of-Thought'],
    pricing: 'free',
    status: 'stable',
    contextWindow: '64K',
    inputCost: 'Free',
    outputCost: 'Free',
  },
  {
    id: 'mistral/codestral-latest',
    name: 'Codestral Latest',
    friendlyName: 'Code Completer',
    provider: 'Mistral',
    category: 'coder',
    description: 'Optimized for code completion and generation',
    useCase: 'Best for: Fast code completion, autocomplete, IDE integration',
    capabilities: ['Code', 'Fast', 'Fill-in-Middle', 'Multi-file'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '256K',
    inputCost: '$0.30/M tokens',
    outputCost: '$0.90/M tokens',
  },
  // Open Source / Specialists (OpenRouter)
  {
    id: 'meta/llama-4-maverick',
    name: 'Llama 4 Maverick',
    friendlyName: 'Open Source Helper',
    provider: 'Meta',
    category: 'specialist',
    description: 'Latest open-weight model for self-hosting',
    useCase: 'Best for: Self-hosted deployments, privacy-focused applications',
    capabilities: ['Open Source', 'Code', 'Reasoning', 'Vision'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '256K',
    inputCost: '$0.20/M tokens',
    outputCost: '$0.60/M tokens',
  },
  {
    id: 'nvidia/nemotron-3-nano',
    name: 'Nemotron 3 Nano',
    friendlyName: 'Efficient Agent',
    provider: 'NVIDIA',
    category: 'specialist',
    description: 'Small MoE model for agentic AI systems, fully open',
    useCase: 'Best for: Edge deployment, efficient agents, low-latency',
    capabilities: ['Efficient', 'Agentic', 'Open Weights', 'Fast'],
    pricing: 'free',
    status: 'stable',
    contextWindow: '32K',
    inputCost: 'Free',
    outputCost: 'Free',
  },
  {
    id: 'qwen/qwen-3.5-coder',
    name: 'Qwen 3.5 Coder',
    friendlyName: 'Multilingual Coder',
    provider: 'Alibaba',
    category: 'coder',
    description: 'Advanced multilingual coding model',
    useCase: 'Best for: Multi-language code, Asian languages, translation',
    capabilities: ['Multilingual', 'Code', 'Reasoning', 'Vision'],
    pricing: 'pay-as-you-go',
    status: 'stable',
    contextWindow: '128K',
    inputCost: '$0.40/M tokens',
    outputCost: '$1.20/M tokens',
  },
];

const TOOLS: Tool[] = [
  // Search
  {
    id: 'brave-search',
    name: 'Brave Search API',
    provider: 'Brave',
    category: 'search',
    description: 'Privacy-focused web search with news and video results',
    features: ['Web Search', 'News', 'Videos', 'No Tracking'],
    pricing: 'pay-as-you-go',
    status: 'stable',
  },
  {
    id: 'google-search',
    name: 'Google Custom Search',
    provider: 'Google',
    category: 'search',
    description: 'Programmable search engine with image search',
    features: ['Web Search', 'Images', 'Custom Filters'],
    pricing: 'pay-as-you-go',
    status: 'stable',
  },
  // Voice
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    provider: 'ElevenLabs',
    category: 'voice',
    description: 'High-quality text-to-speech and voice cloning',
    features: ['TTS', 'Voice Cloning', 'Real-time', 'Multilingual'],
    pricing: 'pay-as-you-go',
    status: 'stable',
  },
  {
    id: 'whisper',
    name: 'Whisper (OpenAI)',
    provider: 'OpenAI',
    category: 'voice',
    description: 'State-of-the-art speech recognition',
    features: ['STT', 'Multilingual', 'Translation', 'Timestamps'],
    pricing: 'pay-as-you-go',
    status: 'stable',
  },
  {
    id: 'deepgram',
    name: 'Deepgram',
    provider: 'Deepgram',
    category: 'voice',
    description: 'Real-time speech-to-text with streaming',
    features: ['STT', 'Real-time', 'Diarization', 'Custom Models'],
    pricing: 'pay-as-you-go',
    status: 'stable',
  },
  // Video/Vision
  {
    id: 'sam',
    name: 'SAM (Segment Anything)',
    provider: 'Meta',
    category: 'video',
    description: 'Advanced image and video segmentation',
    features: ['Segmentation', 'Object Detection', 'Video Tracking'],
    pricing: 'free',
    status: 'stable',
  },
  {
    id: 'replicate',
    name: 'Replicate',
    provider: 'Replicate',
    category: 'video',
    description: 'Run open-source models in the cloud',
    features: ['Image Gen', 'Video', 'Audio', 'Custom Models'],
    pricing: 'pay-as-you-go',
    status: 'stable',
  },
  // Payment
  {
    id: 'stripe',
    name: 'Stripe',
    provider: 'Stripe',
    category: 'payment',
    description: 'Payment processing and billing',
    features: ['Payments', 'Subscriptions', 'Invoicing', 'Connect'],
    pricing: 'pay-as-you-go',
    status: 'stable',
  },
  {
    id: 'luc-billing',
    name: 'LUC Billing Engine',
    provider: 'A.I.M.S.',
    category: 'payment',
    description: 'Token-based AI usage billing and tracking',
    features: ['Token Tracking', 'Change Orders', 'Invoicing', 'Analytics'],
    pricing: 'free',
    status: 'stable',
  },
  // Storage
  {
    id: 'cloudflare-r2',
    name: 'Cloudflare R2',
    provider: 'Cloudflare',
    category: 'storage',
    description: 'S3-compatible object storage with zero egress',
    features: ['Object Storage', 'Zero Egress', 'S3 Compatible'],
    pricing: 'pay-as-you-go',
    status: 'stable',
  },
  {
    id: 'supabase-storage',
    name: 'Supabase Storage',
    provider: 'Supabase',
    category: 'storage',
    description: 'File storage with CDN and transformations',
    features: ['File Storage', 'CDN', 'Image Transforms', 'Auth'],
    pricing: 'free',
    status: 'stable',
  },
  // Analytics
  {
    id: 'posthog',
    name: 'PostHog',
    provider: 'PostHog',
    category: 'analytics',
    description: 'Product analytics with feature flags',
    features: ['Analytics', 'Feature Flags', 'Session Replay', 'A/B Tests'],
    pricing: 'free',
    status: 'stable',
  },
];

const CONSUMPTION_MODELS: ConsumptionModel[] = [
  {
    id: 'pay-as-you-go',
    name: 'Pay-as-you-go',
    description: 'Pay only for what you use with no commitments',
    features: ['No minimum', 'Scale up/down', 'Per-token billing', 'Usage dashboard'],
    recommended: true,
  },
  {
    id: 'provisioned',
    name: 'Provisioned Throughput',
    description: 'Reserved capacity for predictable workloads',
    features: ['Guaranteed capacity', 'Lower latency', 'Volume discounts', 'SLA included'],
  },
  {
    id: 'priority',
    name: 'Priority Pay-as-you-go',
    description: 'Higher priority queue access during peak times',
    features: ['Priority queue', 'Faster response', 'Pay-as-you-go + premium'],
  },
  {
    id: 'flex',
    name: 'Flex',
    description: 'Flexible pricing based on usage patterns',
    features: ['Adaptive pricing', 'Off-peak discounts', 'Burst capacity'],
  },
  {
    id: 'batch',
    name: 'Batch Processing',
    description: 'Discounted rates for async batch jobs',
    features: ['50% discount', 'Async processing', '24hr turnaround', 'Bulk uploads'],
  },
];

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const SparkleIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ModelStatus }) {
  const styles = {
    stable: { bg: '#22c55e20', color: '#22c55e', text: 'Stable' },
    preview: { bg: '#3b82f620', color: '#3b82f6', text: 'Preview' },
    beta: { bg: '#f59e0b20', color: '#f59e0b', text: 'Beta' },
    deprecated: { bg: '#ef444420', color: '#ef4444', text: 'Deprecated' },
  };
  const style = styles[status];

  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {style.text}
    </span>
  );
}

function PricingBadge({ tier }: { tier: PricingTier }) {
  const styles = {
    free: { bg: '#22c55e20', color: '#22c55e', text: 'Free' },
    'pay-as-you-go': { bg: '#3b82f620', color: '#3b82f6', text: 'Pay-as-you-go' },
    provisioned: { bg: '#a855f720', color: '#a855f7', text: 'Provisioned' },
    enterprise: { bg: AIMS_CIRCUIT_COLORS.primary + '30', color: AIMS_CIRCUIT_COLORS.accent, text: 'Enterprise' },
  };
  const style = styles[tier];

  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {style.text}
    </span>
  );
}

// User-friendly category labels
const CATEGORY_LABELS: Record<ModelCategory, string> = {
  'agent-platform': 'AI Agents',
  'assistant': 'Smart Assistants',
  'researcher': 'Research & Analysis',
  'coder': 'Code & Development',
  'creative': 'Creative & Media',
  'specialist': 'Specialists',
};

function ModelCard({
  model,
  enabled,
  onToggle,
}: {
  model: AIModel;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-4 rounded-xl transition-all"
      style={{
        backgroundColor: enabled ? AIMS_CIRCUIT_COLORS.primary + '10' : '#1a2234',
        border: enabled
          ? `2px solid ${AIMS_CIRCUIT_COLORS.primary}`
          : '1px solid #2d3a4d',
      }}
    >
      {model.popular && (
        <div
          className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{
            backgroundColor: AIMS_CIRCUIT_COLORS.accent,
            color: '#000',
          }}
        >
          Popular
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div>
          {/* User-friendly name first, technical name smaller */}
          <h3 className="text-lg font-semibold text-white">{model.friendlyName}</h3>
          <p className="text-xs text-gray-500">{model.name} • {model.provider}</p>
        </div>
        <button
          onClick={onToggle}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            enabled ? 'bg-green-500' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {enabled ? (
            <CheckIcon className="w-5 h-5 text-white" />
          ) : (
            <PlusIcon className="w-5 h-5 text-gray-300" />
          )}
        </button>
      </div>

      {/* Use case in plain English */}
      <p className="text-sm text-amber-300/80 mb-2">{model.useCase}</p>
      <p className="text-sm text-gray-400 mb-3">{model.description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {model.capabilities.map((cap) => (
          <span
            key={cap}
            className="px-2 py-0.5 rounded text-xs"
            style={{ backgroundColor: '#0f172a', color: AIMS_CIRCUIT_COLORS.secondary }}
          >
            {cap}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex gap-2">
          <StatusBadge status={model.status} />
          <PricingBadge tier={model.pricing} />
        </div>
        {model.contextWindow && (
          <span className="text-gray-500">{model.contextWindow} context</span>
        )}
      </div>

      {(model.inputCost || model.outputCost) && (
        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-400">
          <span>Input: {model.inputCost}</span>
          <span>Output: {model.outputCost}</span>
        </div>
      )}
    </motion.div>
  );
}

function ToolCard({
  tool,
  enabled,
  onToggle,
}: {
  tool: Tool;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl transition-all"
      style={{
        backgroundColor: enabled ? AIMS_CIRCUIT_COLORS.primary + '10' : '#1a2234',
        border: enabled
          ? `2px solid ${AIMS_CIRCUIT_COLORS.primary}`
          : '1px solid #2d3a4d',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
          <p className="text-sm text-gray-400">{tool.provider}</p>
        </div>
        <button
          onClick={onToggle}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            enabled ? 'bg-green-500' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {enabled ? (
            <CheckIcon className="w-5 h-5 text-white" />
          ) : (
            <PlusIcon className="w-5 h-5 text-gray-300" />
          )}
        </button>
      </div>

      <p className="text-sm text-gray-400 mb-3">{tool.description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {tool.features.map((feature) => (
          <span
            key={feature}
            className="px-2 py-0.5 rounded text-xs"
            style={{ backgroundColor: '#0f172a', color: AIMS_CIRCUIT_COLORS.secondary }}
          >
            {feature}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs">
        <StatusBadge status={tool.status} />
        <PricingBadge tier={tool.pricing} />
      </div>
    </motion.div>
  );
}

function ConsumptionCard({ model }: { model: ConsumptionModel }) {
  return (
    <div
      className={`relative p-4 rounded-xl ${model.recommended ? 'ring-2' : ''}`}
      style={{
        backgroundColor: '#1a2234',
        border: '1px solid #2d3a4d',
        '--tw-ring-color': model.recommended ? AIMS_CIRCUIT_COLORS.accent : undefined,
      } as React.CSSProperties}
    >
      {model.recommended && (
        <div
          className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: AIMS_CIRCUIT_COLORS.accent,
            color: '#000',
          }}
        >
          Recommended
        </div>
      )}

      <h3 className="text-lg font-semibold text-white mb-2">{model.name}</h3>
      <p className="text-sm text-gray-400 mb-4">{model.description}</p>

      <ul className="space-y-2">
        {model.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <SparkleIcon className="w-4 h-4" style={{ color: AIMS_CIRCUIT_COLORS.primary }} />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function ModelGardenPage() {
  const [activeTab, setActiveTab] = useState<'models' | 'tools' | 'consumption'>('models');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [enabledModels, setEnabledModels] = useState<Set<string>>(new Set(['claude-opus-4.6', 'claude-sonnet-4.5']));
  const [enabledTools, setEnabledTools] = useState<Set<string>>(new Set(['brave-search', 'elevenlabs']));

  const toggleModel = (id: string) => {
    setEnabledModels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleTool = (id: string) => {
    setEnabledTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredModels = AI_MODELS.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || model.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredTools = TOOLS.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const modelCategories: string[] = ['all', ...Array.from(new Set(AI_MODELS.map((m) => m.category)))];
  const toolCategories: string[] = ['all', ...Array.from(new Set(TOOLS.map((t) => t.category)))];

  // Helper to get friendly category label
  const getCategoryLabel = (cat: string) => {
    if (cat === 'all') return 'All';
    return CATEGORY_LABELS[cat as ModelCategory] || cat;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0f1a' }}>
      <CircuitBoardPattern density="sparse" animated={false} glowIntensity={0.1} />

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${AIMS_CIRCUIT_COLORS.primary}, ${AIMS_CIRCUIT_COLORS.accent})`,
                boxShadow: `0 0 20px ${AIMS_CIRCUIT_COLORS.glow}`,
              }}
            >
              <SparkleIcon className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: AIMS_CIRCUIT_COLORS.secondary }}>
                Model Garden
              </h1>
              <p className="text-gray-400">
                Add AI capabilities to your business — just pick what you need
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6">
            <div
              className="px-6 py-4 rounded-xl"
              style={{ backgroundColor: '#1a2234', border: '1px solid #2d3a4d' }}
            >
              <div className="text-3xl font-bold" style={{ color: AIMS_CIRCUIT_COLORS.accent }}>
                {AI_MODELS.length}+
              </div>
              <div className="text-sm text-gray-400">AI Models</div>
            </div>
            <div
              className="px-6 py-4 rounded-xl"
              style={{ backgroundColor: '#1a2234', border: '1px solid #2d3a4d' }}
            >
              <div className="text-3xl font-bold" style={{ color: AIMS_CIRCUIT_COLORS.accent }}>
                {TOOLS.length}+
              </div>
              <div className="text-sm text-gray-400">Tools & Services</div>
            </div>
            <div
              className="px-6 py-4 rounded-xl"
              style={{ backgroundColor: '#1a2234', border: '1px solid #2d3a4d' }}
            >
              <div className="text-3xl font-bold text-green-500">
                {enabledModels.size + enabledTools.size}
              </div>
              <div className="text-sm text-gray-400">Enabled in Your App</div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          {[
            { id: 'models', label: 'AI Models' },
            { id: 'tools', label: 'Tools & Services' },
            { id: 'consumption', label: 'Consumption Models' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setCategoryFilter('all');
              }}
              className="px-6 py-3 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: activeTab === tab.id ? AIMS_CIRCUIT_COLORS.primary + '20' : 'transparent',
                color: activeTab === tab.id ? AIMS_CIRCUIT_COLORS.accent : '#9ca3af',
                border: activeTab === tab.id ? `1px solid ${AIMS_CIRCUIT_COLORS.primary}60` : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        {activeTab !== 'consumption' && (
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models or providers..."
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <FilterIcon className="w-5 h-5 text-gray-500" />
              {(activeTab === 'models' ? modelCategories : toolCategories).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className="px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: categoryFilter === cat ? AIMS_CIRCUIT_COLORS.primary + '20' : '#1f2937',
                    color: categoryFilter === cat ? AIMS_CIRCUIT_COLORS.accent : '#9ca3af',
                    border: categoryFilter === cat ? `1px solid ${AIMS_CIRCUIT_COLORS.primary}60` : '1px solid #374151',
                  }}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'models' && (
            <motion.div
              key="models"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  enabled={enabledModels.has(model.id)}
                  onToggle={() => toggleModel(model.id)}
                />
              ))}
            </motion.div>
          )}

          {activeTab === 'tools' && (
            <motion.div
              key="tools"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  enabled={enabledTools.has(tool.id)}
                  onToggle={() => toggleTool(tool.id)}
                />
              ))}
            </motion.div>
          )}

          {activeTab === 'consumption' && (
            <motion.div
              key="consumption"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2" style={{ color: AIMS_CIRCUIT_COLORS.secondary }}>
                  Flexible consumption models across A.I.M.S.
                </h2>
                <p className="text-gray-400">
                  Choose the pricing model that fits your workload
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {CONSUMPTION_MODELS.map((model) => (
                  <ConsumptionCard key={model.id} model={model} />
                ))}
              </div>

              {/* Architecture Overview */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6" style={{ color: AIMS_CIRCUIT_COLORS.secondary }}>
                  A.I.M.S. Platform Architecture
                </h2>

                <div
                  className="p-6 rounded-2xl"
                  style={{ backgroundColor: '#1a2234', border: '1px solid #2d3a4d' }}
                >
                  {/* AI Applications Layer */}
                  <div className="mb-6">
                    <div className="text-center text-gray-400 mb-3">
                      AI Applications <span className="text-gray-500">For business users</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {['ACHEEVY Assistant', 'House of Ang', 'Sports Tracker', 'Customer Engagement'].map((app) => (
                        <div
                          key={app}
                          className="px-4 py-3 rounded-lg text-center text-sm font-medium"
                          style={{ backgroundColor: '#f97316', color: '#fff' }}
                        >
                          {app}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* A.I.M.S. Core */}
                  <div
                    className="p-4 rounded-xl mb-6"
                    style={{ backgroundColor: '#0f172a', border: '1px solid #2d3a4d' }}
                  >
                    <div className="text-center mb-4" style={{ color: AIMS_CIRCUIT_COLORS.accent }}>
                      A.I.M.S. <span className="text-gray-400">for all your model and agent needs</span>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      {/* Model Garden */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium" style={{ color: '#3b82f6' }}>Model Garden</div>
                        {['OpenRouter Models', 'Partner Models', 'Open Source', 'Custom Models'].map((item) => (
                          <div
                            key={item}
                            className="px-3 py-2 rounded text-xs"
                            style={{ backgroundColor: '#3b82f620', color: '#93c5fd' }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>

                      {/* Build & Deploy */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium" style={{ color: '#eab308' }}>Build & Deploy</div>
                        {['Circuit Box', 'Boomer_Ang Studio', 'Change Orders', 'Deployment'].map((item) => (
                          <div
                            key={item}
                            className="px-3 py-2 rounded text-xs"
                            style={{ backgroundColor: '#eab30820', color: '#fde047' }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>

                      {/* Enterprise */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium" style={{ color: '#22c55e' }}>Enterprise & Tools</div>
                        {['Brave Search', 'ElevenLabs Voice', 'SAM Vision', 'Integrations'].map((item) => (
                          <div
                            key={item}
                            className="px-3 py-2 rounded text-xs"
                            style={{ backgroundColor: '#22c55e20', color: '#86efac' }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>

                      {/* Agent Engine */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium" style={{ color: '#a855f7' }}>Agent Engine</div>
                        {['LUC ADK', 'Boomer_Ang Registry', 'Orchestration', 'Agent Ops'].map((item) => (
                          <div
                            key={item}
                            className="px-3 py-2 rounded text-xs"
                            style={{ backgroundColor: '#a855f720', color: '#d8b4fe' }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Infrastructure */}
                  <div
                    className="p-4 rounded-xl text-center"
                    style={{ backgroundColor: '#0f172a', border: '1px solid #2d3a4d' }}
                  >
                    <div className="text-lg font-medium text-white">Infrastructure</div>
                    <div className="text-sm text-gray-400">
                      OpenRouter Gateway • Cloudflare Workers • Edge Deployment
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <div
            className="inline-flex flex-col items-center gap-4 px-8 py-6 rounded-2xl"
            style={{
              backgroundColor: '#1a2234',
              border: `1px solid ${AIMS_CIRCUIT_COLORS.primary}40`,
            }}
          >
            <p className="text-gray-400">
              {enabledModels.size + enabledTools.size} items selected for your app
            </p>
            <button
              className="px-8 py-3 rounded-xl font-semibold text-black transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${AIMS_CIRCUIT_COLORS.primary}, ${AIMS_CIRCUIT_COLORS.accent})`,
                boxShadow: `0 0 20px ${AIMS_CIRCUIT_COLORS.glow}`,
              }}
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
