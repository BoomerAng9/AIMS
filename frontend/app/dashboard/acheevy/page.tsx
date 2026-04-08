import { ChatShell } from '@/components/chat/ChatShell';

export default function AcheevyChatPage() {
  return (
    <ChatShell
      sessionId="dashboard-acheevy"
      projectTitle="Chat w/ ACHEEVY"
      placeholder="Type or speak your request..."
      welcomeMessage="I'm ACHEEVY, your AI executive orchestrator. What would you like to do today?"
      showOrchestration
    />
  );
}
