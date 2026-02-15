'use client';

import { motion } from "framer-motion";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-[calc(100vh-64px)] rounded-2xl border border-wireframe-stroke bg-black/60 backdrop-blur-xl overflow-hidden"
    >
      <ChatInterface
        model="gemini-3-flash"
        autoPlayVoice={true}
        welcomeMessage="I'm ACHEEVY, at your service. What will we deploy today?"
        placeholder="Message ACHEEVY... (or click the mic to speak)"
      />
    </motion.div>
  );
}
