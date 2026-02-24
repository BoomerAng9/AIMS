'use client';

/**
 * /dashboard/livesim — LiveSim Agent Space
 *
 * Sends real tasks to ACHEEVY and displays actual orchestration results.
 * Shows which agents ACHEEVY routes to, the real intent classification,
 * and the actual action plan — no setTimeout theater.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface SimLogEntry {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: 'thought' | 'action' | 'result' | 'coordination' | 'question' | 'user';
  content: string;
}

interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'thinking' | 'working' | 'waiting' | 'done';
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Agent color mapping
// ─────────────────────────────────────────────────────────────

const AGENT_COLORS: Record<string, string> = {
  'acheevy': 'text-gold',
  'system': 'text-zinc-500',
  'user': 'text-zinc-100',
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  thought: { label: 'THINK', color: 'bg-blue-500/20 text-blue-400' },
  action: { label: 'ACT', color: 'bg-green-500/20 text-green-400' },
  result: { label: 'RESULT', color: 'bg-gold/20 text-gold' },
  coordination: { label: 'COORD', color: 'bg-purple-500/20 text-purple-400' },
  question: { label: 'ASK', color: 'bg-orange-500/20 text-orange-400' },
  user: { label: 'USER', color: 'bg-[#1F1F23] text-zinc-100' },
};

// ─────────────────────────────────────────────────────────────
// LiveSim Page — Real ACHEEVY calls
// ─────────────────────────────────────────────────────────────

export default function LiveSimPage() {
  const [taskDescription, setTaskDescription] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<SimLogEntry[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [question, setQuestion] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Helper to add a log entry
  const addLog = useCallback((agentId: string, agentName: string, type: SimLogEntry['type'], content: string) => {
    setLogs(prev => [...prev, {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      agentId,
      agentName,
      type,
      content,
    }]);
  }, []);

  // Start a real LiveSim session — calls ACHEEVY /chat
  const startSession = useCallback(async () => {
    if (!taskDescription.trim()) return;

    const newSessionId = `livesim-${Date.now()}`;
    setSessionId(newSessionId);
    setIsRunning(true);
    setLogs([]);
    setAgents([
      { id: 'acheevy', name: 'ACHEEVY', role: 'Executive Orchestrator', status: 'thinking' },
    ]);

    addLog('system', 'System', 'coordination', `Session ${newSessionId} started`);
    addLog('user', 'You', 'user', taskDescription);
    addLog('acheevy', 'ACHEEVY', 'thought', 'Analyzing intent and routing to House of Ang...');

    try {
      // Real API call to ACHEEVY
      const res = await fetch('/api/acheevy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: newSessionId,
          message: taskDescription,
        }),
      });

      if (!res.ok) {
        throw new Error(`ACHEEVY returned ${res.status}`);
      }

      const result = await res.json();

      // Tag the source so user knows if this is real or fallback
      if (result.source === 'local-fallback') {
        addLog('system', 'System', 'coordination',
          'ACHEEVY and UEF Gateway are offline — showing limited local analysis');
      }

      // Show real intent classification
      // API returns camelCase: result.intent with .name, .confidence, .capabilities
      const intent = result.intent;
      if (intent) {
        const intentName = intent.primary_intent || intent.name || 'unknown';
        const confidence = intent.confidence ?? 0;
        addLog('acheevy', 'ACHEEVY', 'result',
          `Intent: **${intentName}** (confidence: ${(confidence * 100).toFixed(0)}%)`);
        const strategy = intent.execution_strategy || intent.strategy;
        const caps = intent.capabilities_needed || intent.capabilities || [];
        if (strategy || caps.length) {
          addLog('acheevy', 'ACHEEVY', 'coordination',
            `${strategy ? `Strategy: ${strategy} | ` : ''}Capabilities: ${caps.join(', ') || 'none'}`);
        }
      }

      // Show dispatched agents — API returns camelCase "boomerangsDispatched"
      const dispatched = result.boomerangsDispatched || result.boomerangs_dispatched;
      if (dispatched && dispatched.length > 0) {
        const agentStatuses: AgentStatus[] = [
          { id: 'acheevy', name: 'ACHEEVY', role: 'Executive Orchestrator', status: 'done' },
          ...dispatched.map((d: { id: string; name: string; status: string }) => ({
            id: d.id,
            name: d.name,
            role: d.status,
            status: 'waiting' as const,
          })),
        ];
        setAgents(agentStatuses);

        addLog('acheevy', 'ACHEEVY', 'action',
          `Dispatched ${dispatched.length} agent(s): ${dispatched.map((d: { name: string }) => d.name).join(', ')}`);
      } else {
        addLog('acheevy', 'ACHEEVY', 'coordination', 'No agents dispatched for this task');
        setAgents(prev => prev.map(a => ({ ...a, status: 'done' })));
      }

      // Show action plan — API returns camelCase "actionPlan"
      const actionPlan = result.actionPlan || result.action_plan;
      if (actionPlan) {
        for (const step of actionPlan) {
          addLog('acheevy', 'ACHEEVY', 'coordination',
            `Step ${step.step}: ${step.description || step.action} [${step.status}]`);
        }
      }

      // Show LUC cost — API returns camelCase "lucDebit"
      const lucDebit = result.lucDebit || result.luc_debit;
      if (lucDebit && typeof lucDebit === 'object') {
        const tokens = lucDebit.tokens_used || lucDebit.tokensUsed || 0;
        const usd = lucDebit.usd_cost || lucDebit.usdCost || 0;
        if (tokens > 0) {
          addLog('system', 'System', 'result',
            `Estimated cost: ${tokens} tokens ($${Number(usd).toFixed(6)})`);
        }
      }

      // Show ACHEEVY's real response
      if (result.reply) {
        addLog('acheevy', 'ACHEEVY', 'result', result.reply);
      }

      setAgents(prev => prev.map(a => ({ ...a, status: 'done' })));
    } catch (err) {
      addLog('system', 'System', 'result',
        `Error: ${err instanceof Error ? err.message : 'Failed to reach ACHEEVY'}`);
      setAgents(prev => prev.map(a => ({ ...a, status: 'idle' })));
    } finally {
      setIsRunning(false);
    }
  }, [taskDescription, addLog]);

  // Send a follow-up question to ACHEEVY
  const askCrew = useCallback(async () => {
    if (!question.trim() || !sessionId) return;

    const q = question;
    setQuestion('');
    addLog('user', 'You', 'user', q);
    setIsRunning(true);
    setAgents(prev => prev.map(a => a.id === 'acheevy' ? { ...a, status: 'thinking' } : a));

    try {
      const res = await fetch('/api/acheevy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: q }),
      });

      if (!res.ok) throw new Error(`ACHEEVY returned ${res.status}`);
      const result = await res.json();

      if (result.reply) {
        addLog('acheevy', 'ACHEEVY', 'result', result.reply);
      }

      setAgents(prev => prev.map(a => ({ ...a, status: 'done' })));
    } catch (err) {
      addLog('system', 'System', 'result',
        `Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsRunning(false);
    }
  }, [question, sessionId, addLog]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-[calc(100vh-64px)] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h1 className="text-lg font-medium text-zinc-100">LiveSim</h1>
          <p className="text-sm text-zinc-500">Send real tasks to ACHEEVY and watch the orchestration</p>
        </div>
        {sessionId && (
          <span className="text-xs font-mono text-zinc-600">{sessionId}</span>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Log Feed */}
        <div className="flex-1 flex flex-col">
          {/* Task Input (when no logs yet) */}
          {logs.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-lg w-full text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <PlayIcon className="w-8 h-8 text-gold" />
                </div>
                <h2 className="text-xl font-medium text-zinc-100 mb-2">Start a LiveSim Session</h2>
                <p className="text-zinc-500 text-sm mb-6">
                  Describe a task. ACHEEVY will classify it, route to real agents, and return
                  an actual action plan with LUC cost estimates.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && startSession()}
                    placeholder="e.g., Research competitors for a SaaS launch..."
                    className="flex-1 bg-[#18181B] border border-white/10 rounded-xl px-4 py-3 text-zinc-100 text-sm placeholder:text-zinc-600 outline-none focus:border-gold/30"
                  />
                  <button
                    onClick={startSession}
                    disabled={!taskDescription.trim() || isRunning}
                    className="px-6 py-3 rounded-xl bg-gold text-black font-medium text-sm hover:bg-gold-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Launch
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Log Stream */}
          {logs.length > 0 && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <AnimatePresence>
                {logs.map((log) => {
                  const typeInfo = TYPE_LABELS[log.type] || TYPE_LABELS.action;
                  const agentColor = AGENT_COLORS[log.agentId] || 'text-zinc-300';

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-3 items-start text-sm"
                    >
                      <span className="text-zinc-600 font-mono text-xs min-w-[60px] pt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className={`font-medium min-w-[100px] ${agentColor}`}>
                        {log.agentName}
                      </span>
                      <span className="text-zinc-300 flex-1">{log.content}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
          )}

          {/* Follow-up input */}
          {logs.length > 0 && (
            <div className="border-t border-white/10 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askCrew()}
                  placeholder={isRunning ? 'Processing...' : 'Send a follow-up to ACHEEVY...'}
                  disabled={isRunning}
                  className="flex-1 bg-[#18181B] border border-white/10 rounded-lg px-4 py-2 text-zinc-100 text-sm placeholder:text-zinc-600 outline-none focus:border-gold/30 disabled:opacity-30"
                />
                <button
                  onClick={askCrew}
                  disabled={!question.trim() || isRunning}
                  className="p-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Agent Status Sidebar */}
        {logs.length > 0 && (
          <div className="w-64 border-l border-white/10 p-4 space-y-3">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Crew Status</h3>
            {agents.map((agent) => (
              <div key={agent.id} className="p-3 rounded-lg bg-[#18181B] border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      agent.status === 'idle' ? 'bg-[#1F1F23]' :
                      agent.status === 'thinking' ? 'bg-blue-400 animate-pulse' :
                      agent.status === 'working' ? 'bg-green-400 animate-pulse' :
                      agent.status === 'waiting' ? 'bg-orange-400' :
                      'bg-gold'
                    }`}
                  />
                  <span className={`text-sm font-medium ${AGENT_COLORS[agent.id] || 'text-zinc-300'}`}>
                    {agent.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">{agent.role}</span>
                  <span className="text-[10px] text-zinc-600 uppercase">{agent.status}</span>
                </div>
              </div>
            ))}

            {/* Task summary */}
            {taskDescription && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Current Task</h3>
                <p className="text-xs text-zinc-400">{taskDescription}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
