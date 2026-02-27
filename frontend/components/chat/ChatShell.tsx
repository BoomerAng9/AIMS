'use client';

/**
 * ChatShell — Lightweight container wrapping ChatInterface
 *
 * Provides:
 * - Header bar with ACHEEVY identity and connection status indicator
 * - Chat controls (clear, toggle orchestration, toggle voice)
 * - Passes through all ChatInterface props
 * - Responsive layout with proper scrolling
 * - Connection health polling via /api/health
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  RotateCcw,
  Settings,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
} from 'lucide-react';
import Image from 'next/image';
import { ChatInterface } from './ChatInterface';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

interface ChatShellProps {
  /** Pass-through props for ChatInterface */
  sessionId?: string;
  userId?: string;
  userName?: string;
  projectTitle?: string;
  projectObjective?: string;
  model?: string;
  placeholder?: string;
  welcomeMessage?: string;
  autoPlayVoice?: boolean;
  showOrchestration?: boolean;
  /** Shell-specific props */
  onClose?: () => void;
  isFullscreen?: boolean;
  className?: string;
}

// ─────────────────────────────────────────────────────────────
// Connection status hook
// ─────────────────────────────────────────────────────────────

function useConnectionStatus(pollIntervalMs = 30000): {
  status: ConnectionStatus;
  latency: number | null;
  lastChecked: Date | null;
  retry: () => void;
} {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkHealth = useCallback(async () => {
    const start = Date.now();
    try {
      const res = await fetch('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        setStatus('connected');
        setLatency(Date.now() - start);
      } else {
        setStatus('disconnected');
        setLatency(null);
      }
    } catch {
      setStatus('disconnected');
      setLatency(null);
    }
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    checkHealth();
    intervalRef.current = setInterval(checkHealth, pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkHealth, pollIntervalMs]);

  const retry = useCallback(() => {
    setStatus('connecting');
    checkHealth();
  }, [checkHealth]);

  return { status, latency, lastChecked, retry };
}

// ─────────────────────────────────────────────────────────────
// Connection status badge
// ─────────────────────────────────────────────────────────────

function ConnectionBadge({
  status,
  latency,
  onRetry,
}: {
  status: ConnectionStatus;
  latency: number | null;
  onRetry: () => void;
}) {
  const config = {
    connected: {
      color: 'bg-emerald-500',
      text: 'text-emerald-600',
      label: 'Connected',
      ping: true,
    },
    connecting: {
      color: 'bg-amber-400',
      text: 'text-amber-600',
      label: 'Connecting',
      ping: true,
    },
    disconnected: {
      color: 'bg-red-400',
      text: 'text-red-500',
      label: 'Offline',
      ping: false,
    },
  }[status];

  return (
    <button
      onClick={status === 'disconnected' ? onRetry : undefined}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
        status === 'disconnected'
          ? 'hover:bg-red-50 cursor-pointer'
          : 'cursor-default'
      }`}
      title={
        status === 'disconnected'
          ? 'Click to retry connection'
          : latency
            ? `Latency: ${latency}ms`
            : 'Checking connection...'
      }
    >
      <span className="relative flex h-2 w-2">
        {config.ping && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`}
        />
      </span>
      <span
        className={`text-xs font-medium tracking-wider uppercase ${config.text}`}
      >
        {config.label}
      </span>
      {status === 'connected' && latency !== null && (
        <span className="text-[9px] font-mono text-slate-300">
          {latency}ms
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// ChatShell component
// ─────────────────────────────────────────────────────────────

export function ChatShell({
  sessionId,
  userId,
  userName,
  projectTitle,
  projectObjective,
  model,
  placeholder,
  welcomeMessage,
  autoPlayVoice = true,
  showOrchestration = true,
  onClose,
  isFullscreen: initialFullscreen = false,
  className = '',
}: ChatShellProps) {
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(autoPlayVoice);
  const [orchestrationEnabled, setOrchestrationEnabled] =
    useState(showOrchestration);
  const { status, latency, retry } = useConnectionStatus();

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  return (
    <div
      className={`
        flex flex-col bg-white
        ${
          isFullscreen
            ? 'fixed inset-0 z-50'
            : 'h-[calc(100vh-160px)] md:h-[calc(100vh-120px)] rounded-2xl border border-slate-200 shadow-sm overflow-hidden'
        }
        ${className}
      `}
    >
      {/* ─── Header Bar ─── */}
      <header className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
        {/* Left: ACHEEVY identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center overflow-hidden shadow-[0_0_12px_rgba(212,175,55,0.15)]">
            <Image
              src="/images/acheevy/acheevy-helmet.png"
              alt="ACHEEVY"
              width={28}
              height={28}
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800 tracking-wide">
            <h1 className="text-xl font-semibold text-zinc-100 font-display tracking-wider">
              ACHEEVY
            </h1>
            <ConnectionBadge
              status={status}
              latency={latency}
              onRetry={retry}
            />
          </div>
        </div>

        {/* Center: Session/Project info (desktop only) */}
        {projectTitle && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              Session:
            </span>
            <span className="text-xs text-slate-600 font-mono truncate max-w-[200px]">
              {projectTitle}
            </span>
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {children || (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30">
            <div className="h-16 w-16 rounded-full border border-dashed border-gold/20 flex items-center justify-center text-2xl">
              ?
            </div>
            <p className="text-lg font-handwriting text-zinc-100">
              Think it. Speak it. ACHEEVY builds it.
            </p>
            <p className="text-xs uppercase tracking-widest max-w-xs">
              System is ready for your primary business mission.
            </p>
          </div>
        )}

        {/* Right: Controls */}
        <div className="flex items-center gap-1">
          {/* Voice toggle */}
          <button
            onClick={() => setVoiceEnabled((v) => !v)}
            className={`p-2 rounded-lg transition-colors ${
              voiceEnabled
                ? 'text-gold bg-gold/10 hover:bg-gold/20'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
            title={voiceEnabled ? 'Mute voice responses' : 'Enable voice responses'}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Settings dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              title="Chat settings"
            >
              <Settings size={16} />
      {/* Input Area */}
      <footer className="p-4 md:p-6">
        <div className="rounded-3xl border border-wireframe-stroke bg-[#111113] p-2 backdrop-blur-2xl shadow-xl flex items-center gap-2 focus-within:border-gold/30 transition-all">
          <button disabled className="p-3 text-zinc-600 hover:text-zinc-100 transition-colors">
            <Paperclip size={20} />
          </button>
          <input 
            type="text" 
            placeholder="Speak or type your mission directive..." 
            className="flex-1 bg-transparent py-3 px-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
            disabled
          />
          <div className="flex items-center gap-1 pr-1">
            <button disabled className="p-3 rounded-full bg-[#18181B] text-zinc-600 hover:text-zinc-100 transition-colors">
              <Mic size={20} />
            </button>
            <button disabled className="p-3 rounded-full bg-gold/10 text-gold/20">
              <Send size={20} />
            </button>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50"
                >
                  <div className="space-y-1">
                    {/* Orchestration toggle */}
                    <button
                      onClick={() => setOrchestrationEnabled((o) => !o)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <span>Agent Orchestration</span>
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          orchestrationEnabled
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {orchestrationEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* Voice toggle */}
                    <button
                      onClick={() => setVoiceEnabled((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <span>Voice Responses</span>
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          voiceEnabled
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {voiceEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    {/* Connection info */}
                    <div className="px-3 py-2">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">
                        Connection
                      </p>
                      <div className="flex items-center gap-2">
                        <ConnectionBadge
                          status={status}
                          latency={latency}
                          onRetry={retry}
                        />
                      </div>
                    </div>

                    {/* Reconnect button */}
                    {status === 'disconnected' && (
                      <button
                        onClick={retry}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <RotateCcw size={12} />
                        <span>Retry Connection</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 size={16} />
            ) : (
              <Maximize2 size={16} />
            )}
          </button>

          {/* Close button (only when onClose is provided) */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors"
              title="Close chat"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Close settings dropdown when clicking outside */}
      {showSettings && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSettings(false)}
        />
      )}

      {/* ─── Chat Interface ─── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatInterface
          sessionId={sessionId}
          userId={userId}
          userName={userName}
          projectTitle={projectTitle}
          projectObjective={projectObjective}
          model={model}
          placeholder={placeholder}
          welcomeMessage={
            welcomeMessage ||
            "I'm ACHEEVY, your AI executive orchestrator. Tell me what you need — I'll classify, route, and execute."
          }
          autoPlayVoice={voiceEnabled}
          showOrchestration={orchestrationEnabled}
        />
      </div>
    </div>
  );
}
