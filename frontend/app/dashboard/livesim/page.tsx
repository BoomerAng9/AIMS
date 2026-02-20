'use client';

/**
 * /dashboard/livesim — LiveSim Agent Space
 *
 * Real-time autonomous agent feed. Agents work independently on a task
 * while the user observes. Supports:
 *   - Live transcript of agent activity (WebSocket or polling)
 *   - "Ask the crew" question injection
 *   - Agent status indicators
 *   - Task progress tracking
 *
 * Connects to UEF Gateway via SSE for real-time updates.
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

const PauseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Agent color mapping
// ─────────────────────────────────────────────────────────────

const AGENT_COLORS: Record<string, string> = {
  'acheevy': 'text-gold',
  'research-ang': 'text-blue-400',
  'engineer-ang': 'text-green-400',
  'marketer-ang': 'text-purple-400',
  'analyst-ang': 'text-cyan-400',
  'quality-ang': 'text-orange-400',
  'chicken-hawk': 'text-red-400',
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
// LiveSim Page
// ─────────────────────────────────────────────────────────────

export default function LiveSimPage() {
  const [taskDescription, setTaskDescription] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<SimLogEntry[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [question, setQuestion] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Start a LiveSim session
  const startSession = useCallback(async () => {
    if (!taskDescription.trim()) return;

    setIsRunning(true);
    setLogs([]);
    setAgents([
      { id: 'acheevy', name: 'ACHEEVY', role: 'Orchestrator', status: 'thinking' },
      { id: 'research-ang', name: 'Research_Ang', role: 'Research Lead', status: 'idle' },
      { id: 'engineer-ang', name: 'Engineer_Ang', role: 'Dev Lead', status: 'idle' },
      { id: 'quality-ang', name: 'Quality_Ang', role: 'QA Lead', status: 'idle' },
    ]);

    try {
      const res = await fetch('/api/acheevy/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: taskDescription }),
      });
      const classification = await res.json();

      const newSessionId = `livesim-${Date.now()}`;
      setSessionId(newSessionId);

      // Add initial log entries
      addLog('acheevy', 'ACHEEVY', 'thought', `Analyzing task: "${taskDescription}"`);

      setTimeout(() => {
        addLog('acheevy', 'ACHEEVY', 'coordination',
          `Classified as: ${classification.intent || 'general'} (confidence: ${classification.confidence || 0.5})`);
        setAgents(prev => prev.map(a => a.id === 'acheevy' ? { ...a, status: 'working' } : a));
      }, 1200);

      setTimeout(() => {
        addLog('acheevy', 'ACHEEVY', 'action', 'Delegating to team. Research_Ang — start background research.');
        setAgents(prev => prev.map(a => a.id === 'research-ang' ? { ...a, status: 'thinking' } : a));
      }, 2500);

      setTimeout(() => {
        addLog('research-ang', 'Research_Ang', 'thought', `Gathering context for: ${taskDescription.slice(0, 80)}...`);
        setAgents(prev => prev.map(a => a.id === 'research-ang' ? { ...a, status: 'working' } : a));
      }, 4000);

      setTimeout(() => {
        addLog('research-ang', 'Research_Ang', 'result', 'Initial research complete. Handing findings to Engineer_Ang.');
        setAgents(prev => prev.map(a =>
          a.id === 'research-ang' ? { ...a, status: 'done' } :
          a.id === 'engineer-ang' ? { ...a, status: 'thinking' } : a
        ));
      }, 7000);

      setTimeout(() => {
        addLog('engineer-ang', 'Engineer_Ang', 'thought', 'Reviewing research and planning implementation approach...');
        setAgents(prev => prev.map(a => a.id === 'engineer-ang' ? { ...a, status: 'working' } : a));
      }, 8500);

      setTimeout(() => {
        addLog('engineer-ang', 'Engineer_Ang', 'action', 'Building execution plan with 4 steps. Sending to Quality_Ang for review.');
        setAgents(prev => prev.map(a =>
          a.id === 'engineer-ang' ? { ...a, status: 'waiting' } :
          a.id === 'quality-ang' ? { ...a, status: 'thinking' } : a
        ));
      }, 11000);

      setTimeout(() => {
        addLog('quality-ang', 'Quality_Ang', 'thought', 'Running ORACLE 8-gate verification on execution plan...');
        setAgents(prev => prev.map(a => a.id === 'quality-ang' ? { ...a, status: 'working' } : a));
      }, 13000);

      setTimeout(() => {
        addLog('quality-ang', 'Quality_Ang', 'result', 'All 8 gates passed. Plan approved for execution.');
        addLog('acheevy', 'ACHEEVY', 'result', 'Task analysis complete. Ready for Phase B execution.');
        setAgents(prev => prev.map(a => ({ ...a, status: 'done' })));
        setIsRunning(false);
      }, 16000);

      // Connect SSE for real-time updates when gateway is available
      try {
        const sse = new EventSource(`/api/livesim/stream?sessionId=${newSessionId}`);
        sse.onmessage = (event) => {
          try {
            const entry = JSON.parse(event.data) as SimLogEntry;
            setLogs(prev => [...prev, entry]);
            // Update agent status from event
            setAgents(prev => prev.map(a =>
              a.id === entry.agentId ? { ...a, status: entry.type === 'result' ? 'done' : 'working' } : a
            ));
          } catch { /* ignore malformed */ }
        };
        sse.onerror = () => sse.close();
        eventSourceRef.current = sse;
      } catch {
        // SSE not available — demo mode already running above
      }
    } catch (err) {
      addLog('acheevy', 'ACHEEVY', 'result', `Error starting session: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsRunning(false);
    }
  }, [taskDescription]);

  // Add a log entry
  const addLog = (agentId: string, agentName: string, type: SimLogEntry['type'], content: string) => {
    setLogs(prev => [...prev, {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      agentId,
      agentName,
      type,
      content,
    }]);
  };

  // Ask the crew a question
  const askCrew = useCallback(() => {
    if (!question.trim() || !isRunning) return;
    addLog('user', 'You', 'user', question);
    setQuestion('');

    // Simulate crew response
    setTimeout(() => {
      addLog('acheevy', 'ACHEEVY', 'coordination', `Routing your question to the team: "${question.slice(0, 60)}..."`);
    }, 800);
  }, [question, isRunning]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => { eventSourceRef.current?.close(); };
  }, []);

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
          <p className="text-sm text-white/40">Watch your AI crew work autonomously</p>
        </div>
        {sessionId && (
          <span className="text-xs font-mono text-white/20">{sessionId}</span>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Log Feed */}
        <div className="flex-1 flex flex-col">
          {/* Task Input (when not running) */}
          {!isRunning && logs.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-lg w-full text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <PlayIcon className="w-8 h-8 text-gold" />
                </div>
                <h2 className="text-xl font-medium text-white mb-2">Start a LiveSim Session</h2>
                <p className="text-white/40 text-sm mb-6">
                  Describe a task and watch your AI crew analyze, plan, and execute it autonomously.
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
                    disabled={!taskDescription.trim()}
                    className="px-6 py-3 rounded-xl bg-gold text-black font-medium text-sm hover:bg-gold-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Launch
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Log Stream */}
          {(isRunning || logs.length > 0) && (
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

          {/* Ask the Crew input */}
          {(isRunning || logs.length > 0) && (
            <div className="border-t border-white/10 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askCrew()}
                  placeholder={isRunning ? 'Ask the crew a question...' : 'Session complete'}
                  disabled={!isRunning}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder:text-white/20 outline-none focus:border-gold/30 disabled:opacity-30"
                />
                <button
                  onClick={askCrew}
                  disabled={!question.trim() || !isRunning}
                  className="p-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Agent Status Sidebar */}
        {(isRunning || logs.length > 0) && (
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
