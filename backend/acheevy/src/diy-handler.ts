/**
 * DIY Handler — Voice + Vision mode for hands-on projects
 * Processes user messages with optional image analysis via Google Vision.
 *
 * Sessions are persisted to Redis with 24h TTL.
 */

import { processVisionRequest } from './vision/google-vision';
import { ttsClient } from './tts-client';
import type { VisionGuidanceResponse } from './vision/types';
import { redisGet, redisSet } from './redis';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface DIYRequest {
  sessionId: string;
  projectId: string;
  message: string;
  imageBase64?: string;
  mode: 'voice_vision' | 'console';
}

export interface DIYResponse {
  sessionId: string;
  reply: string;
  audioUrl?: string;
  visionAnalysis?: VisionGuidanceResponse;
  suggestedActions: string[];
}

// ─────────────────────────────────────────────────────────────
// Session State (Redis-backed with in-memory fallback)
// ─────────────────────────────────────────────────────────────

interface DIYSession {
  projectId: string;
  projectContext: string;
  messageCount: number;
  lastImageAnalysis?: VisionGuidanceResponse;
}

const DIY_PREFIX = 'acheevy:diy:';
const DIY_TTL = 24 * 60 * 60; // 24 hours

async function getSession(sessionId: string, projectId: string): Promise<DIYSession> {
  const key = `${DIY_PREFIX}${sessionId}`;
  const raw = await redisGet(key);

  if (raw) {
    try {
      return JSON.parse(raw) as DIYSession;
    } catch {
      // corrupt data, create new
    }
  }

  return {
    projectId,
    projectContext: '',
    messageCount: 0,
  };
}

async function saveSession(sessionId: string, session: DIYSession): Promise<void> {
  const key = `${DIY_PREFIX}${sessionId}`;
  await redisSet(key, JSON.stringify(session), DIY_TTL);
}

// ─────────────────────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────────────────────

export async function processDIYRequest(request: DIYRequest): Promise<DIYResponse> {
  const session = await getSession(request.sessionId, request.projectId);
  session.messageCount++;

  let visionAnalysis: VisionGuidanceResponse | undefined;
  let reply = '';
  const suggestedActions: string[] = [];

  // Process image if provided
  if (request.imageBase64 && request.mode === 'voice_vision') {
    try {
      visionAnalysis = await processVisionRequest({
        sessionId: request.sessionId,
        projectId: request.projectId,
        imageBase64: request.imageBase64,
        context: session.projectContext || request.message,
        question: request.message,
      });

      session.lastImageAnalysis = visionAnalysis;

      // Build reply from vision analysis
      reply = visionAnalysis.guidance;

      if (visionAnalysis.warnings.length > 0) {
        reply += '\n\n\u26a0\ufe0f ' + visionAnalysis.warnings.join('\n\u26a0\ufe0f ');
      }

      suggestedActions.push(...visionAnalysis.nextSteps);
    } catch (err) {
      console.warn('[DIY] Vision analysis failed:', err);
      reply = generateTextResponse(request.message, session);
      suggestedActions.push('Try capturing another image', 'Describe what you see');
    }
  } else {
    // Text-only response
    reply = generateTextResponse(request.message, session);
    suggestedActions.push(
      'Show me with the camera for better guidance',
      'Ask about specific steps',
      'Request safety information'
    );
  }

  // Update session context
  session.projectContext += ` ${request.message}`;
  await saveSession(request.sessionId, session);

  // Generate TTS audio for voice+vision mode
  let audioUrl: string | undefined;
  if (request.mode === 'voice_vision') {
    const ttsResult = await ttsClient.generateSpeech(reply);
    audioUrl = ttsResult.audioUrl ?? undefined;
  }

  return {
    sessionId: request.sessionId,
    reply,
    audioUrl,
    visionAnalysis,
    suggestedActions,
  };
}

// ─────────────────────────────────────────────────────────────
// Text Response Generation
// ─────────────────────────────────────────────────────────────

function generateTextResponse(message: string, session: DIYSession): string {
  const lower = message.toLowerCase();

  // Greeting / start
  if (session.messageCount === 1 || lower.includes('hello') || lower.includes('hi')) {
    return "Hello! I'm ACHEEVY, your DIY project assistant. I can see through your camera and hear your voice. Show me what you're working on, or describe your question and I'll help guide you through it.";
  }

  // Tool-related questions
  if (lower.includes('tool') || lower.includes('what do i need')) {
    return "To recommend the right tools, it helps to see your project. Can you show me with the camera? Generally, most DIY projects need:\n\n\u2022 Measuring tools (tape measure, level)\n\u2022 Fastening tools (screwdriver, drill)\n\u2022 Cutting tools appropriate for your material\n\u2022 Safety equipment (glasses, gloves)\n\nWhat material are you working with?";
  }

  // Measurement questions
  if (lower.includes('measure') || lower.includes('size') || lower.includes('dimension')) {
    return "For accurate measurements:\n\n1. Use a tape measure for length and width\n2. Use a level to check if surfaces are even\n3. Measure twice, cut once!\n\nTip: Show me the area with the camera and place a common object (like a coin or ruler) in frame for scale reference.";
  }

  // Safety questions
  if (lower.includes('safe') || lower.includes('danger') || lower.includes('careful')) {
    return "Safety is crucial! Here are key points:\n\n\u2022 Always wear safety glasses when cutting or drilling\n\u2022 Use gloves when handling rough materials\n\u2022 Ensure good ventilation with paints/adhesives\n\u2022 Keep your workspace clean and organized\n\u2022 Know where your first aid kit is\n\u2022 If working with electricity, turn off the breaker first\n\nWhat specific safety concern do you have?";
  }

  // How-to questions
  if (lower.includes('how do i') || lower.includes('how to') || lower.includes('steps')) {
    return "I'd be happy to walk you through the steps. To give you the most accurate guidance:\n\n1. Show me your current setup with the camera\n2. Tell me what end result you're aiming for\n3. Let me know what tools/materials you have\n\nOnce I can see what you're working with, I'll provide step-by-step instructions.";
  }

  // Problem/fix questions
  if (lower.includes('fix') || lower.includes('repair') || lower.includes('broken') || lower.includes('problem')) {
    return "I can help troubleshoot! Show me the issue with your camera - capture a clear image of the problem area. The more I can see, the better I can diagnose what's going on and suggest a fix.\n\nWhile you get that ready, can you describe:\n\u2022 What happened?\n\u2022 When did you first notice it?\n\u2022 Have you tried anything to fix it already?";
  }

  // Reference to previous image
  if (session.lastImageAnalysis) {
    const labels = session.lastImageAnalysis.analysis.labels.slice(0, 3).map(l => l.description);
    return `Based on what I saw earlier (${labels.join(', ')}), I can continue helping. What specific question do you have about your project? Or capture a new image if you've made progress.`;
  }

  // Default response
  return "I'm here to help! For the best guidance:\n\n\u2022 Use the camera to show me your project\n\u2022 Ask specific questions about steps or techniques\n\u2022 Tell me about any problems you're facing\n\nWhat would you like to work on?";
}
