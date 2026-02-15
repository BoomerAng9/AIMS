'use client';

/**
 * ACHEEVY Agent — Voice-Powered AI Interface
 *
 * Two modes:
 * 1. ElevenLabs Conversational AI (when AGENT_ID is configured)
 * 2. Fallback Pipeline: Groq Whisper STT → /api/chat → ElevenLabs TTS
 *    (when no agent ID — always works)
 */

import { useConversation } from '@elevenlabs/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Mic, MicOff, Phone, PhoneOff, MessageSquare,
  Volume2, VolumeX, Zap,
  Building2, Container, DollarSign, Activity,
  Megaphone, Palette, BookOpen, Bot, Send,
} from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface PmoClassification {
  pmoOffice: string;
  officeLabel: string;
  director: string;
  confidence: number;
  executionLane: 'deploy_it' | 'guide_me';
}

interface TranscriptEntry {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '';
const USE_ELEVENLABS_AGENT = Boolean(AGENT_ID);

const PMO_OFFICE_ICONS: Record<string, typeof Building2> = {
  'tech-office': Container,
  'finance-office': DollarSign,
  'ops-office': Activity,
  'marketing-office': Megaphone,
  'design-office': Palette,
  'publishing-office': BookOpen,
  'hr-office': Bot,
  'dtpmo-office': Zap,
};

// ─────────────────────────────────────────────────────────────
// Audio Visualizer
// ─────────────────────────────────────────────────────────────

function AudioVisualizer({ getFrequencyData, active, color = 'amber' }: {
  getFrequencyData: (() => Uint8Array | undefined) | undefined;
  active: boolean;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!active || !getFrequencyData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const data = getFrequencyData();
      if (!data) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / 32;
      const colorVal = color === 'amber' ? '212, 175, 55' : '96, 165, 250';

      for (let i = 0; i < 32; i++) {
        const value = data[i * 4] || 0;
        const height = (value / 255) * canvas.height * 0.8;
        const x = i * barWidth + barWidth * 0.15;
        const w = barWidth * 0.7;

        ctx.fillStyle = `rgba(${colorVal}, ${0.3 + (value / 255) * 0.7})`;
        ctx.fillRect(x, canvas.height - height, w, height);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [active, getFrequencyData, color]);

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={64}
      className={`w-full h-16 rounded-lg ${active ? 'opacity-100' : 'opacity-20'} transition-opacity`}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Fallback Audio Level Bar (for custom pipeline)
// ─────────────────────────────────────────────────────────────

function AudioLevelBar({ level, active, label }: { level: number; active: boolean; label: string }) {
  return (
    <div>
      <p className="text-[9px] text-white/30 font-mono uppercase mb-1">{label}</p>
      <div className="h-16 flex items-end justify-center gap-0.5 rounded-lg bg-white/[0.02] px-2 py-1">
        {Array.from({ length: 24 }).map((_, i) => {
          const barHeight = active ? Math.max(4, (level * 64) * Math.sin((i / 24) * Math.PI)) : 4;
          return (
            <div
              key={i}
              className="w-1.5 rounded-full transition-all duration-100"
              style={{
                height: `${barHeight}px`,
                backgroundColor: active
                  ? `rgba(212, 175, 55, ${0.3 + level * 0.7})`
                  : 'rgba(255, 255, 255, 0.1)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Agent Component
// ─────────────────────────────────────────────────────────────

export default function AcheevyAgent() {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [textInput, setTextInput] = useState('');
  const [textMode, setTextMode] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volumeOn, setVolumeOn] = useState(true);
  const [pmo, setPmo] = useState<PmoClassification | null>(null);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [fallbackProcessing, setFallbackProcessing] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);

  // ── Fallback Voice Pipeline Hooks ──
  const voiceInput = useVoiceInput({
    onTranscript: (result) => {
      if (!result.text || !fallbackActive) return;
      // Add user message to transcript
      addTranscriptEntry('user', result.text);
      classifyMessage(result.text);
      // Send to chat API and speak response
      handleFallbackChat(result.text);
    },
  });

  const voiceOutput = useVoiceOutput({
    config: { provider: 'elevenlabs', autoPlay: true },
  });

  // PMO Classification
  const classifyMessage = useCallback(async (message: string) => {
    try {
      const res = await fetch('/api/chat/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (res.ok) setPmo(await res.json());
    } catch { /* non-critical */ }
  }, []);

  // Add entry to transcript
  const addTranscriptEntry = useCallback((role: 'user' | 'agent', text: string) => {
    const entry: TranscriptEntry = {
      id: `${Date.now()}-${Math.random()}`,
      role,
      text,
      timestamp: new Date(),
    };
    setTranscript(prev => [...prev, entry]);
    conversationHistoryRef.current.push({
      role: role === 'user' ? 'user' : 'assistant',
      content: text,
    });
  }, []);

  // ── Fallback Chat Pipeline: Groq Whisper → /api/chat → ElevenLabs TTS ──
  const handleFallbackChat = useCallback(async (userMessage: string) => {
    setFallbackProcessing(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...conversationHistoryRef.current.slice(-10),
          ],
        }),
      });

      if (!res.ok || !res.body) {
        addTranscriptEntry('agent', 'I had trouble processing that. Please try again.');
        return;
      }

      // Read the streamed response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Parse Vercel AI SDK format: 0:"text"\n
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2));
              fullResponse += text;
            } catch { /* skip */ }
          }
        }
      }

      if (fullResponse) {
        addTranscriptEntry('agent', fullResponse);

        // Speak the response via TTS
        if (volumeOn) {
          const clean = fullResponse
            .replace(/```[\s\S]*?```/g, '')
            .replace(/[#*_`~\[\]()>|]/g, '')
            .replace(/\n{2,}/g, '. ')
            .replace(/\n/g, ' ')
            .trim();
          if (clean.length > 0 && clean.length <= 5000) {
            voiceOutput.speak(clean);
          }
        }
      }
    } catch (err) {
      console.error('[ACHEEVY Agent] Fallback chat error:', err);
      addTranscriptEntry('agent', 'Connection error. Please try again.');
    } finally {
      setFallbackProcessing(false);
      // Auto-restart listening in voice mode after response
      if (fallbackActive && !textMode && !muted) {
        setTimeout(() => {
          voiceInput.startListening();
        }, 500);
      }
    }
  }, [addTranscriptEntry, voiceOutput, volumeOn, fallbackActive, textMode, muted, voiceInput]);

  // ── ElevenLabs Conversation (when AGENT_ID is available) ──
  const conversation = useConversation({
    onMessage: (message: any) => {
      const source = message.source || (message.role === 'user' ? 'user' : 'ai');
      const text = message.message || message.content || '';
      if (!text) return;

      addTranscriptEntry(source === 'user' ? 'user' : 'agent', text);
      if (source === 'user') classifyMessage(text);
    },
    onError: (error: any) => {
      console.error('[ACHEEVY Agent] Error:', error);
    },
    onStatusChange: (status: any) => {
      console.log('[ACHEEVY Agent] Status:', status);
    },
  });

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // ── Start/End session ──
  const handleStartSession = useCallback(async () => {
    if (USE_ELEVENLABS_AGENT) {
      // Path 1: ElevenLabs Conversational AI
      try {
        await (conversation as any).startSession({ agentId: AGENT_ID, connectionType: 'webrtc' });
      } catch (err) {
        console.error('[ACHEEVY Agent] ElevenLabs session failed, activating fallback:', err);
        // Fall through to fallback
        setFallbackActive(true);
        await voiceInput.startListening();
      }
    } else {
      // Path 2: Fallback pipeline (Groq Whisper → /api/chat → ElevenLabs TTS)
      setFallbackActive(true);
      await voiceInput.startListening();
    }
  }, [conversation, voiceInput]);

  const handleEndSession = useCallback(async () => {
    if (USE_ELEVENLABS_AGENT && conversation.status === 'connected') {
      await conversation.endSession();
    }
    // End fallback pipeline
    if (fallbackActive) {
      voiceInput.cancelListening();
      voiceOutput.stop();
      setFallbackActive(false);
    }
    setPmo(null);
  }, [conversation, fallbackActive, voiceInput, voiceOutput]);

  // ── Text input (fallback mode) ──
  const handleSendText = useCallback(() => {
    if (!textInput.trim()) return;
    const msg = textInput.trim();
    setTextInput('');

    if (USE_ELEVENLABS_AGENT && conversation.status === 'connected') {
      conversation.sendUserMessage(msg);
      classifyMessage(msg);
    } else if (fallbackActive) {
      addTranscriptEntry('user', msg);
      classifyMessage(msg);
      handleFallbackChat(msg);
    }
  }, [textInput, conversation, classifyMessage, fallbackActive, addTranscriptEntry, handleFallbackChat]);

  // ── Mute/Volume toggles ──
  const handleToggleMute = useCallback(() => {
    const newMuted = !muted;
    setMuted(newMuted);

    if (USE_ELEVENLABS_AGENT && conversation.status === 'connected') {
      if (typeof (conversation as any).muteMic === 'function') {
        (conversation as any).muteMic(newMuted);
      } else if (typeof (conversation as any).setMicMuted === 'function') {
        (conversation as any).setMicMuted(newMuted);
      }
    } else if (fallbackActive) {
      if (newMuted) {
        voiceInput.cancelListening();
      } else {
        voiceInput.startListening();
      }
    }
  }, [muted, conversation, fallbackActive, voiceInput]);

  const handleToggleVolume = useCallback(() => {
    const newVolumeOn = !volumeOn;
    setVolumeOn(newVolumeOn);

    if (USE_ELEVENLABS_AGENT && conversation.status === 'connected') {
      try {
        conversation.setVolume({ volume: newVolumeOn ? 1 : 0 });
      } catch {
        try { (conversation as any).setVolume(newVolumeOn ? 1 : 0); } catch { /* ignore */ }
      }
    } else if (!newVolumeOn) {
      voiceOutput.stop();
    }
  }, [volumeOn, conversation, voiceOutput]);

  // ── Status derivation ──
  const isElevenLabsConnected = USE_ELEVENLABS_AGENT && conversation.status === 'connected';
  const isConnected = isElevenLabsConnected || fallbackActive;
  const isConnecting = USE_ELEVENLABS_AGENT && conversation.status === 'connecting';
  const isSpeaking = isElevenLabsConnected
    ? conversation.isSpeaking
    : voiceOutput.isPlaying;

  const OfficeIcon = pmo ? (PMO_OFFICE_ICONS[pmo.pmoOffice] || Building2) : Building2;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-wireframe-stroke bg-black/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-gold/20 flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/acheevy/acheevy-helmet.png"
                  alt="ACHEEVY"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
              }`} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">ACHEEVY Voice</h2>
              <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest">
                {isConnected ? (
                  <span className="text-emerald-400"><Zap className="w-2.5 h-2.5 inline" /> Live</span>
                ) : isConnecting ? (
                  <span className="text-gold animate-pulse">Connecting...</span>
                ) : (
                  <span className="text-gray-500">Ready</span>
                )}
              </div>
            </div>
          </div>

          {/* Text/Voice mode toggle */}
          <button
            type="button"
            onClick={() => setTextMode(!textMode)}
            title={textMode ? 'Switch to voice' : 'Switch to text'}
            className={`p-2 rounded-lg transition-colors ${
              textMode ? 'bg-gold/10 text-gold' : 'bg-white/5 text-white/50 hover:text-white/80'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PMO Routing Pill */}
      {pmo && (
        <div className="mx-3 mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/5 border border-gold/10 text-[10px]">
          <OfficeIcon className="w-3.5 h-3.5 text-gold" />
          <span className="text-gold font-medium">{pmo.officeLabel}</span>
          <span className={`ml-auto px-1.5 py-0.5 rounded-full font-mono uppercase ${
            pmo.executionLane === 'deploy_it' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
          }`}>
            {pmo.executionLane === 'deploy_it' ? 'DEPLOY' : 'GUIDE'}
          </span>
        </div>
      )}

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {transcript.length === 0 && !isConnected && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-gold/20 flex items-center justify-center overflow-hidden">
              <Image
                src="/images/acheevy/acheevy-helmet.png"
                alt="ACHEEVY"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">ACHEEVY Voice</h3>
            <p className="text-white/30 text-sm max-w-sm mx-auto">
              Start a session to speak with ACHEEVY in real-time.
              Your voice commands will be processed instantly.
            </p>
          </div>
        )}

        {transcript.map(entry => (
          <div
            key={entry.id}
            className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              entry.role === 'user'
                ? 'bg-gold/20 text-white rounded-tr-sm'
                : 'bg-white/[0.03] text-white/90 rounded-tl-sm border border-wireframe-stroke'
            }`}>
              {entry.text}
            </div>
          </div>
        ))}

        {(isSpeaking || fallbackProcessing) && (
          <div className="flex gap-3">
            <div className="px-4 py-2.5 bg-white/[0.03] rounded-2xl rounded-tl-sm border border-wireframe-stroke flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        <div ref={transcriptEndRef} />
      </div>

      {/* Audio Visualizer */}
      {isConnected && (
        <div className="px-4 py-2 border-t border-wireframe-stroke">
          <div className="grid grid-cols-2 gap-2">
            {isElevenLabsConnected ? (
              <>
                <div>
                  <p className="text-[9px] text-white/30 font-mono uppercase mb-1">You</p>
                  <AudioVisualizer
                    getFrequencyData={conversation.getInputByteFrequencyData}
                    active={isConnected && !muted}
                    color="blue"
                  />
                </div>
                <div>
                  <p className="text-[9px] text-white/30 font-mono uppercase mb-1">ACHEEVY</p>
                  <AudioVisualizer
                    getFrequencyData={conversation.getOutputByteFrequencyData}
                    active={conversation.isSpeaking}
                    color="amber"
                  />
                </div>
              </>
            ) : (
              <>
                <AudioLevelBar
                  label="You"
                  level={voiceInput.audioLevel}
                  active={voiceInput.isListening}
                />
                <AudioLevelBar
                  label="ACHEEVY"
                  level={voiceOutput.isPlaying ? 0.6 : 0}
                  active={voiceOutput.isPlaying}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Text Input (when in text mode and connected) */}
      {textMode && isConnected && (
        <div className="px-3 py-2 border-t border-wireframe-stroke">
          <div className="flex gap-2">
            <input
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendText()}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border border-wireframe-stroke rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-gold/30"
            />
            <button
              type="button"
              onClick={handleSendText}
              disabled={!textInput.trim()}
              title="Send text message"
              className="px-3 py-2 rounded-lg bg-gold/10 text-gold hover:bg-gold hover:text-black transition-all disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="px-4 py-4 bg-black/80 backdrop-blur-xl border-t border-wireframe-stroke">
        <div className="flex items-center justify-center gap-4">
          {/* Mute */}
          {isConnected && (
            <button
              type="button"
              onClick={handleToggleMute}
              title={muted ? 'Unmute microphone' : 'Mute microphone'}
              className={`p-3 rounded-full transition-all ${
                muted
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          {/* Connect / Disconnect */}
          {isConnected ? (
            <button
              type="button"
              onClick={handleEndSession}
              title="End session"
              className="p-4 rounded-full bg-red-500 text-white hover:bg-red-400 transition-colors shadow-lg shadow-red-500/30"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartSession}
              disabled={isConnecting}
              title="Start voice session"
              className={`p-4 rounded-full transition-all shadow-lg ${
                isConnecting
                  ? 'bg-gold/50 text-black animate-pulse'
                  : 'bg-gold text-black hover:bg-gold-light shadow-gold/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Phone className="w-6 h-6" />
            </button>
          )}

          {/* Volume */}
          {isConnected && (
            <button
              type="button"
              onClick={handleToggleVolume}
              title={volumeOn ? 'Mute output' : 'Unmute output'}
              className="p-3 rounded-full bg-white/5 text-white/60 hover:text-white transition-colors"
            >
              {volumeOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          )}
        </div>

        <p className="text-center mt-3 text-[9px] font-mono text-white/15 uppercase tracking-[0.2em]">
          A.I.M.S. Voice Agent
        </p>
      </div>
    </div>
  );
}
