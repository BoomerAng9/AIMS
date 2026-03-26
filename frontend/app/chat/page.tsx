import { ChatShell } from '@/components/chat/ChatShell';

export default function ChatPage() {
  return (
    <main className="h-screen w-full overflow-hidden">
      <ChatShell
        sessionId="chat-route"
        projectTitle="Chat w/ ACHEEVY"
        placeholder="Type or speak your request..."
        welcomeMessage="Welcome to A.I.M.S. I'm ACHEEVY. What would you like to do today?"
        isFullscreen
      />
    </main>
  );
}