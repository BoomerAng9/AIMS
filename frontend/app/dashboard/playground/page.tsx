'use client';

/**
 * /dashboard/playground — Playground & Sandbox Command Center
 *
 * 5 sandbox types: Code, Prompt, Agent, Training, Education
 * Wires the backend playground engine into a real user-facing UI.
 *
 * Code Sandbox: Write and execute code (Python/Node/Bash) via E2B
 * Prompt Playground: Test prompts across multiple models
 * Agent Testing: Test Custom Lil_Hawks before deploying
 * Training Data: Annotation and evaluation tasks
 * Education: AI tutor with interactive workspaces
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────

type PlaygroundType = 'code' | 'prompt' | 'agent' | 'training' | 'education';

interface PlaygroundSession {
  id: string;
  type: PlaygroundType;
  name: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}

interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  error?: string;
  engine?: string;
}

// ── Playground Type Config ──────────────────────────────────

const PLAYGROUND_TYPES: Array<{
  id: PlaygroundType;
  name: string;
  description: string;
  icon: string;
  color: string;
  bg: string;
}> = [
  {
    id: 'code',
    name: 'Code Sandbox',
    description: 'Write and run Python, Node.js, or Bash in an isolated sandbox',
    icon: '{ }',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    id: 'prompt',
    name: 'Prompt Playground',
    description: 'Test prompts across multiple AI models side-by-side',
    icon: 'AI',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'agent',
    name: 'Agent Testing',
    description: 'Test Custom Lil_Hawks in a safe sandbox before deploying',
    icon: 'AG',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
  {
    id: 'training',
    name: 'Training Data',
    description: 'Annotation, evaluation, and data labeling tasks',
    icon: 'TD',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Interactive learning workspace with AI tutor',
    icon: 'ED',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
];

// ── Code Editor Component ────────────────────────────────────

function CodeEditor({
  onExecute,
  isExecuting,
  result,
}: {
  onExecute: (code: string, language: string) => void;
  isExecuting: boolean;
  result: ExecutionResult | null;
}) {
  const [code, setCode] = useState('# Write your code here\nprint("Hello from AIMS Playground!")\n');
  const [language, setLanguage] = useState('python');

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/8">
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-xs bg-[#18181B] border border-white/10 rounded-lg px-3 py-1.5 text-zinc-300 outline-none"
          >
            <option value="python">Python</option>
            <option value="node">Node.js</option>
            <option value="bash">Bash</option>
          </select>
          <span className="text-[10px] text-zinc-600 font-mono">{code.split('\n').length} lines</span>
        </div>
        <button
          onClick={() => onExecute(code, language)}
          disabled={isExecuting || !code.trim()}
          className={`
            flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all
            ${isExecuting
              ? 'bg-[#18181B] text-zinc-500 cursor-wait'
              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/20'
            }
          `}
        >
          {isExecuting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Run
            </>
          )}
        </button>
      </div>

      {/* Editor + Output Split */}
      <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5 min-h-0">
        {/* Code Input */}
        <div className="flex-1 min-h-0">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="w-full h-full bg-transparent text-zinc-200 font-mono text-sm p-4 outline-none resize-none leading-relaxed"
            placeholder={`# ${language === 'python' ? 'Python' : language === 'node' ? 'JavaScript' : 'Bash'} code here...`}
          />
        </div>

        {/* Output Panel */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="px-4 py-2 border-b border-white/8 flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">Output</span>
            {result && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${result.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                exit: {result.exitCode}
              </span>
            )}
            {result?.engine && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18181B] text-zinc-600 font-mono">
                {result.engine}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-sm">
            {!result && !isExecuting && (
              <p className="text-zinc-600 italic">Run your code to see output here</p>
            )}
            {isExecuting && (
              <div className="flex items-center gap-2 text-zinc-500">
                <div className="w-3 h-3 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
                Executing in sandbox...
              </div>
            )}
            {result?.stdout && (
              <pre className="text-green-400/80 whitespace-pre-wrap">{result.stdout}</pre>
            )}
            {result?.stderr && (
              <pre className="text-red-400/80 whitespace-pre-wrap mt-2">{result.stderr}</pre>
            )}
            {result?.error && (
              <pre className="text-red-400 whitespace-pre-wrap mt-2">Error: {result.error}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Prompt Playground Component ──────────────────────────────

function PromptPlayground() {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [responses, setResponses] = useState<Array<{ model: string; response: string; loading: boolean }>>([]);

  const models = [
    { id: 'nano-banana', label: 'Nano Banana Pro' },
    { id: 'claude-sonnet', label: 'Claude Sonnet 4.5' },
    { id: 'qwen', label: 'Qwen 2.5 Coder' },
  ];

  const runPrompt = useCallback(async () => {
    if (!prompt.trim()) return;

    setResponses(models.map(m => ({ model: m.label, response: '', loading: true })));

    // Fire all model requests in parallel
    const results = await Promise.allSettled(
      models.map(async (m) => {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            model: m.id,
          }),
        });
        const text = await res.text();
        // Parse Vercel AI SDK stream format
        const lines = text.split('\n').filter(l => l.startsWith('0:'));
        return lines.map(l => {
          try { return JSON.parse(l.slice(2)); } catch { return l.slice(2); }
        }).join('');
      }),
    );

    setResponses(models.map((m, i) => ({
      model: m.label,
      response: results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<string>).value : `Error: ${(results[i] as PromiseRejectedResult).reason}`,
      loading: false,
    })));
  }, [prompt]);

  return (
    <div className="flex flex-col h-full">
      {/* System Prompt */}
      <div className="px-4 py-3 border-b border-white/8">
        <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={2}
          className="w-full mt-1 bg-[#111113] border border-white/8 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none resize-none"
        />
      </div>

      {/* User Prompt + Run */}
      <div className="px-4 py-3 border-b border-white/8">
        <div className="flex gap-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt to test across models..."
            rows={3}
            className="flex-1 bg-[#111113] border border-white/8 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none resize-none"
          />
          <button
            onClick={runPrompt}
            disabled={!prompt.trim() || responses.some(r => r.loading)}
            className="self-end px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:bg-blue-500/30 text-sm font-medium transition-all disabled:opacity-40"
          >
            Compare
          </button>
        </div>
      </div>

      {/* Model Responses */}
      <div className="flex-1 overflow-auto p-4">
        {responses.length === 0 ? (
          <div className="text-center py-12 text-zinc-600">
            <p className="text-sm">Enter a prompt and click Compare to test across models</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {responses.map((r, i) => (
              <div key={i} className="wireframe-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-zinc-400">{r.model}</span>
                  {r.loading && <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
                </div>
                <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {r.loading ? 'Generating...' : r.response || 'No response'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Coming Soon Placeholder ──────────────────────────────────

function ComingSoonPanel({ type }: { type: typeof PLAYGROUND_TYPES[number] }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center py-12 max-w-md">
        <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl border flex items-center justify-center ${type.bg}`}>
          <span className={`text-xl font-bold ${type.color}`}>{type.icon}</span>
        </div>
        <h3 className="text-lg font-medium text-zinc-200 mb-2">{type.name}</h3>
        <p className="text-sm text-zinc-500 mb-6">{type.description}</p>
        <span className="text-xs px-3 py-1.5 rounded-full bg-[#18181B] text-zinc-500 border border-white/10">
          Coming Soon
        </span>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function PlaygroundPage() {
  const [activeType, setActiveType] = useState<PlaygroundType>('code');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [sessions, setSessions] = useState<PlaygroundSession[]>([]);

  const handleExecute = useCallback(async (code: string, language: string) => {
    setIsExecuting(true);
    setResult(null);

    try {
      const res = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        stdout: '',
        stderr: '',
        exitCode: 1,
        error: err instanceof Error ? err.message : 'Execution failed',
      });
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const activeConfig = PLAYGROUND_TYPES.find(t => t.id === activeType)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-[calc(100vh-64px)] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Playground</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Sandbox environments for code, prompts, agents, and training</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600 font-mono">{sessions.length} sessions</span>
        </div>
      </div>

      {/* Type Tabs */}
      <div className="flex items-center gap-1 px-6 py-3 border-b border-white/8 overflow-x-auto">
        {PLAYGROUND_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveType(type.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${activeType === type.id
                ? `${type.bg} ${type.color} border`
                : 'text-zinc-500 hover:text-zinc-400 hover:bg-white/5'
              }
            `}
          >
            <span className="text-[10px] font-bold">{type.icon}</span>
            {type.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 bg-[#111113]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeType}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeType === 'code' && (
              <CodeEditor
                onExecute={handleExecute}
                isExecuting={isExecuting}
                result={result}
              />
            )}
            {activeType === 'prompt' && <PromptPlayground />}
            {activeType !== 'code' && activeType !== 'prompt' && (
              <ComingSoonPanel type={activeConfig} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
