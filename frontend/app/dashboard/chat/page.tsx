'use client';

import { Suspense } from 'react';
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-obsidian">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      </div>
    }>
      <div className="h-[calc(100vh-64px)] overflow-hidden">
        <ChatInterface
          autoPlayVoice={true}
          welcomeMessage="I'm ACHEEVY, at your service. What will we deploy today?"
          placeholder="Message ACHEEVY... (or click the mic to speak)"
        />
      </div>
    </Suspense>
  );
}
