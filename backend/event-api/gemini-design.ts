/**
 * Gemini Design Engine for AIMS Event Management
 * Default design engine per project requirements.
 * Generates marketing copy, email templates, and event content using Gemini 3.1 Pro.
 */

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent';

interface DesignResult {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export async function generateWithGemini(
  prompt: string,
  options?: { temperature?: number; maxTokens?: number; responseFormat?: 'text' | 'json' }
): Promise<DesignResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 1024,
        topP: 0.9,
        ...(options?.responseFormat === 'json' && { responseMimeType: 'application/json' })
      }
    })
  });

  if (!response.ok) throw new Error(`Gemini error: ${response.status}`);

  const result = await response.json();
  return {
    content: result.candidates?.[0]?.content?.parts?.[0]?.text || '',
    model: 'gemini-3.1-pro',
    usage: result.usageMetadata ? {
      promptTokens: result.usageMetadata.promptTokenCount,
      completionTokens: result.usageMetadata.candidatesTokenCount
    } : undefined
  };
}

export async function generateEventEmail(emailType: 'welcome' | 'reminder' | 'sponsor_followup', context: Record<string, string>): Promise<DesignResult> {
  const prompts: Record<string, string> = {
    welcome: `Write a welcome email for ${context.name} who just registered for the Coastal Talent and Innovation Hack-A-Thon (CTIH). Ticket type: ${context.ticketType}. Track interest: ${context.track}. Include: excitement, next steps, what to expect. Brand: energetic, inclusive, innovation-focused. HTML format with inline styles using navy (#0a0e27), electric blue (#00d4ff), and gold (#ffd700).`,
    reminder: `Write a reminder email for ${context.name} about the upcoming CTIH Hack-A-Thon. Event date: Coming Soon 2026. Include: event logistics, preparation tips, community links. Tone: encouraging and practical.`,
    sponsor_followup: `Write a follow-up email to ${context.contactName} at ${context.companyName} regarding their ${context.tier} sponsorship inquiry for CTIH Hack-A-Thon. Include: ROI highlights, next steps, scheduling a call. Tone: professional and partnership-oriented.`
  };

  return generateWithGemini(prompts[emailType], { temperature: 0.6, maxTokens: 2048 });
}

export async function generateSEOContent(pageUrl: string, pageType: string): Promise<DesignResult> {
  return generateWithGemini(
    `Generate SEO-optimized content for the CTIH Hack-A-Thon page at ${pageUrl}. Page type: ${pageType}. Include: meta title (under 60 chars), meta description (under 160 chars), H1 suggestion, 3 related keywords. Return as JSON.`,
    { temperature: 0.3, responseFormat: 'json' }
  );
}
