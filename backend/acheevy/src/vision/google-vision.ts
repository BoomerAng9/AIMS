/**
 * Google Vision API Integration
 * Analyzes images for DIY project guidance
 *
 * Uses Cloud Vision API features:
 * - Label Detection: Identify objects, materials, tools
 * - Object Localization: Find and locate specific items
 * - Text Detection (OCR): Read labels, instructions, measurements
 * - Safe Search: Filter inappropriate content
 * - Image Properties: Dominant colors for material matching
 */

import type {
  VisionAnalysisRequest,
  VisionAnalysisResult,
  VisionGuidanceResponse,
  VisionLabel,
  VisionObject,
  VisionText,
} from './types';

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
const API_KEY = process.env.GOOGLE_VISION_API_KEY || '';

// ─────────────────────────────────────────────────────────────
// Vision API Request Builder
// ─────────────────────────────────────────────────────────────

interface VisionAPIRequest {
  requests: Array<{
    image: { content: string };
    features: Array<{ type: string; maxResults?: number }>;
  }>;
}

function buildVisionRequest(imageBase64: string): VisionAPIRequest {
  // Strip data URL prefix if present
  const base64Content = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  return {
    requests: [
      {
        image: { content: base64Content },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 20 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 15 },
          { type: 'TEXT_DETECTION', maxResults: 10 },
          { type: 'SAFE_SEARCH_DETECTION' },
          { type: 'IMAGE_PROPERTIES' },
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// Parse Vision API Response
// ─────────────────────────────────────────────────────────────

function parseLabels(labelAnnotations: any[] = []): VisionLabel[] {
  return labelAnnotations.map(label => ({
    description: label.description || '',
    score: label.score || 0,
    topicality: label.topicality || 0,
  }));
}

function parseObjects(localizedObjectAnnotations: any[] = []): VisionObject[] {
  return localizedObjectAnnotations.map(obj => {
    const vertices = obj.boundingPoly?.normalizedVertices || [];
    let boundingBox;

    if (vertices.length >= 4) {
      const xs = vertices.map((v: any) => v.x || 0);
      const ys = vertices.map((v: any) => v.y || 0);
      boundingBox = {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      };
    }

    return {
      name: obj.name || '',
      score: obj.score || 0,
      boundingBox,
    };
  });
}

function parseText(textAnnotations: any[] = []): VisionText[] {
  // First annotation is the full text, rest are individual words
  if (textAnnotations.length === 0) return [];

  return [
    {
      text: textAnnotations[0]?.description || '',
      confidence: textAnnotations[0]?.confidence || 0.9,
    },
  ];
}

function parseSafeSearch(safeSearchAnnotation: any = {}): VisionAnalysisResult['safeSearch'] {
  return {
    adult: safeSearchAnnotation.adult || 'UNKNOWN',
    violence: safeSearchAnnotation.violence || 'UNKNOWN',
    racy: safeSearchAnnotation.racy || 'UNKNOWN',
  };
}

function parseDominantColors(imagePropertiesAnnotation: any = {}): string[] {
  const colors = imagePropertiesAnnotation.dominantColors?.colors || [];
  return colors.slice(0, 5).map((c: any) => {
    const { red = 0, green = 0, blue = 0 } = c.color || {};
    return `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;
  });
}

// ─────────────────────────────────────────────────────────────
// Main Analysis Function
// ─────────────────────────────────────────────────────────────

export async function analyzeImage(imageBase64: string): Promise<VisionAnalysisResult> {
  if (!API_KEY) {
    console.warn('[GoogleVision] No API key configured, returning mock analysis');
    return getMockAnalysis();
  }

  try {
    const requestBody = buildVisionRequest(imageBase64);

    const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vision API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const result = data.responses?.[0] || {};

    return {
      labels: parseLabels(result.labelAnnotations),
      objects: parseObjects(result.localizedObjectAnnotations),
      text: parseText(result.textAnnotations),
      safeSearch: parseSafeSearch(result.safeSearchAnnotation),
      dominantColors: parseDominantColors(result.imagePropertiesAnnotation),
      rawResponse: result,
    };
  } catch (error) {
    console.error('[GoogleVision] Analysis failed:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// Generate DIY Guidance from Analysis
// ─────────────────────────────────────────────────────────────

export function generateGuidance(
  analysis: VisionAnalysisResult,
  context: string,
  question?: string
): { guidance: string; warnings: string[]; nextSteps: string[] } {
  const warnings: string[] = [];
  const nextSteps: string[] = [];

  // Check for safety concerns
  const safetyKeywords = ['power tool', 'saw', 'drill', 'ladder', 'electrical', 'wire', 'gas', 'flame'];
  const detectedTools = analysis.labels
    .filter(l => safetyKeywords.some(kw => l.description.toLowerCase().includes(kw)))
    .map(l => l.description);

  if (detectedTools.length > 0) {
    warnings.push(`Safety note: I see ${detectedTools.join(', ')}. Please ensure you're wearing appropriate protective equipment.`);
  }

  // Build guidance based on detected objects
  const topLabels = analysis.labels.slice(0, 5).map(l => l.description);
  const topObjects = analysis.objects.slice(0, 5).map(o => o.name);
  const detectedText = analysis.text.map(t => t.text).join(' ');

  let guidance = '';

  if (question) {
    guidance = `Regarding your question about "${question}": `;
  }

  if (topLabels.length > 0) {
    guidance += `I can see: ${topLabels.join(', ')}. `;
  }

  if (topObjects.length > 0) {
    guidance += `I've identified these items: ${topObjects.join(', ')}. `;
  }

  if (detectedText) {
    guidance += `I can read some text that says: "${detectedText.substring(0, 100)}${detectedText.length > 100 ? '...' : ''}". `;
  }

  // Context-aware suggestions
  if (context.toLowerCase().includes('measure') || context.toLowerCase().includes('size')) {
    nextSteps.push('For accurate measurements, place a ruler or common object (like a coin) in frame for scale reference.');
  }

  if (context.toLowerCase().includes('fix') || context.toLowerCase().includes('repair')) {
    nextSteps.push('Show me a close-up of the damaged area so I can better assess the repair needed.');
  }

  if (context.toLowerCase().includes('paint') || context.toLowerCase().includes('color')) {
    const colors = analysis.dominantColors.slice(0, 3);
    if (colors.length > 0) {
      guidance += `The dominant colors I see are: ${colors.join(', ')}. `;
      nextSteps.push('If you need to match this color, take this image to your local hardware store for color matching.');
    }
  }

  // Default next steps
  if (nextSteps.length === 0) {
    nextSteps.push('Show me another angle if you need more specific guidance.');
    nextSteps.push('Ask me about any of the items I identified for detailed instructions.');
  }

  return { guidance, warnings, nextSteps };
}

// ─────────────────────────────────────────────────────────────
// Process Full Vision Request (Entry Point)
// ─────────────────────────────────────────────────────────────

export async function processVisionRequest(
  request: VisionAnalysisRequest
): Promise<VisionGuidanceResponse> {
  const analysis = await analyzeImage(request.imageBase64);
  const { guidance, warnings, nextSteps } = generateGuidance(
    analysis,
    request.context,
    request.question
  );

  return {
    sessionId: request.sessionId,
    projectId: request.projectId,
    analysis,
    guidance,
    warnings,
    nextSteps,
    timestamp: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────
// Mock Analysis (for development/testing without API key)
// ─────────────────────────────────────────────────────────────

function getMockAnalysis(): VisionAnalysisResult {
  return {
    labels: [
      { description: 'Tool', score: 0.95, topicality: 0.9 },
      { description: 'Wood', score: 0.88, topicality: 0.85 },
      { description: 'Workshop', score: 0.82, topicality: 0.8 },
    ],
    objects: [
      { name: 'Hammer', score: 0.9 },
      { name: 'Screwdriver', score: 0.85 },
    ],
    text: [],
    safeSearch: { adult: 'VERY_UNLIKELY', violence: 'VERY_UNLIKELY', racy: 'VERY_UNLIKELY' },
    dominantColors: ['rgb(139, 90, 43)', 'rgb(210, 180, 140)', 'rgb(50, 50, 50)'],
  };
}
