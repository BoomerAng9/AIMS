'use client';

/**
 * AcheevyChat — Floating Chat Panel Component
 *
 * Compact version of Chat w/ACHEEVY for the FloatingChat overlay.
 * Uses Vercel AI SDK (useChat) with real-time PMO classification.
 */

import { useChat, type Message } from 'ai/react';
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Send, Zap, Sparkles, Hammer, Search, Layers, Square } from 'lucide-react';

// ── Sub-components ──

const MemoizedMessage = memo(({ message, isLast, isLoading }: {
  message: Message;
  isLast: boolean;
  isLoading: boolean;
}) => (
  <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    {message.role === 'assistant' && (
      <div className="w-7 h-7 rounded-lg bg-white/5 border border-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-gold/80" />
      </div>
    )}
    <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
      message.role === 'user'
        ? 'bg-gold/10 text-white rounded-tr-sm border border-gold/20'
        : 'wireframe-card text-white/90 rounded-tl-sm'
    }`}>
      {message.role === 'user' ? (
        message.content
      ) : (
        <div className="prose prose-invert prose-sm max-w-none prose-code:text-gold prose-code:bg-black/40 prose-code:px-1 prose-code:rounded">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          {isLoading && isLast && (
            <span className="inline-block w-1.5 h-4 bg-gold ml-0.5 animate-pulse" />
          )}
        </div>
      )}
    </div>
    {message.role === 'user' && (
      <div className="w-7 h-7 rounded-lg bg-white/5 border border-wireframe-stroke flex items-center justify-center flex-shrink-0 mt-0.5">
        <User className="w-3.5 h-3.5 text-white/50" />
      </div>
    )}
  </div>
), (prev, next) => {
  // Custom comparison to prevent re-renders of previous messages during streaming
  return (
    prev.message.content === next.message.content &&
    prev.isLast === next.isLast &&
    prev.isLoading === next.isLoading
  );
});

MemoizedMessage.displayName = 'MemoizedMessage';

// ── Types ──

interface PmoClassification {
  pmoOffice: string;
  officeLabel: string;
  director: string;
  confidence: number;
  executionLane: 'deploy_it' | 'guide_me';
}

// ── Constants ──

const INTENT_OPTIONS = [
  { value: 'CHAT', label: 'Chat', icon: Sparkles, desc: 'Ask anything' },
  { value: 'BUILD_PLUG', label: 'Build', icon: Hammer, desc: 'Create a Plug' },
  { value: 'RESEARCH', label: 'Research', icon: Search, desc: 'Market intel' },
  { value: 'AGENTIC_WORKFLOW', label: 'Workflow', icon: Layers, desc: 'Multi-step pipeline' },
];

const BOOMER_ANGS = [
  { id: 'engineer-ang', name: 'Engineer_Ang', color: 'emerald' },
  { id: 'marketer-ang', name: 'Marketer_Ang', color: 'blue' },
  { id: 'analyst-ang', name: 'Analyst_Ang', color: 'violet' },
  { id: 'quality-ang', name: 'Quality_Ang', color: 'amber' },
  { id: 'chicken-hawk', name: 'Chicken_Hawk', color: 'red' },
];

export default function AcheevyChat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
  } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Greetings. I am ACHEEVY — your AI orchestrator.\n\nDescribe what you want to build, and I will marshal the full Boomer_Ang team to make it real.",
      }
    ]
  });

  const [pmo, setPmo] = useState<PmoClassification | null>(null);
  const [intent, setIntent] = useState('CHAT');
  const [showIntentPicker, setShowIntentPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Classify on submit
  const classifyMessage = useCallback(async (message: string) => {
    try {
      const res = await fetch('/api/chat/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (res.ok) setPmo(await res.json());
    } catch { /* non-critical */ }
  }, []);

  const handleEnhancedSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    classifyMessage(input.trim());
    handleSubmit(e);
  }, [input, isLoading, classifyMessage, handleSubmit]);

  const selectedIntent = INTENT_OPTIONS.find(i => i.value === intent) || INTENT_OPTIONS[0];

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#0A0A0A] aims-page-bg text-white font-sans">

      {/* Header */}
      <div className="relative z-10 border-b border-wireframe-stroke bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-gold/20 flex items-center justify-center">
                <Bot className="text-gold w-4 h-4" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-black animate-pulse" />
            </div>
            <div>
              <h2 className="font-medium text-sm text-white">Chat w/ACHEEVY</h2>
              <div className="flex items-center gap-1 text-[9px] text-emerald-400/80 font-mono uppercase tracking-widest">
                <Zap className="w-2 h-2" /> Online
              </div>
            </div>
          </div>

          {/* Intent selector */}
          <div className="relative">
            <button
              onClick={() => setShowIntentPicker(!showIntentPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-wireframe-stroke hover:border-gold/30 transition-all text-xs"
            >
              <selectedIntent.icon className="w-3.5 h-3.5 text-gold" />
              <span className="text-white/80">{selectedIntent.label}</span>
            </button>
            {showIntentPicker && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#0A0A0A]/95 border border-wireframe-stroke rounded-xl p-1.5 backdrop-blur-xl shadow-2xl z-50">
                {INTENT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setIntent(opt.value); setShowIntentPicker(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-xs ${
                      intent === opt.value ? 'bg-gold/10 border border-gold/20' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <opt.icon className={`w-3.5 h-3.5 ${intent === opt.value ? 'text-gold' : 'text-white/40'}`} />
                    <div>
                      <div className={`font-medium ${intent === opt.value ? 'text-gold' : 'text-white/80'}`}>{opt.label}</div>
                      <div className="text-[9px] text-white/30 font-mono">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Agent shelf */}
        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
          {BOOMER_ANGS.map(agent => (
            <div key={agent.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors cursor-default ${
              pmo?.director?.includes(agent.name.split('_')[0]) ? 'border-gold/20 bg-gold/5' : 'border-wireframe-stroke bg-white/[0.02]'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                pmo?.director?.includes(agent.name.split('_')[0]) ? 'bg-gold animate-pulse' : 'bg-white/20'
              }`} />
              <span className="text-[9px] font-mono text-white/50 uppercase tracking-wider">{agent.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PMO routing pill */}
      {pmo && (
        <div className="relative z-10 mx-3 mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/5 border border-gold/10 text-[10px]">
          <span className="text-gold font-medium">{pmo.officeLabel}</span>
          <span className="text-white/20">|</span>
          <span className="text-white/60 font-mono">{pmo.director}</span>
          <span className={`ml-auto px-1.5 py-0.5 rounded-full font-mono uppercase ${
            pmo.executionLane === 'deploy_it' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
          }`}>{pmo.executionLane === 'deploy_it' ? 'DEPLOY' : 'GUIDE'}</span>
        </div>
      )}

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        {messages.map((m, i) => (
          <MemoizedMessage
            key={m.id}
            message={m}
            isLast={i === messages.length - 1}
            isLoading={isLoading}
          />
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-gold/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5 text-gold animate-pulse" />
            </div>
            <div className="px-4 py-3 wireframe-card rounded-2xl rounded-tl-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative z-20 p-3 bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-wireframe-stroke">
        <form onSubmit={handleEnhancedSubmit} className="relative">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Direct the swarm..."
            disabled={isLoading}
            className="w-full bg-white/5 hover:bg-white/10 focus:bg-black border border-wireframe-stroke focus:border-gold/40 rounded-xl py-3 pl-4 pr-12 text-white text-sm placeholder:text-white/20 transition-all outline-none"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="absolute right-2 top-1.5 p-2 bg-red-500/10 text-red-400 rounded-lg transition-all hover:bg-red-500/20"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 top-1.5 p-2 bg-gold/10 hover:bg-gold text-gold hover:text-black rounded-lg transition-all disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
        <p className="text-center mt-2 text-[9px] font-mono text-white/15 uppercase tracking-[0.2em]">
          A.I.M.S. v2.0 &bull; {intent} Mode
        </p>
      </div>
    </div>
  );
}
