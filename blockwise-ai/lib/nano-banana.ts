// Blockwise AI — Nano Banana Pro 2 (Gemini Image Generation)
// Generates branded property report cards and neighborhood infographics

const GEMINI_ENDPOINT = process.env.GEMINI_IMAGE_API_URL ??
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

interface PropertyCardData {
  address: string;
  price: number;
  blockScore: number;
  verdict: string;
  roi?: number;
  arv?: number;
}

interface NeighborhoodData {
  address: string;
  blockScore: number;
  schools: number;
  safety: number;
  appreciation: number;
  livability: number;
  development: number;
  verdict: string;
}

/** Generate a branded property report card image */
export async function generatePropertyCard(
  data: PropertyCardData
): Promise<{ imageBase64: string; mimeType: string }> {
  const prompt = `Create a sleek, modern real estate property report card with these exact specifications:

BRAND: "BLOCKWISE AI" logo at top, "Powered by A.I.M.S." subtitle
COLORS: Dark background (#0A0A0F), gold accents (#D4A843), white text
STYLE: Premium glass-morphism card design, rounded corners, subtle glow effects

CONTENT:
- Property: ${data.address}
- Price: $${data.price.toLocaleString()}
- Block Score: ${data.blockScore}/100 (show as circular progress)
- Verdict: ${data.verdict}
${data.arv ? `- ARV: $${data.arv.toLocaleString()}` : ''}
${data.roi ? `- ROI: ${data.roi.toFixed(1)}%` : ''}

Make it look like a premium fintech app screenshot — clean typography, data-dense but beautiful.`;

  return callGeminiImage(prompt);
}

/** Generate a neighborhood infographic */
export async function generateNeighborhoodInfographic(
  data: NeighborhoodData
): Promise<{ imageBase64: string; mimeType: string }> {
  const prompt = `Create a neighborhood intelligence infographic with these exact specifications:

BRAND: "BLOCKWISE AI" at top, dark premium design
COLORS: Dark background (#0A0A0F), gold accents (#D4A843), green/red for good/bad scores
STYLE: Data dashboard aesthetic, glass cards, modern typography

CONTENT FOR ${data.address}:
- Overall Block Score: ${data.blockScore}/100 (large, centered)
- Verdict: ${data.verdict}
- 5 Category Breakdown (each with score bar):
  * Schools: ${data.schools}/100
  * Safety: ${data.safety}/100
  * Appreciation: ${data.appreciation}/100
  * Livability: ${data.livability}/100
  * Development: ${data.development}/100

Layout: Hero score at top, 5 categories below in a grid. Clean, data-rich, premium.`;

  return callGeminiImage(prompt);
}

async function callGeminiImage(
  prompt: string
): Promise<{ imageBase64: string; mimeType: string }> {
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        responseMimeType: 'image/png',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini image generation failed (${res.status}): ${err}`);
  }

  const result = await res.json();
  const imagePart = result.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData
  );

  if (!imagePart?.inlineData) {
    throw new Error('No image data in Gemini response');
  }

  return {
    imageBase64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType ?? 'image/png',
  };
}
