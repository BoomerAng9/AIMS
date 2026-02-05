/**
 * DIY Module Types
 * Make It Mine - Hands-on home project guidance with Voice + Vision
 */

// ─────────────────────────────────────────────────────────────
// Project Definition
// ─────────────────────────────────────────────────────────────

export type DIYCategory =
  | 'home_repair'
  | 'woodworking'
  | 'plumbing'
  | 'electrical'
  | 'painting'
  | 'gardening'
  | 'crafts'
  | 'automotive'
  | 'electronics'
  | 'sewing'
  | 'other';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface DIYProject {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: DIYCategory;
  skillLevel: SkillLevel;
  estimatedDuration: string;
  toolsNeeded: string[];
  materialsNeeded: string[];
  safetyConsiderations: string[];
  createdAt: string;
  updatedAt: string;
  status: 'consultation' | 'active' | 'paused' | 'completed';
}

// ─────────────────────────────────────────────────────────────
// Consultation Flow
// ─────────────────────────────────────────────────────────────

export type ConsultationStep =
  | 'welcome'
  | 'project_description'
  | 'category_selection'
  | 'skill_assessment'
  | 'tools_inventory'
  | 'safety_briefing'
  | 'plan_review'
  | 'ready';

export interface ConsultationState {
  currentStep: ConsultationStep;
  projectDraft: Partial<DIYProject>;
  responses: Record<string, string>;
  isComplete: boolean;
}

export interface ConsultationQuestion {
  step: ConsultationStep;
  prompt: string;
  type: 'text' | 'select' | 'multiselect' | 'confirm';
  options?: string[];
  validation?: (value: string) => boolean;
}

// ─────────────────────────────────────────────────────────────
// Interaction Modes
// ─────────────────────────────────────────────────────────────

export type InteractionMode = 'voice_vision' | 'console';

export interface InteractionState {
  mode: InteractionMode;
  voiceEnabled: boolean;
  visionEnabled: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessingImage: boolean;
}

// ─────────────────────────────────────────────────────────────
// Permissions
// ─────────────────────────────────────────────────────────────

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unavailable';

export interface MediaPermissions {
  camera: PermissionStatus;
  microphone: PermissionStatus;
}

export type Platform = 'ios' | 'android' | 'web' | 'desktop';

export interface PermissionInstructions {
  platform: Platform;
  camera: string;
  microphone: string;
}

// ─────────────────────────────────────────────────────────────
// Google Vision Integration
// ─────────────────────────────────────────────────────────────

export interface VisionAnalysisRequest {
  sessionId: string;
  projectId: string;
  imageBase64: string;
  context: string; // What the user is trying to do
  question?: string; // Specific question about the image
}

export interface VisionLabel {
  description: string;
  score: number;
  topicality: number;
}

export interface VisionObject {
  name: string;
  score: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface VisionText {
  text: string;
  confidence: number;
}

export interface VisionAnalysisResult {
  labels: VisionLabel[];
  objects: VisionObject[];
  text: VisionText[];
  safeSearch: {
    adult: string;
    violence: string;
    racy: string;
  };
  dominantColors: string[];
  rawResponse?: unknown;
}

export interface VisionGuidanceResponse {
  sessionId: string;
  projectId: string;
  analysis: VisionAnalysisResult;
  guidance: string; // ACHEEVY's interpretation and advice
  warnings: string[]; // Safety warnings if any
  nextSteps: string[]; // Suggested next steps
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────
// Voice Interaction
// ─────────────────────────────────────────────────────────────

export interface VoiceMessage {
  id: string;
  role: 'user' | 'acheevy';
  content: string;
  timestamp: string;
  audioUrl?: string;
  hasImage?: boolean;
  imageAnalysis?: VisionGuidanceResponse;
}

export interface VoiceSessionState {
  projectId: string;
  messages: VoiceMessage[];
  isActive: boolean;
  lastActivity: string;
}

// ─────────────────────────────────────────────────────────────
// API Request/Response
// ─────────────────────────────────────────────────────────────

export interface DIYChatRequest {
  sessionId: string;
  projectId: string;
  message: string;
  imageBase64?: string;
  mode: InteractionMode;
}

export interface DIYChatResponse {
  sessionId: string;
  reply: string;
  audioUrl?: string; // TTS audio for voice mode
  visionAnalysis?: VisionGuidanceResponse;
  suggestedActions: string[];
}
