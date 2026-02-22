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
  'system': 'text-white/40',
  'user': 'text-white',
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  thought: { label: 'THINK', color: 'bg-blue-500/20 text-blue-400' },
  action: { label: 'ACT', color: 'bg-green-500/20 text-green-400' },
  result: { label: 'RESULT', color: 'bg-gold/20 text-gold' },
  coordination: { label: 'COORD', color: 'bg-purple-500/20 text-purple-400' },
  question: { label: 'ASK', color: 'bg-orange-500/20 text-orange-400' },
  user: { label: 'USER', color: 'bg-white/20 text-white' },
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

      // Show real intent classification
      if (result.intent) {
        addLog('acheevy', 'ACHEEVY', 'result',
          `Intent: **${result.intent.primary_intent}** (confidence: ${(result.intent.confidence * 100).toFixed(0)}%)`);
        addLog('acheevy', 'ACHEEVY', 'coordination',
          `Strategy: ${result.intent.execution_strategy} | Capabilities needed: ${result.intent.capabilities_needed?.join(', ') || 'none'}`);
      }

      // Show real dispatched agents
      if (result.boomerangs_dispatched && result.boomerangs_dispatched.length > 0) {
        const dispatched = result.boomerangs_dispatched;
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
        addLog('acheevy', 'ACHEEVY', 'coordination', 'No agents available for this task type');
        setAgents(prev => prev.map(a => ({ ...a, status: 'done' })));
      }

      // Show real action plan
      if (result.action_plan) {
        for (const step of result.action_plan) {
          addLog('acheevy', 'ACHEEVY', 'coordination',
            `Step ${step.step}: ${step.description} [${step.status}]`);
        }
      }

      // Show real LUC cost
      if (result.luc_debit) {
        addLog('system', 'System', 'result',
          `Estimated cost: ${result.luc_debit.tokens_used} tokens ($${result.luc_debit.usd_cost.toFixed(6)})`);
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
          <h1 className="text-lg font-medium text-white">LiveSim</h1>
          <p className="text-sm text-white/40">Send real tasks to ACHEEVY and watch the orchestration</p>
        </div>
        {sessionId && (
          <span className="text-xs font-mono text-white/20">{sessionId}</span>
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
                <h2 className="text-xl font-medium text-white mb-2">Start a LiveSim Session</h2>
                <p className="text-white/40 text-sm mb-6">
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
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-gold/30"
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
                  const agentColor = AGENT_COLORS[log.agentId] || 'text-white/70';

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-3 items-start text-sm"
                    >
                      <span className="text-white/20 font-mono text-xs min-w-[60px] pt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className={`font-medium min-w-[100px] ${agentColor}`}>
                        {log.agentName}
                      </span>
                      <span className="text-white/70 flex-1">{log.content}</span>
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
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder:text-white/20 outline-none focus:border-gold/30 disabled:opacity-30"
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
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">Crew Status</h3>
            {agents.map((agent) => (
              <div key={agent.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      agent.status === 'idle' ? 'bg-white/20' :
                      agent.status === 'thinking' ? 'bg-blue-400 animate-pulse' :
                      agent.status === 'working' ? 'bg-green-400 animate-pulse' :
                      agent.status === 'waiting' ? 'bg-orange-400' :
                      'bg-gold'
                    }`}
                  />
                  <span className={`text-sm font-medium ${AGENT_COLORS[agent.id] || 'text-white/70'}`}>
                    {agent.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/30">{agent.role}</span>
                  <span className="text-[10px] text-white/20 uppercase">{agent.status}</span>
                </div>
              </div>
            ))}

            {/* Task summary */}
            {taskDescription && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Current Task</h3>
                <p className="text-xs text-white/50">{taskDescription}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
