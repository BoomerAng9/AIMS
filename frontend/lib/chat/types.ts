/**
 * ACHEEVY Chat Interface Types
 * Modern chat experience with streaming, voice I/O
 */

// ─────────────────────────────────────────────────────────────
// Message Types
// ─────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  audioUrl?: string;
  attachments?: MessageAttachment[];
  metadata?: Record<string, unknown>;
}

export interface MessageAttachment {
  type: 'image' | 'file' | 'code';
  name: string;
  url?: string;
  content?: string;
  mimeType?: string;
}

// ─────────────────────────────────────────────────────────────
// Voice Types
// ─────────────────────────────────────────────────────────────

export type VoiceInputState = 'idle' | 'listening' | 'processing' | 'error';
export type VoiceOutputState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface VoiceInputConfig {
  provider: 'groq' | 'deepgram' | 'openai' | 'browser';
  language?: string;
  continuous?: boolean;
}

export interface VoiceOutputConfig {
  provider: 'elevenlabs' | 'deepgram' | 'browser';
  voiceId?: string;
  autoPlay: boolean;
  speed?: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language?: string;
  duration?: number;
}

// ─────────────────────────────────────────────────────────────
// Chat Session Types
// ─────────────────────────────────────────────────────────────

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model?: string;
}

export interface ChatConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  voiceInput: VoiceInputConfig;
  voiceOutput: VoiceOutputConfig;
}

// ─────────────────────────────────────────────────────────────
// API Types
// ─────────────────────────────────────────────────────────────

export interface ChatRequest {
  sessionId: string;
  message: string;
  history?: ChatMessage[];
  config?: Partial<ChatConfig>;
}

export interface ChatResponse {
  sessionId: string;
  message: ChatMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ─────────────────────────────────────────────────────────────
// UI State Types
// ─────────────────────────────────────────────────────────────

export interface ChatUIState {
  isLoading: boolean;
  isStreaming: boolean;
  voiceInputState: VoiceInputState;
  voiceOutputState: VoiceOutputState;
  error: string | null;
  inputValue: string;
}
