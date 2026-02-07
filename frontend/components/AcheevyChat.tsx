'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { sendACPRequest } from '../lib/acp-client';
import {
  Bot, User, Send, CheckCircle2, ShieldCheck, DollarSign,
  Cpu, Zap, Search, Hammer, BarChart3, Shield, Layers,
  ChevronRight, Sparkles, ArrowRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  quote?: Record<string, unknown>;
  executionPlan?: { steps: string[]; estimatedDuration: string };
  agentResults?: {
    primaryAgent: string;
    outputs: Array<{ agentId: string; status: string; summary: string; artifacts: string[] }>;
  };
}

type Intent = 'CHAT' | 'BUILD_PLUG' | 'RESEARCH' | 'AGENTIC_WORKFLOW';

interface ActiveAgent {
  id: string;
  name: string;
  status: 'idle' | 'working' | 'done';
  color: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BOOMER_ANGS: ActiveAgent[] = [
  { id: 'engineer-ang', name: 'Engineer_Ang', status: 'idle', color: 'emerald' },
  { id: 'marketer-ang', name: 'Marketer_Ang', status: 'idle', color: 'blue' },
  { id: 'analyst-ang', name: 'Analyst_Ang', status: 'idle', color: 'violet' },
  { id: 'quality-ang', name: 'Quality_Ang', status: 'idle', color: 'amber' },
  { id: 'chicken-hawk', name: 'Chicken Hawk', status: 'idle', color: 'red' },
];

const INTENT_OPTIONS: { value: Intent; label: string; icon: typeof Cpu; desc: string }[] = [
  { value: 'CHAT', label: 'Chat', icon: Sparkles, desc: 'Ask anything' },
  { value: 'BUILD_PLUG', label: 'Build', icon: Hammer, desc: 'Create a Plug' },
  { value: 'RESEARCH', label: 'Research', icon: Search, desc: 'Market intel' },
  { value: 'AGENTIC_WORKFLOW', label: 'Workflow', icon: Layers, desc: 'Multi-step pipeline' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AcheevyChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Greetings. I am ACHEEVY — your AI orchestrator.\n\nDescribe what you want to build, and I will marshal the full Boomer_Ang team to make it real. From intake to deployment, end-to-end.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [intent, setIntent] = useState<Intent>('BUILD_PLUG');
  const [agents, setAgents] = useState<ActiveAgent[]>(BOOMER_ANGS);
  const [showIntentPicker, setShowIntentPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const animateAgents = useCallback((primaryAgent: string | null) => {
    if (!primaryAgent) return;
    setAgents(prev =>
      prev.map(a => ({
        ...a,
        status: a.id === primaryAgent ? 'working' : a.status,
      }))
    );
    setTimeout(() => {
      setAgents(prev =>
        prev.map(a => ({
          ...a,
          status: a.id === primaryAgent ? 'done' : a.status,
        }))
      );
      setTimeout(() => {
        setAgents(BOOMER_ANGS);
      }, 3000);
    }, 2000);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendACPRequest(userMsg.content, intent);

      const acheevyMsg: Message = {
        id: response.reqId || `resp-${Date.now()}`,
        role: 'assistant',
        content: response.message || 'Request processed.',
        quote: response.quote,
        executionPlan: response.executionPlan,
        agentResults: response.agentResults,
      };

      setMessages(prev => [...prev, acheevyMsg]);

      if (response.agentResults?.primaryAgent) {
        animateAgents(response.agentResults.primaryAgent);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Connection to UEF Gateway failed. Ensure infrastructure is running.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedIntent = INTENT_OPTIONS.find(i => i.value === intent) || INTENT_OPTIONS[0];

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Dot Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ---- HEADER: Combined Arsenal Bar ---- */}
      <div className="relative z-10 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 flex items-center justify-center border border-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                <Bot className="text-amber-400 w-5 h-5" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-black animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-base text-amber-50 tracking-wide">ACHEEVY</h2>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/80 font-medium tracking-wider uppercase">
                <Zap className="w-2.5 h-2.5" /> Online
              </div>
            </div>
          </div>

          {/* Intent Selector */}
          <div className="relative">
            <button
              onClick={() => setShowIntentPicker(!showIntentPicker)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/30 transition-all text-sm"
            >
              <selectedIntent.icon className="w-4 h-4 text-amber-400" />
              <span className="text-amber-50 font-medium">{selectedIntent.label}</span>
              <ChevronRight className={`w-3 h-3 text-amber-400/50 transition-transform ${showIntentPicker ? 'rotate-90' : ''}`} />
            </button>
            {showIntentPicker && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-black/95 border border-white/10 rounded-2xl p-2 backdrop-blur-xl shadow-2xl z-50">
                {INTENT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setIntent(opt.value); setShowIntentPicker(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      intent === opt.value ? 'bg-amber-400/10 border border-amber-400/20' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <opt.icon className={`w-4 h-4 ${intent === opt.value ? 'text-amber-400' : 'text-white/40'}`} />
                    <div>
                      <div className={`text-sm font-medium ${intent === opt.value ? 'text-amber-50' : 'text-white/70'}`}>{opt.label}</div>
                      <div className="text-[10px] text-white/30">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Arsenal Shelf — Active Boomer_Angs */}
        <div className="px-6 pb-3 flex gap-2 overflow-x-auto">
          {agents.map(agent => {
            const isWorking = agent.status === 'working';
            const isDone = agent.status === 'done';
            return (
              <div
                key={agent.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-sm transition-all flex-shrink-0 ${
                  isWorking
                    ? 'bg-emerald-400/10 border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                    : isDone
                    ? 'bg-emerald-400/10 border-emerald-400/30'
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isWorking ? 'bg-emerald-400 animate-pulse' : isDone ? 'bg-emerald-400' : 'bg-white/20'
                  }`}
                />
                <span className={`text-[10px] font-medium tracking-wide ${
                  isWorking ? 'text-white/90' : isDone ? 'text-emerald-300' : 'text-white/30'
                }`}>
                  {agent.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- MESSAGES ---- */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400/10 to-transparent flex-shrink-0 flex items-center justify-center border border-amber-400/20 mt-1">
                <Bot className="w-4 h-4 text-amber-400" />
              </div>
            )}

            <div className="max-w-[80%] space-y-3">
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-amber-400/10 border border-amber-400/20 text-amber-50 rounded-tr-sm'
                    : 'bg-white/[0.03] border border-white/[0.06] text-white/80 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>

              {/* Agent Results */}
              {msg.agentResults ? (
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-400/80">
                      Agent Dispatch
                    </span>
                  </div>
                  {msg.agentResults.outputs.map((out, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-amber-200">{out.agentId}</span>
                        <span className={`text-[9px] uppercase font-bold tracking-wider ${
                          out.status === 'COMPLETED' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {out.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">{out.summary}</p>
                      {out.artifacts.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {out.artifacts.slice(0, 4).map((a, j) => (
                            <span key={j} className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/40">
                              {a}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {/* LUC Quote */}
              {msg.quote && (msg.quote as Record<string, unknown>).variants ? (
                <div className="bg-black/60 border border-amber-400/20 rounded-2xl p-4 shadow-[0_0_20px_rgba(251,191,36,0.05)]">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-400/80 flex items-center gap-2">
                      <DollarSign className="w-3 h-3" /> LUC Estimate
                    </h4>
                    <span className="text-[9px] text-white/20">Valid: 1h</span>
                  </div>
                  <div className="space-y-1.5">
                    {((msg.quote as Record<string, unknown>).variants as Array<Record<string, unknown>>).map((v: Record<string, unknown>, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-white/[0.03] p-2.5 rounded-xl text-xs">
                        <span className="text-white/60">{v.name as string}</span>
                        <div className="text-right">
                          <div className="text-amber-400 font-mono font-medium">
                            ${((v.estimate as Record<string, unknown>)?.totalUsd as number)?.toFixed(4)}
                          </div>
                          <div className="text-white/20 text-[9px]">
                            {((v.estimate as Record<string, unknown>)?.totalTokens as number)} tokens
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Execution Plan */}
              {msg.executionPlan ? (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Execution Protocol
                  </h4>
                  <div className="space-y-2">
                    {msg.executionPlan.steps.map((step: string, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[9px] font-bold text-amber-400">{i + 1}</span>
                        </div>
                        <span className="text-xs text-white/50">{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[9px] text-white/20">
                      Est. Duration: {msg.executionPlan.estimatedDuration}
                    </span>
                    <button className="flex items-center gap-1 text-[10px] text-amber-400 font-medium hover:text-amber-300 transition-colors">
                      Execute <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10 mt-1">
                <User className="w-4 h-4 text-white/50" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400/10 to-transparent flex-shrink-0 flex items-center justify-center border border-amber-400/20 animate-pulse">
              <Bot className="w-4 h-4 text-amber-400" />
            </div>
            <div className="px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-tl-sm">
              <div className="flex gap-1.5 h-5 items-center">
                <div className="w-1.5 h-1.5 bg-amber-400/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-amber-400/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-amber-400/50 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ---- INPUT AREA ---- */}
      <div className="relative z-10 border-t border-white/5 bg-black/80 backdrop-blur-xl p-4">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <selectedIntent.icon className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-medium text-amber-200 uppercase tracking-wider">{selectedIntent.label}</span>
            </div>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  intent === 'BUILD_PLUG'
                    ? "Describe the Plug you want to build..."
                    : intent === 'RESEARCH'
                    ? "What do you want to research?"
                    : intent === 'AGENTIC_WORKFLOW'
                    ? "Describe the workflow pipeline..."
                    : "Ask ACHEEVY anything..."
                }
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white/90 focus:outline-none focus:border-amber-400/30 focus:shadow-[0_0_20px_rgba(251,191,36,0.1)] transition-all placeholder:text-white/20"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 top-1.5 p-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_12px_rgba(251,191,36,0.2)]"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[9px] text-white/15">
            A.I.M.S. v1.0 | ACP-Secured | Monitored by ORACLE
          </span>
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-2.5 h-2.5 text-white/10" />
            <Shield className="w-2.5 h-2.5 text-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
