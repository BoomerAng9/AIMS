"use client";
import React from 'react';
import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, Search, Image, FileText, Layers, Copy, Container, Trophy, Wand2, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

// ACHEEVY Verb Pool for rotating signature
const ACHEEVY_VERBS = [
  'Deploy', 'Build', 'Create', 'Launch', 'Ship', 'Forge', 'Craft', 'Execute'
] as const;

// Default verb for SSR to avoid hydration mismatch
const DEFAULT_VERB = 'Deploy';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    routedTo?: string;
    status?: 'ok' | 'queued' | 'error';
    timestamp: Date;
};

const QUICK_INTENTS = [
  { label: "Launch Perform", icon: Trophy, intent: "launch-perform" },
  { label: "Build a bot", icon: Bot, intent: "build-bot" },
  { label: "Deep research", icon: Search, intent: "deep-research" },
  { label: "Create images", icon: Image, intent: "create-images" },
  { label: "Office assistant", icon: FileText, intent: "office-assistant" },
  { label: "Vertical Stories", icon: Layers, intent: "vertical-stories" },
  { label: "Make it mine", icon: Copy, intent: "make-it-mine" },
  { label: "Deploy a tool", icon: Container, intent: "deploy-tool" },
  { label: "Browse Skills", icon: Wand2, intent: "browse-skills" },
] as const;

export default function ChatPage() {
  const [input, setInput] = React.useState('');
  const [currentVerb, setCurrentVerb] = React.useState(DEFAULT_VERB);
  const [messages, setMessages] = React.useState<Message[]>([]); // Start empty, load aiPlugs templates
  const [loading, setLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Set random verb after hydration to avoid mismatch
  React.useEffect(() => {
    const randomVerb = ACHEEVY_VERBS[Math.floor(Math.random() * ACHEEVY_VERBS.length)];
    setCurrentVerb(randomVerb);
  }, []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (quickIntent?: string) => {
     const messageText = quickIntent || input.trim();
     if (!messageText) return;

     const userMsg: Message = { role: 'user', content: messageText, timestamp: new Date() };
     setMessages(prev => [...prev, userMsg]);
     setInput('');
     setLoading(true);

     try {
         const res = await fetch('/api/acheevy/route', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                message: messageText,
                userId: "aims-web",
                quickIntent: quickIntent || undefined,
             })
         });

         if (res.ok) {
            const data = await res.json();
            const botResponse: Message = {
                role: 'assistant',
                content: data.reply,
                routedTo: data.routedTo,
                status: data.status,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botResponse]);
         } else {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Connection issue. Please ensure the backend is running.',
                timestamp: new Date()
            }]);
         }
     } catch {
         setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Unable to reach the routing service. Please check your connection.',
            timestamp: new Date()
         }]);
     } finally {
         setLoading(false);
     }
  };

  return (
    <LogoWallBackground mode="dashboard">
       <SiteHeader />
       <main className="flex-1 flex flex-col container max-w-4xl py-6 h-[calc(100vh-64px)]">
           <Card className="flex-1 flex flex-col bg-black/60 border-amber-500/10 backdrop-blur-xl overflow-hidden">
               {/* Header */}
               <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full border-2 border-amber-500/50 p-0.5">
                          <img src="/images/acheevy/acheevy-helmet.png" alt="ACHEEVY" className="h-full w-full rounded-full object-cover bg-black" />
                      </div>
                      <div>
                          <h1 className="font-marker text-xl text-frosty-white tracking-wider">Chat w/ACHEEVY</h1>
                          <p className="text-xs text-amber-100/50">Think It. Prompt It. Let ACHEEVY {currentVerb} it!</p>
                      </div>
                  </div>
               </div>

               {/* Messages */}
               <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {messages.map((msg, idx) => (
                      <div key={idx} className={cn("flex gap-4 max-w-3xl", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                          <div className={cn("h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold",
                              msg.role === 'assistant' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-white/10 text-white")}>
                              {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : "U"}
                          </div>
                          <div>
                              <div className={cn("rounded-2xl p-4 text-sm leading-relaxed",
                                  msg.role === 'assistant' ? "bg-black/40 border border-amber-500/10 text-amber-50" : "bg-white/10 text-white")}>
                                  {msg.content}
                              </div>
                              {msg.routedTo && (
                                  <p className="text-[10px] text-zinc-500 mt-1 ml-2">
                                      Routed to: <span className="text-amber-400">{msg.routedTo}</span>
                                      {msg.status === 'queued' && " — provisioning requested; you will receive an email when ready."}
                                  </p>
                              )}
                          </div>
                      </div>
                  ))}
                  {loading && (
                      <div className="flex gap-4">
                          <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center animate-pulse">
                              <Bot className="h-4 w-4 text-amber-500"/>
                          </div>
                          <div className="text-amber-500/50 text-xs flex items-center pt-2">Processing intent...</div>
                      </div>
                  )}
                  <div ref={messagesEndRef} />
               </div>

               {/* Quick Intent Chips */}
               <div className="px-4 pt-2 flex flex-wrap gap-2">
                  {QUICK_INTENTS.map((chip) => (
                      <button
                          key={chip.intent}
                          onClick={() => sendMessage(chip.label)}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-amber-500/10 hover:border-amber-500/20 hover:text-amber-300 transition-all disabled:opacity-50"
                      >
                          <chip.icon className="h-3 w-3" />
                          {chip.label}
                      </button>
                  ))}
               </div>

               {/* Input */}
               <div className="p-4 bg-black/40 border-t border-white/5">
                   <div className="flex gap-2">
                       <Input
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                          placeholder="Describe what you want to build, research, or deploy..."
                          className="flex-1 bg-black/50 border-white/10 focus:ring-amber-500/30"
                       />
                       <Button variant="acheevy" onClick={() => sendMessage()} disabled={loading || !input.trim()} size="icon">
                           <Send className="h-4 w-4"/>
                       </Button>
                   </div>
               </div>
           </Card>
       </main>
    </LogoWallBackground>
  );
}
