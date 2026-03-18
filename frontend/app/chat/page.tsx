import { ChatShell } from '@/components/chat/ChatShell';

export default function ChatPage() {
  return (
    <main className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-7xl">
        <ChatShell
          sessionId="chat-route"
          projectTitle="Chat w/ ACHEEVY"
          placeholder="Type or speak your request..."
          welcomeMessage="Welcome to A.I.M.S. I'm ACHEEVY. What would you like to do today?"
          isFullscreen
        />
      </div>
    </main>
  );
}