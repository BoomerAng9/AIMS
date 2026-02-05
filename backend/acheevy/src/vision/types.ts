/**
 * Vision Module Types
 * Shared types for Google Vision integration
 */

export interface VisionAnalysisRequest {
  sessionId: string;
  projectId: string;
  imageBase64: string;
  context: string;
  question?: string;
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
  guidance: string;
  warnings: string[];
  nextSteps: string[];
  timestamp: string;
}
