'use client';

/**
 * ExecutionStream — SSE-based execution output with artifacts
 *
 * Connects to ii-agent or ACHEEVY execution endpoints and displays:
 * - Real-time streaming output
 * - Artifact collection (files, code, URLs)
 * - Execution status and timing
 * - Copy/export controls
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import {
  Terminal, Play, Square, Copy, Download,
  FileText, Code2, ExternalLink, CheckCircle2,
  AlertCircle, Loader2, Clock,
} from 'lucide-react';

export interface ExecutionArtifact {
  name: string;
  type: 'file' | 'url' | 'code';
  content: string;
}

export type ExecutionStatus = 'idle' | 'connecting' | 'streaming' | 'completed' | 'failed';

interface ExecutionStreamProps {
  title?: string;
  endpoint: string;
  payload?: Record<string, any>;
  accentColor?: string;
  autoStart?: boolean;
  onComplete?: (output: string, artifacts: ExecutionArtifact[]) => void;
}

export function ExecutionStream({
  title = 'Execution Output',
  endpoint,
  payload,
  accentColor = 'blue',
  autoStart = false,
  onComplete,
}: ExecutionStreamProps) {
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [output, setOutput] = useState('');
  const [artifacts, setArtifacts] = useState<ExecutionArtifact[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLPreElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const execute = useCallback(async () => {
    setStatus('connecting');
    setOutput('');
    setArtifacts([]);
    startTimer();

    abortRef.current = new AbortController();

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream')) {
        // SSE streaming
        setStatus('streaming');
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('No response body');

        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const event = JSON.parse(data);
              if (event.type === 'output' || event.type === 'status') {
                setOutput(prev => prev + (event.content || event.message || '') + '\n');
              } else if (event.type === 'artifact') {
                setArtifacts(prev => [...prev, event.artifact]);
              } else if (event.type === 'error') {
                setOutput(prev => prev + `\n[ERROR] ${event.message}\n`);
              } else if (event.type === 'done' || event.type === 'complete') {
                break;
              }
            } catch {
              // Non-JSON line, append as plain text
              setOutput(prev => prev + data + '\n');
            }
          }
        }

        setStatus('completed');
      } else {
        // Standard JSON response
        setStatus('streaming');
        const json = await res.json();
        setOutput(json.output || json.reply || JSON.stringify(json, null, 2));
        if (json.artifacts) setArtifacts(json.artifacts);
        setStatus('completed');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setOutput(prev => prev + '\n[CANCELLED]\n');
        setStatus('idle');
      } else {
        setOutput(prev => prev + `\n[ERROR] ${err.message}\n`);
        setStatus('failed');
      }
    } finally {
      stopTimer();
      abortRef.current = null;
    }
  }, [endpoint, payload, startTimer, stopTimer]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    stopTimer();
  }, [stopTimer]);

  const copyOutput = useCallback(() => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Auto-start
  useEffect(() => {
    if (autoStart && status === 'idle') execute();
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify on complete
  useEffect(() => {
    if (status === 'completed' && onComplete) {
      onComplete(output, artifacts);
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => () => { abortRef.current?.abort(); stopTimer(); }, [stopTimer]);

  const STATUS_DISPLAY: Record<ExecutionStatus, { icon: typeof Terminal; color: string; label: string }> = {
    idle:       { icon: Terminal,      color: 'text-zinc-500',    label: 'Ready' },
    connecting: { icon: Loader2,       color: 'text-amber-400',   label: 'Connecting...' },
    streaming:  { icon: Loader2,       color: 'text-blue-400',    label: 'Streaming' },
    completed:  { icon: CheckCircle2,  color: 'text-emerald-400', label: 'Complete' },
    failed:     { icon: AlertCircle,   color: 'text-red-400',     label: 'Failed' },
  };

  const statusCfg = STATUS_DISPLAY[status];
  const StatusIcon = statusCfg.icon;

  return (
    <div className="rounded-xl border border-wireframe-stroke bg-[#111113] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-wireframe-stroke flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className={`w-4 h-4 text-${accentColor}-400`} />
          <span className="text-sm font-mono font-bold uppercase tracking-[0.15em] text-zinc-400">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-3.5 h-3.5 ${statusCfg.color} ${status === 'streaming' || status === 'connecting' ? 'animate-spin' : ''}`} />
          <span className={`text-[10px] font-mono uppercase tracking-wider ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
          {elapsed > 0 && (
            <span className="text-[10px] font-mono text-zinc-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {elapsed}s
            </span>
          )}
        </div>
      </div>

      {/* Output */}
      <div className="relative">
        <pre
          ref={outputRef}
          className="p-4 text-xs font-mono text-zinc-400 bg-[#0A0A0B] h-64 overflow-auto whitespace-pre-wrap"
        >
          {output || (
            <span className="text-zinc-700">
              {status === 'idle' ? 'Awaiting execution...' : 'Connecting to agent...'}
            </span>
          )}
          {(status === 'streaming' || status === 'connecting') && (
            <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-0.5" />
          )}
        </pre>

        {/* Copy button */}
        {output && (
          <button
            onClick={copyOutput}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-[#111113]/80 border border-wireframe-stroke hover:bg-white/5 transition-colors"
            title="Copy output"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-600" />}
          </button>
        )}
      </div>

      {/* Artifacts */}
      {artifacts.length > 0 && (
        <div className="px-4 py-3 border-t border-wireframe-stroke space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">Artifacts ({artifacts.length})</span>
          {artifacts.map((art, i) => {
            const ArtIcon = art.type === 'code' ? Code2 : art.type === 'url' ? ExternalLink : FileText;
            return (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0A0A0B] border border-wireframe-stroke">
                <ArtIcon className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                <span className="text-xs text-zinc-400 truncate flex-1">{art.name}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-600">{art.type}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="px-4 py-3 border-t border-wireframe-stroke flex items-center justify-end gap-2">
        {(status === 'idle' || status === 'completed' || status === 'failed') && (
          <button
            onClick={execute}
            className={`px-3 py-1.5 rounded-lg bg-${accentColor}-500/10 border border-${accentColor}-500/20 text-${accentColor}-400 text-xs font-mono hover:bg-${accentColor}-500/20 transition-all flex items-center gap-1.5`}
          >
            <Play className="w-3.5 h-3.5" />
            {status === 'completed' || status === 'failed' ? 'Re-run' : 'Execute'}
          </button>
        )}
        {(status === 'streaming' || status === 'connecting') && (
          <button
            onClick={cancel}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono hover:bg-red-500/20 transition-all flex items-center gap-1.5"
          >
            <Square className="w-3.5 h-3.5" />
            Cancel
          </button>
        )}
        {output && (
          <button
            onClick={copyOutput}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-wireframe-stroke text-zinc-500 text-xs font-mono hover:bg-white/10 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        )}
      </div>
    </div>
  );
}
