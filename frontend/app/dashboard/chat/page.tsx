import { ChatShell } from '@/components/chat/ChatShell';

export default function DashboardChatPage() {
  return (
    <ChatShell
      sessionId="dashboard-chat"
      projectTitle="Chat w/ ACHEEVY"
      placeholder="Type or speak your request..."
      welcomeMessage="Welcome back. I'm ACHEEVY. Tell me what you want to build, research, deploy, or automate."
    />
  );
}
