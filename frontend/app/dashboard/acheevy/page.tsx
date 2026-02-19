'use client';

import { motion } from 'framer-motion';
import { ChatInterface } from '@/components/chat/ChatInterface';

/**
 * /dashboard/acheevy — Primary ACHEEVY Chat Experience
 *
 * Full-screen conversational interface to ACHEEVY.
 * Routes through /api/chat → UEF Gateway → LLM (with direct OpenRouter fallback).
 * Voice I/O via Groq STT + ElevenLabs TTS.
 */
export default function AcheevyChatPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-[calc(100vh-64px)] rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden"
    >
      <ChatInterface
        model="nano-banana"
        autoPlayVoice={true}
        welcomeMessage="What's on the agenda? I can build, research, deploy, or automate — just say the word."
        placeholder="Message ACHEEVY... (or click the mic to speak)"
      />
    </motion.div>
  );
}
