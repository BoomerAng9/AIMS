'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Zap, ChevronRight, Sparkles, Hammer, Search, Layers, Cpu } from 'lucide-react';

// --- Design System Imports & Types ---
// Ideally these would be imported, but we'll inline the relevant types/constants for standalone stability
type Intent = 'CHAT' | 'BUILD_PLUG' | 'RESEARCH' | 'AGENTIC_WORKFLOW';

const INTENT_OPTIONS = [
  { value: 'CHAT', label: 'Chat', icon: Sparkles, desc: 'Ask anything' },
  { value: 'BUILD_PLUG', label: 'Build', icon: Hammer, desc: 'Create a Plug' },
  { value: 'RESEARCH', label: 'Research', icon: Search, desc: 'Market intel' },
  { value: 'AGENTIC_WORKFLOW', label: 'Workflow', icon: Layers, desc: 'Multi-step pipeline' },
];

const BOOMER_ANGS = [
  { id: 'engineer-ang', name: 'Engineer_Ang', status: 'idle', color: 'emerald' },
  { id: 'marketer-ang', name: 'Marketer_Ang', status: 'idle', color: 'blue' },
  { id: 'analyst-ang', name: 'Analyst_Ang', status: 'idle', color: 'violet' },
  { id: 'quality-ang', name: 'Quality_Ang', status: 'idle', color: 'amber' },
  { id: 'chicken-hawk', name: 'Chicken Hawk', status: 'idle', color: 'red' },
];

export default function AcheevyChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Greetings. I am ACHEEVY — your AI orchestrator.\n\nDescribe what you want to build, and I will marshal the full Boomer_Ang team to make it real. From intake to deployment, end-to-end.",
      }
    ]
  });

  const [intent, setIntent] = useState<string>('CHAT');
  const [showIntentPicker, setShowIntentPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedIntent = INTENT_OPTIONS.find(i => i.value === intent) || INTENT_OPTIONS[0];

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-obsidian text-white font-sans selection:bg-gold/30">
      
      {/* Background: Nano Banana Pro "Brick and Window" */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Nano Banana Pro "Brick Pattern" (CSS-only) */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `
              linear-gradient(335deg, rgba(255,255,255,0.05) 23px, transparent 23px),
              linear-gradient(155deg, rgba(255,255,255,0.05) 23px, transparent 23px),
              linear-gradient(335deg, rgba(255,255,255,0.05) 23px, transparent 23px),
              linear-gradient(155deg, rgba(255,255,255,0.05) 23px, transparent 23px)
            `,
            backgroundSize: '58px 58px',
            backgroundPosition: '0px 2px, 4px 35px, 29px 31px, 34px 6px'
          }}
        />
         {/* Subtle Gold Dot Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      {/* ---- HEADER: Arsenal Bar ---- */}
      <div className="relative z-10 border-b border-white/10 bg-black/80 backdrop-blur-xl shadow-glass">
        <div className="flex items-center justify-between px-6 py-3">
          
          {/* ACHEEVY Identity */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-gold/20 flex items-center justify-center shadow-neon-gold group-hover:border-gold/50 transition-all">
                <Bot className="text-gold w-6 h-6" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-signal-green rounded-full border-2 border-black animate-pulse" />
            </div>
            <div>
              <h2 className="font-display font-medium text-lg text-white tracking-tight">ACHEEVY</h2>
              <div className="flex items-center gap-1.5 text-[10px] text-signal-green/90 font-mono uppercase tracking-widest">
                <Zap className="w-2.5 h-2.5" /> Online
              </div>
            </div>
          </div>

          {/* Intent Selector (Glass Dropdown) */}
          <div className="relative">
            <button
              onClick={() => setShowIntentPicker(!showIntentPicker)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-gold/30 transition-all text-sm group"
            >
              {/* @ts-ignore - Icon mapping */}
              <selectedIntent.icon className="w-4 h-4 text-gold group-hover:shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
              <span className="text-white/90 font-medium">{selectedIntent.label}</span>
              <ChevronRight className={`w-3 h-3 text-white/40 transition-transform ${showIntentPicker ? 'rotate-90' : ''}`} />
            </button>
            
            {showIntentPicker && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-obsidian/95 border border-white/10 rounded-xl p-2 backdrop-blur-3xl shadow-2xl z-50">
                {INTENT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setIntent(opt.value); setShowIntentPicker(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all mb-1 ${
                      intent === opt.value ? 'bg-gold/10 border border-gold/20' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                     {/* @ts-ignore */}
                    <opt.icon className={`w-4 h-4 ${intent === opt.value ? 'text-gold' : 'text-white/40'}`} />
                    <div>
                      <div className={`text-sm font-medium ${intent === opt.value ? 'text-gold' : 'text-white/80'}`}>{opt.label}</div>
                      <div className="text-[10px] text-white/30 font-mono">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Agent Shelf (Visual Only for now) */}
        <div className="px-6 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {BOOMER_ANGS.map(agent => (
            <div key={agent.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors cursor-default">
              <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'idle' ? 'bg-white/20' : 'bg-emerald-400'}`} />
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">{agent.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Chat Area ---- */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth">
        {messages.map(m => (
          <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start max-w-3xl'}`}>
            
            {m.role === 'assistant' && (
               <div className="w-8 h-8 rounded-lg bg-white/5 border border-gold/10 flex items-center justify-center flex-shrink-0 mt-1">
                 <Bot className="w-4 h-4 text-gold/80" />
               </div>
            )}

            <div className={`relative px-5 py-4 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-gold text-black rounded-tr-sm shadow-[0_0_15px_rgba(212,175,55,0.2)] font-medium' 
                : 'glass-panel text-white/90 rounded-tl-sm border border-white/5'
            }`}>
              {m.content}
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-white/50" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-gold/10 flex items-center justify-center flex-shrink-0">
               <Zap className="w-4 h-4 text-gold animate-pulse" />
            </div>
            <div className="px-5 py-4 glass-panel rounded-2xl rounded-tl-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ---- Input Area ---- */}
      <div className="p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 relative z-20">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Direct the swarm..."
            className="w-full bg-white/5 hover:bg-white/10 focus:bg-black border border-white/10 focus:border-gold/50 rounded-xl py-4 pl-6 pr-14 text-white placeholder:text-white/20 transition-all outline-none shadow-inner"
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-2 bg-gold/10 hover:bg-gold text-gold hover:text-black rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gold"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="text-center mt-3">
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">
            A.I.M.S. Neural Link v2.0 • {intent} Mode Active
          </p>
        </div>
      </div>

    </div>
  );
}
