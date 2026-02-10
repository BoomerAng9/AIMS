// frontend/components/chat/ChatShell.tsx
import React from "react";
import { Mic, Send, Paperclip } from "lucide-react";

interface Props {
  children?: React.ReactNode;
}

export function ChatShell({ children }: Props) {
  return (
    <div className="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-120px)]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-wireframe-stroke pb-4 px-6 md:px-8">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold to-gold/60 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(251,191,36,0.3)]">
            🛡️
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white font-display tracking-wider">
              ACHEEVY
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
              ● Online / Strategic Mode
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
           <span className="text-[10px] text-white/30 uppercase font-display tracking-widest">Platform:</span>
           <span className="text-xs text-white/70 font-mono">A.I.M.S._v1</span>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {children || (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30">
            <div className="h-16 w-16 rounded-full border border-dashed border-gold/20 flex items-center justify-center text-2xl">
              ?
            </div>
            <p className="text-lg font-handwriting text-white">
              Think it. Speak it. ACHEEVY builds it.
            </p>
            <p className="text-[10px] uppercase tracking-widest max-w-xs">
              System is ready for your primary business mission.
            </p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <footer className="p-4 md:p-6">
        <div className="rounded-3xl border border-wireframe-stroke bg-black/40 p-2 backdrop-blur-2xl shadow-xl flex items-center gap-2 focus-within:border-gold/30 transition-all">
          <button disabled className="p-3 text-white/20 hover:text-white transition-colors">
            <Paperclip size={20} />
          </button>
          <input 
            type="text" 
            placeholder="Speak or type your mission directive..." 
            className="flex-1 bg-transparent py-3 px-2 text-sm text-white outline-none placeholder:text-white/20"
            disabled
          />
          <div className="flex items-center gap-1 pr-1">
            <button disabled className="p-3 rounded-full bg-white/5 text-white/20 hover:text-white transition-colors">
              <Mic size={20} />
            </button>
            <button disabled className="p-3 rounded-full bg-gold/10 text-gold/20">
              <Send size={20} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
