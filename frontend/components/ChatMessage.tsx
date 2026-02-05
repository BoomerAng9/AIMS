import React, { memo } from 'react';
import { Bot, User, CheckCircle2, ShieldCheck, DollarSign } from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  quote?: any; // UCP Quote
  executionPlan?: { steps: string[]; estimatedDuration: string };
}

interface ChatMessageProps {
  message: Message;
}

/**
 * ChatMessage Component
 *
 * Performance Optimization:
 * Wrapped in React.memo to prevent unnecessary re-renders of existing messages
 * when the parent component state (e.g., input field) updates.
 * This is crucial for long chat histories to maintain a smooth typing experience.
 */
const ChatMessage = memo(({ message: msg }: ChatMessageProps) => {
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

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
