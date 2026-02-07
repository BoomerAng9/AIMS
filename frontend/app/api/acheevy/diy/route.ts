/**
 * DIY Chat API Route
 *
 * POST /api/acheevy/diy
 * Body: { sessionId?, projectId?, message, imageBase64?, mode? }
 *
 * SECURITY: All inputs validated and sanitized
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateDIYRequest } from '@/lib/security/validation';

const ACHEEVY_URL = process.env.ACHEEVY_URL || 'http://localhost:3003';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Validate all inputs - NO BACKDOORS
    const validation = validateDIYRequest(body);
    if (!validation.valid || !validation.data) {
      console.warn(`[DIY API] Validation failed: ${validation.error}`);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { sessionId, projectId, message, imageBase64, mode } = validation.data;

    // Forward to ACHEEVY DIY endpoint
    const response = await fetch(`${ACHEEVY_URL}/diy/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        projectId,
        message,
        imageBase64,
        mode,
      }),
    });

    if (!response.ok) {
      // Fallback response if ACHEEVY is unavailable
      return NextResponse.json({
        sessionId,
        reply: generateFallbackResponse(message, mode || 'chat', !!imageBase64),
        suggestedActions: [
          'Try rephrasing your question',
          'Show me a different angle',
          'Describe what you see',
        ],
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API/acheevy/diy] Error:', error);

    // Return a helpful fallback response
    return NextResponse.json({
      sessionId: 'fallback',
      reply: "I'm having trouble connecting to the AI service. Please try again in a moment. In the meantime, feel free to describe what you're working on or ask a general DIY question.",
      suggestedActions: ['Retry connection', 'Continue with text chat'],
    });
  }
}

function generateFallbackResponse(message: string, mode: string, hasImage: boolean): string {
  if (hasImage) {
    return "I received your image but couldn't analyze it at the moment. Could you describe what you're showing me? I can still help with guidance based on your description.";
  }

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return "I'd be happy to help! To give you the best guidance, try showing me what you're working on using the camera capture button, or describe your current situation in detail.";
  }

  if (lowerMessage.includes('tool') || lowerMessage.includes('need')) {
    return "For tool recommendations, it helps to see your project. Use the camera to show me what you're working with, and I can suggest the right tools for the job.";
  }

  if (lowerMessage.includes('safe') || lowerMessage.includes('danger')) {
    return "Safety first! General tips: Always wear appropriate protective equipment (safety glasses, gloves). Ensure good ventilation. Keep your workspace clear. If you're unsure about something, ask before proceeding.";
  }

  return "I'm here to help with your DIY project. You can ask me questions, show me images of what you're working on, or describe what you need help with. What would you like to know?";
}
