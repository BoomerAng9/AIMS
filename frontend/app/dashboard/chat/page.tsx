// frontend/app/dashboard/chat/page.tsx
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-64px)]">
      <ChatInterface
        model="gemini-3-flash"
        autoPlayVoice={true}
        welcomeMessage="I'm ACHEEVY, your AI assistant. I can help you with research, coding, content creation, automation, and more. How can I help you today?"
        placeholder="Message ACHEEVY... (or click the mic to speak)"
      />
    </div>
  );
}
