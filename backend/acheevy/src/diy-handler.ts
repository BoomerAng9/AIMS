/**
 * DIY Handler — Voice + Vision mode for hands-on projects
 * Processes user messages with optional image analysis via Google Vision
 */

import { processVisionRequest } from './vision/google-vision';
import type { VisionGuidanceResponse } from './vision/types';

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
// Session State (in-memory for now)
// ─────────────────────────────────────────────────────────────

interface DIYSession {
  projectId: string;
  projectContext: string;
  messageCount: number;
  lastImageAnalysis?: VisionGuidanceResponse;
}

const sessions = new Map<string, DIYSession>();

function getSession(sessionId: string, projectId: string): DIYSession {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      projectId,
      projectContext: '',
      messageCount: 0,
    });
  }
  return sessions.get(sessionId)!;
}

// ─────────────────────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────────────────────

export async function processDIYRequest(request: DIYRequest): Promise<DIYResponse> {
  const session = getSession(request.sessionId, request.projectId);
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
        reply += '\n\n⚠️ ' + visionAnalysis.warnings.join('\n⚠️ ');
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

  return {
    sessionId: request.sessionId,
    reply,
    visionAnalysis,
    suggestedActions,
    // TODO: Generate TTS audio URL
    // audioUrl: await generateTTS(reply),
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
    return "To recommend the right tools, it helps to see your project. Can you show me with the camera? Generally, most DIY projects need:\n\n• Measuring tools (tape measure, level)\n• Fastening tools (screwdriver, drill)\n• Cutting tools appropriate for your material\n• Safety equipment (glasses, gloves)\n\nWhat material are you working with?";
  }

  // Measurement questions
  if (lower.includes('measure') || lower.includes('size') || lower.includes('dimension')) {
    return "For accurate measurements:\n\n1. Use a tape measure for length and width\n2. Use a level to check if surfaces are even\n3. Measure twice, cut once!\n\nTip: Show me the area with the camera and place a common object (like a coin or ruler) in frame for scale reference.";
  }

  // Safety questions
  if (lower.includes('safe') || lower.includes('danger') || lower.includes('careful')) {
    return "Safety is crucial! Here are key points:\n\n• Always wear safety glasses when cutting or drilling\n• Use gloves when handling rough materials\n• Ensure good ventilation with paints/adhesives\n• Keep your workspace clean and organized\n• Know where your first aid kit is\n• If working with electricity, turn off the breaker first\n\nWhat specific safety concern do you have?";
  }

  // How-to questions
  if (lower.includes('how do i') || lower.includes('how to') || lower.includes('steps')) {
    return "I'd be happy to walk you through the steps. To give you the most accurate guidance:\n\n1. Show me your current setup with the camera\n2. Tell me what end result you're aiming for\n3. Let me know what tools/materials you have\n\nOnce I can see what you're working with, I'll provide step-by-step instructions.";
  }

  // Problem/fix questions
  if (lower.includes('fix') || lower.includes('repair') || lower.includes('broken') || lower.includes('problem')) {
    return "I can help troubleshoot! Show me the issue with your camera - capture a clear image of the problem area. The more I can see, the better I can diagnose what's going on and suggest a fix.\n\nWhile you get that ready, can you describe:\n• What happened?\n• When did you first notice it?\n• Have you tried anything to fix it already?";
  }

  // Reference to previous image
  if (session.lastImageAnalysis) {
    const labels = session.lastImageAnalysis.analysis.labels.slice(0, 3).map(l => l.description);
    return `Based on what I saw earlier (${labels.join(', ')}), I can continue helping. What specific question do you have about your project? Or capture a new image if you've made progress.`;
  }

  // Default response
  return "I'm here to help! For the best guidance:\n\n• Use the camera to show me your project\n• Ask specific questions about steps or techniques\n• Tell me about any problems you're facing\n\nWhat would you like to work on?";
}
