'use client';

/**
 * User Input Modal (Change Order)
 *
 * When Boomer_Angs pause and request user input, this modal appears
 * allowing users to provide:
 * - Voice input (with Whisper transcription)
 * - Images (analyzed via Vision API)
 * - Files (documents, spreadsheets)
 * - Code snippets
 * - Text clarifications
 *
 * This creates a "Change Order" that updates billing/token usage.
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  ChangeOrder,
  ChangeOrderInput,
  VoiceInput,
  ImageInput,
  FileInput,
  CodeInput,
  TextInput,
  ChangeOrderInputType,
} from '@/lib/change-order/types';
import {
  estimateChangeOrderCost,
  estimateInputTokens,
  formatCurrency,
} from '@/lib/change-order/types';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const MicIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const ImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const FileIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CodeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const TextIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="17" y1="10" x2="3" y2="10" />
    <line x1="21" y1="6" x2="3" y2="6" />
    <line x1="21" y1="14" x2="3" y2="14" />
    <line x1="17" y1="18" x2="3" y2="18" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Input Type Tab
// ─────────────────────────────────────────────────────────────

const INPUT_TABS: { type: ChangeOrderInputType; label: string; icon: typeof MicIcon }[] = [
  { type: 'voice', label: 'Voice', icon: MicIcon },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'file', label: 'File', icon: FileIcon },
  { type: 'code', label: 'Code', icon: CodeIcon },
  { type: 'text', label: 'Text', icon: TextIcon },
];

// ─────────────────────────────────────────────────────────────
// Voice Input Panel
// ─────────────────────────────────────────────────────────────

interface VoiceInputPanelProps {
  onCapture: (input: VoiceInput) => void;
}

function VoiceInputPanel({ onCapture }: VoiceInputPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(blob);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Transcription failed');

      const data = await response.json();

      onCapture({
        type: 'voice',
        transcript: data.text,
        duration,
        confidence: data.confidence || 0.95,
      });
    } catch (err) {
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
      setDuration(0);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {isTranscribing ? (
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Transcribing...</p>
        </div>
      ) : (
        <>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center transition-all
              ${isRecording
                ? 'bg-red-500/20 border-2 border-red-500 animate-pulse'
                : 'bg-gold/20 border-2 border-gold/50 hover:border-gold'
              }
            `}
          >
            <MicIcon className={`w-8 h-8 ${isRecording ? 'text-red-400' : 'text-gold'}`} />
          </button>

          <p className="mt-4 text-sm text-white/70">
            {isRecording ? (
              <span className="text-red-400">Recording: {formatTime(duration)}</span>
            ) : (
              'Click to start recording'
            )}
          </p>

          {isRecording && (
            <p className="mt-2 text-xs text-white/40">
              Click again to stop and transcribe
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Image Input Panel
// ─────────────────────────────────────────────────────────────

interface ImageInputPanelProps {
  onCapture: (input: ImageInput) => void;
}

function ImageInputPanel({ onCapture }: ImageInputPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const url = URL.createObjectURL(file);
    setPreview(url);

    // Get dimensions
    const img = new Image();
    img.onload = () => {
      onCapture({
        type: 'image',
        url,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        width: img.width,
        height: img.height,
      });
    };
    img.src = url;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="py-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-gold bg-gold/10'
            : 'border-white/20 hover:border-white/40'
          }
        `}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
        ) : (
          <>
            <ImageIcon className="w-12 h-12 mx-auto text-white/30 mb-3" />
            <p className="text-white/70">Drop an image here or click to browse</p>
            <p className="text-xs text-white/30 mt-2">PNG, JPG, GIF up to 10MB</p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// File Input Panel
// ─────────────────────────────────────────────────────────────

interface FileInputPanelProps {
  onCapture: (input: FileInput) => void;
}

function FileInputPanel({ onCapture }: FileInputPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    setFileName(file.name);

    let preview: string | undefined;
    if (file.type.startsWith('text/') || file.name.endsWith('.json') || file.name.endsWith('.md')) {
      const text = await file.text();
      preview = text.slice(0, 500);
    }

    onCapture({
      type: 'file',
      url,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      preview,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="py-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-gold bg-gold/10'
            : 'border-white/20 hover:border-white/40'
          }
        `}
      >
        {fileName ? (
          <div className="flex items-center justify-center gap-3">
            <FileIcon className="w-8 h-8 text-gold" />
            <span className="text-white">{fileName}</span>
          </div>
        ) : (
          <>
            <FileIcon className="w-12 h-12 mx-auto text-white/30 mb-3" />
            <p className="text-white/70">Drop a file here or click to browse</p>
            <p className="text-xs text-white/30 mt-2">PDF, DOC, TXT, CSV, JSON up to 25MB</p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.json,.md,.xlsx,.xls"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Code Input Panel
// ─────────────────────────────────────────────────────────────

interface CodeInputPanelProps {
  onCapture: (input: CodeInput) => void;
}

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'go', 'rust',
  'c', 'cpp', 'csharp', 'php', 'ruby', 'swift', 'kotlin',
  'sql', 'html', 'css', 'json', 'yaml', 'shell', 'other'
];

function CodeInputPanel({ onCapture }: CodeInputPanelProps) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [filename, setFilename] = useState('');

  const handleSubmit = () => {
    if (!code.trim()) return;

    const lineCount = code.split('\n').length;
    onCapture({
      type: 'code',
      content: code,
      language,
      filename: filename || undefined,
      lineCount,
    });
  };

  return (
    <div className="py-4 space-y-4">
      <div className="flex gap-3">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="h-10 px-3 rounded-lg bg-black/40 border border-wireframe-stroke text-white text-sm focus:border-gold outline-none"
        >
          {LANGUAGES.map(lang => (
            <option key={lang} value={lang} className="bg-black">
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="Filename (optional)"
          className="flex-1 h-10 px-3 rounded-lg bg-black/40 border border-wireframe-stroke text-white text-sm placeholder:text-white/20 focus:border-gold outline-none"
        />
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste or type your code here..."
        className="w-full h-48 p-4 rounded-xl bg-black/60 border border-wireframe-stroke text-white font-mono text-sm placeholder:text-white/20 focus:border-gold outline-none resize-none"
      />

      <div className="flex justify-between items-center">
        <span className="text-xs text-white/30">
          {code.split('\n').length} lines
        </span>
        <button
          onClick={handleSubmit}
          disabled={!code.trim()}
          className="px-4 py-2 rounded-lg bg-gold text-black text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-light transition-colors"
        >
          Add Code
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Text Input Panel
// ─────────────────────────────────────────────────────────────

interface TextInputPanelProps {
  onCapture: (input: TextInput) => void;
}

function TextInputPanel({ onCapture }: TextInputPanelProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;

    const wordCount = text.trim().split(/\s+/).length;
    onCapture({
      type: 'text',
      content: text,
      wordCount,
    });
  };

  return (
    <div className="py-4 space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your clarification or additional information here..."
        className="w-full h-40 p-4 rounded-xl bg-black/40 border border-wireframe-stroke text-white text-sm placeholder:text-white/20 focus:border-gold outline-none resize-none"
      />

      <div className="flex justify-between items-center">
        <span className="text-xs text-white/30">
          {text.trim() ? text.trim().split(/\s+/).length : 0} words
        </span>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="px-4 py-2 rounded-lg bg-gold text-black text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-light transition-colors"
        >
          Add Text
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Input Preview
// ─────────────────────────────────────────────────────────────

function InputPreview({ input, onRemove }: { input: ChangeOrderInput; onRemove: () => void }) {
  const getIcon = () => {
    switch (input.type) {
      case 'voice': return <MicIcon className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'file': return <FileIcon className="w-4 h-4" />;
      case 'code': return <CodeIcon className="w-4 h-4" />;
      case 'text': return <TextIcon className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch (input.type) {
      case 'voice': return `Voice (${Math.round(input.duration)}s)`;
      case 'image': return input.filename;
      case 'file': return input.filename;
      case 'code': return `${input.language} (${input.lineCount} lines)`;
      case 'text': return `Text (${input.wordCount} words)`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-wireframe-stroke">
      <span className="text-gold">{getIcon()}</span>
      <span className="flex-1 text-sm text-white truncate">{getLabel()}</span>
      <span className="text-xs text-white/30">
        ~{estimateInputTokens(input)} tokens
      </span>
      <button
        onClick={onRemove}
        className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-red-400 transition-colors"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────

interface UserInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (changeOrder: Partial<ChangeOrder>) => void;
  triggerQuestion: string;
  requestingAgent: string;
  department: string;
}

export function UserInputModal({
  isOpen,
  onClose,
  onSubmit,
  triggerQuestion,
  requestingAgent,
  department,
}: UserInputModalProps) {
  const [activeTab, setActiveTab] = useState<ChangeOrderInputType>('text');
  const [inputs, setInputs] = useState<ChangeOrderInput[]>([]);

  const handleCapture = useCallback((input: ChangeOrderInput) => {
    setInputs(prev => [...prev, input]);
  }, []);

  const handleRemove = useCallback((index: number) => {
    setInputs(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = () => {
    if (inputs.length === 0) return;

    onSubmit({
      triggerQuestion,
      requestingAgent,
      department,
      inputs,
      status: 'submitted',
      priority: 'normal',
    });

    setInputs([]);
    onClose();
  };

  // Calculate estimated cost
  const mockOrder: Partial<ChangeOrder> = {
    inputs,
    priority: 'normal',
  };
  const estimatedCost = inputs.length > 0
    ? estimateChangeOrderCost(mockOrder as ChangeOrder)
    : 0;

  const totalTokens = inputs.reduce((sum, input) => sum + estimateInputTokens(input), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[#0A0A0A] border border-wireframe-stroke rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-wireframe-stroke">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">
                      CHANGE ORDER
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-white mt-2">
                    Input Required
                  </h2>
                  <p className="text-sm text-white/40 mt-1">{triggerQuestion}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Requesting agent */}
              <p className="text-xs text-white/30 mt-3">
                Requested by <span className="text-gold">{requestingAgent}</span> from {department}
              </p>
            </div>

            {/* Input Tabs */}
            <div className="px-6 pt-4">
              <div className="flex gap-2">
                {INPUT_TABS.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                      ${activeTab === type
                        ? 'bg-gold/20 text-gold border border-gold/30'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Panel */}
            <div className="px-6">
              {activeTab === 'voice' && <VoiceInputPanel onCapture={handleCapture} />}
              {activeTab === 'image' && <ImageInputPanel onCapture={handleCapture} />}
              {activeTab === 'file' && <FileInputPanel onCapture={handleCapture} />}
              {activeTab === 'code' && <CodeInputPanel onCapture={handleCapture} />}
              {activeTab === 'text' && <TextInputPanel onCapture={handleCapture} />}
            </div>

            {/* Collected Inputs */}
            {inputs.length > 0 && (
              <div className="px-6 py-4 border-t border-wireframe-stroke">
                <p className="text-xs text-white/30 mb-2">Collected Inputs ({inputs.length})</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {inputs.map((input, i) => (
                    <InputPreview
                      key={i}
                      input={input}
                      onRemove={() => handleRemove(i)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-wireframe-stroke bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/40">
                  <span>Est. tokens: {totalTokens.toLocaleString()}</span>
                  <span className="mx-2">•</span>
                  <span>Est. cost: {formatCurrency(estimatedCost)}</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-wireframe-stroke text-white/70 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={inputs.length === 0}
                    className="px-4 py-2 rounded-lg bg-gold text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-light transition-colors"
                  >
                    Submit Change Order
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default UserInputModal;
