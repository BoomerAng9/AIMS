'use client';

/**
 * ACHEEVY Agent — ElevenLabs Conversational AI Interface
 *
 * Voice-powered agent interface using the ElevenLabs Conversational AI SDK.
 * Supports both voice and text input modes with real-time PMO routing.
 */

import { useConversation } from '@elevenlabs/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Mic, MicOff, Phone, PhoneOff, MessageSquare,
  Volume2, VolumeX, Zap, Bot,
  Building2, Container, DollarSign, Activity,
  Megaphone, Palette, BookOpen,
} from 'lucide-react';

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
// Main Agent Component
// ─────────────────────────────────────────────────────────────

export default function AcheevyAgent() {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [textInput, setTextInput] = useState('');
  const [textMode, setTextMode] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volumeOn, setVolumeOn] = useState(true);
  const [pmo, setPmo] = useState<PmoClassification | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

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

  // ElevenLabs Conversation
  const conversation = useConversation({
    onMessage: (message: any) => {
      const source = message.source || (message.role === 'user' ? 'user' : 'ai');
      const text = message.message || message.content || '';
      if (!text) return;

      const entry: TranscriptEntry = {
        id: `${Date.now()}-${Math.random()}`,
        role: source === 'user' ? 'user' : 'agent',
        text,
        timestamp: new Date(),
      };
      setTranscript(prev => [...prev, entry]);

      if (source === 'user') {
        classifyMessage(text);
      }
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

  // Start/End session
  const handleStartSession = useCallback(async () => {
    if (!AGENT_ID) {
      console.warn('[ACHEEVY Agent] No ELEVENLABS_AGENT_ID configured');
      return;
    }
    try {
      await (conversation as any).startSession({ agentId: AGENT_ID, connectionType: 'webrtc' });
    } catch (err) {
      console.error('[ACHEEVY Agent] Failed to start session:', err);
    }
  }, [conversation]);

  const handleEndSession = useCallback(async () => {
    await conversation.endSession();
    setPmo(null);
  }, [conversation]);

  // Text input
  const handleSendText = useCallback(() => {
    if (!textInput.trim()) return;
    conversation.sendUserMessage(textInput.trim());
    classifyMessage(textInput.trim());
    setTextInput('');
  }, [textInput, conversation, classifyMessage]);

  // Mute toggle
  const handleToggleMute = useCallback(() => {
    const newMuted = !muted;
    setMuted(newMuted);
    // Use the available mute API - cast to handle version differences
    if (typeof (conversation as any).muteMic === 'function') {
      (conversation as any).muteMic(newMuted);
    } else if (typeof (conversation as any).setMicMuted === 'function') {
      (conversation as any).setMicMuted(newMuted);
    }
  }, [muted, conversation]);

  // Volume toggle
  const handleToggleVolume = useCallback(() => {
    const newVolumeOn = !volumeOn;
    setVolumeOn(newVolumeOn);
    try {
      conversation.setVolume({ volume: newVolumeOn ? 1 : 0 });
    } catch {
      // Fallback for different API versions
      try { (conversation as any).setVolume(newVolumeOn ? 1 : 0); } catch { /* ignore */ }
    }
  }, [volumeOn, conversation]);

  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';

  const OfficeIcon = pmo ? (PMO_OFFICE_ICONS[pmo.pmoOffice] || Building2) : Building2;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-wireframe-stroke bg-black/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-gold/20 flex items-center justify-center">
                <Bot className="text-gold w-5 h-5" />
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
              }`} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">ACHEEVY Agent</h2>
              <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest">
                {isConnected ? (
                  <span className="text-emerald-400"><Zap className="w-2.5 h-2.5 inline" /> Live</span>
                ) : isConnecting ? (
                  <span className="text-gold animate-pulse">Connecting...</span>
                ) : (
                  <span className="text-gray-500">Offline</span>
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
          <span className="text-white/20">|</span>
          <span className="text-gold font-mono">{pmo.director}</span>
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gold to-gold flex items-center justify-center">
              <span className="text-2xl font-bold text-black">A</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">ACHEEVY Voice Agent</h3>
            <p className="text-white/30 text-sm max-w-sm mx-auto">
              Start a session to speak with ACHEEVY in real-time.
              Your tasks will be routed through the Chain of Command.
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

        {isConnected && conversation.isSpeaking && (
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
              Send
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
              disabled={isConnecting || !AGENT_ID}
              title={!AGENT_ID ? 'No agent ID configured' : 'Start voice session'}
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
          A.I.M.S. Voice Agent &bull; ElevenLabs + Deepgram Aura-2 + Groq Whisper
        </p>
      </div>
    </div>
  );
}
