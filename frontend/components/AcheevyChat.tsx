'use client';
import { useState, useEffect, useRef, memo } from 'react';
import { sendACPRequest } from '../lib/acp-client';
import { Bot, User, Send, CheckCircle2, ShieldCheck, DollarSign } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  quote?: any; // UCP Quote
  executionPlan?: { steps: string[]; estimatedDuration: string };
}

// ----------------------------------------------------------------------
// Memoized Components for Performance
// ----------------------------------------------------------------------

const MessageItem = memo(({ msg }: { msg: Message }) => {
  return (
    <div className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {msg.role === 'assistant' && (
         <div className="w-8 h-8 rounded-full bg-gold/5 flex-shrink-0 flex items-center justify-center border border-gold/20 mt-1">
           <Bot className="w-5 h-5 text-gold" />
         </div>
      )}

      <div className={`max-w-[80%] space-y-2`}>
          <div className={`p-4 rounded-xl text-sm leading-relaxed ${
              msg.role === 'user'
              ? 'bg-gold/10 border border-gold/20 text-slate-100 rounded-tr-none'
              : 'bg-white/5 border border-white/5 text-slate-300 rounded-tl-none'
          }`}>
              {msg.content}
          </div>

          {/* LUC Quote Card */}
          {msg.quote && (
              <div className="bg-black/40 border border-gold/30 rounded-lg p-4 mt-2">
                  <div className="flex justify-between items-center mb-3">
                      <h4 className="text-gold text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                          <DollarSign className="w-3 h-3" /> LUC Estimate
                      </h4>
                      <span className="text-xs text-slate-500">Valid: 1h</span>
                  </div>
                  <div className="space-y-2">
                       {msg.quote.variants.map((v: any, idx: number) => (
                           <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded text-xs">
                               <span className="text-slate-300">{v.name}</span>
                               <div className="text-right">
                                   <div className="text-gold font-mono">${v.estimate.totalUsd.toFixed(4)}</div>
                                   <div className="text-slate-500 text-[10px]">{v.estimate.totalTokens} tokens</div>
                               </div>
                           </div>
                       ))}
                  </div>
                  {msg.quote.variants[0].estimate.byteRoverDiscountApplied && (
                      <div className="mt-2 text-[10px] text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ByteRover Context Discount Applied
                      </div>
                  )}
              </div>
          )}

          {/* Execution Plan */}
          {msg.executionPlan && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3" /> Execution Protocol
                  </h4>
                  <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1">
                      {msg.executionPlan.steps.map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                      ))}
                  </ol>
                  <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-500">
                      Est. Duration: {msg.executionPlan.estimatedDuration}
                  </div>
              </div>
          )}
      </div>

      {msg.role === 'user' && (
         <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center mt-1">
           <User className="w-5 h-5 text-slate-300" />
         </div>
      )}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

const MessageList = memo(({ messages, isLoading, endRef }: { messages: Message[], isLoading: boolean, endRef: React.RefObject<HTMLDivElement> }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((msg) => (
        <MessageItem key={msg.id} msg={msg} />
      ))}
      {isLoading && (
          <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-gold/5 flex-shrink-0 flex items-center justify-center border border-gold/20 animate-pulse">
                  <Bot className="w-5 h-5 text-gold" />
               </div>
               <div className="p-4 bg-white/5 border border-white/5 rounded-xl rounded-tl-none">
                  <div className="flex gap-1 h-4 items-center">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                  </div>
               </div>
          </div>
      )}
      <div ref={endRef} />
    </div>
  );
});

MessageList.displayName = 'MessageList';

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function AcheevyChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Greetings. I am ACHEEVY. Describe your objective, and I will orchestrate the implementation."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendACPRequest(userMsg.content);
      
      const acheevyMsg: Message = {
        id: response.reqId,
        role: 'assistant',
        content: response.message || "Request processed.",
        quote: response.quote,
        executionPlan: response.executionPlan
      };

      setMessages(prev => [...prev, acheevyMsg]);
    } catch (error) {
       setMessages(prev => [...prev, {
         id: 'error',
         role: 'assistant',
         content: "Connection to UEF Gateway failed. Please ensure infrastructure is running."
       }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-leather/50 rounded-xl border border-white/5 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-obsidian to-leather p-4 border-b border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/30">
            <Bot className="text-gold w-6 h-6" />
        </div>
        <div>
            <h2 className="font-display font-bold text-lg text-slate-100 tracking-wide">ACHEEVY</h2>
            <div className="flex items-center gap-2 text-xs text-gold/80">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                ONLINE | UEF GATEWAY CONNECTED
            </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} endRef={messagesEndRef} />

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-leather">
        <form onSubmit={handleSubmit} className="relative">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Command ACHEEVY (e.g., 'Build a CRM plug for realtors')"
                className="w-full bg-black/50 border border-white/10 rounded-lg pl-4 pr-12 py-3 text-sm text-slate-200 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all placeholder:text-slate-600"
                disabled={isLoading}
            />
            <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 p-1.5 bg-gold/10 hover:bg-gold/20 text-gold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send className="w-4 h-4" />
            </button>
        </form>
        <div className="text-center text-[10px] text-slate-600 mt-2">
            A.I.M.S. v1.0 | ACP-Secured | Monitored by ORACLE
        </div>
      </div>
    </div>
  );
}
