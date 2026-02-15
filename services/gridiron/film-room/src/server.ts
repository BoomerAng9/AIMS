/**
 * Gridiron Film Room — Vertex AI Bridge for SAM 2 Video Segmentation
 *
 * Lightweight bridge service that:
 *   1. Receives video URLs + player coordinates from War Room
 *   2. Sends to SAM 2 endpoint on Vertex AI (GPU-powered)
 *   3. Returns segmentation masks, speed burst data, separation metrics
 *
 * SAM 2 (Segment Anything Model 2) by Meta runs on Vertex AI
 * with an NVIDIA Tesla T4 GPU. This bridge avoids running heavy
 * GPU workloads on the VPS.
 */

const PORT = Number(process.env.PORT) || 5002;
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || 'ai-managed-services';
const GCP_REGION = process.env.GCP_REGION || 'us-central1';
const VERTEX_ENDPOINT_ID = process.env.VERTEX_ENDPOINT_ID || '';
const WAR_ROOM_URL = process.env.WAR_ROOM_URL || 'http://war-room:5003';

// ─── Types ────────────────────────────────────────────────────────────────

interface FilmAnalysisRequest {
  requestId: string;
  prospectName: string;
  videoUrl: string;
  clickCoords: [number, number][];   // Initial player location in frame 0
  frameRate?: number;
  analysisType: 'FULL_GAME' | 'HIGHLIGHT_REEL' | 'SINGLE_PLAY';
}

interface SegmentationFrame {
  frameIndex: number;
  playerIsolated: boolean;
  boundingBox?: { x: number; y: number; w: number; h: number };
  maskSummary: string;
}

interface FilmAnalysisResult {
  requestId: string;
  prospectName: string;
  status: 'COMPLETE' | 'PARTIAL' | 'FAILED' | 'ENDPOINT_NOT_CONFIGURED';
  framesAnalyzed: number;
  segmentation: SegmentationFrame[];
  metrics: {
    speedBursts: number;
    avgSeparationYards: number;
    routeSharpness: number;        // 0-100
    playRecognition: number;       // 0-100
  };
  processingTimeMs: number;
  vertexEndpointUsed: boolean;
}

// ─── Vertex AI Client ─────────────────────────────────────────────────────

async function callVertexSAM2(
  videoUrl: string,
  clickCoords: [number, number][],
  frameRate: number,
): Promise<{ frames: SegmentationFrame[]; success: boolean }> {
  if (!VERTEX_ENDPOINT_ID) {
    console.warn('[FilmRoom] VERTEX_ENDPOINT_ID not configured — returning mock analysis');
    return {
      success: false,
      frames: generateMockFrames(30),
    };
  }

  const endpointUrl = `https://${GCP_REGION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${GCP_REGION}/endpoints/${VERTEX_ENDPOINT_ID}:predict`;

  try {
    // In production, use Google Auth library with service account
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{
          video_url: videoUrl,
          click_coords: clickCoords,
          frame_rate: frameRate,
        }],
      }),
    });

    if (!res.ok) {
      console.error(`[FilmRoom] Vertex AI call failed: ${res.status}`);
      return { success: false, frames: generateMockFrames(30) };
    }

    const data = await res.json() as { predictions: Array<{ frame: number; mask_summary: string }> };
    const frames: SegmentationFrame[] = (data.predictions || []).map(p => ({
      frameIndex: p.frame,
      playerIsolated: true,
      maskSummary: p.mask_summary || 'Player Isolated',
    }));

    return { success: true, frames };
  } catch (err) {
    console.error('[FilmRoom] Vertex AI connection error:', err);
    return { success: false, frames: generateMockFrames(30) };
  }
}

function generateMockFrames(count: number): SegmentationFrame[] {
  return Array.from({ length: count }, (_, i) => ({
    frameIndex: i,
    playerIsolated: true,
    boundingBox: {
      x: 100 + Math.random() * 50,
      y: 200 + Math.random() * 30,
      w: 60 + Math.random() * 20,
      h: 120 + Math.random() * 20,
    },
    maskSummary: i % 10 === 0 ? 'Speed Burst Detected' : 'Player Isolated',
  }));
}

// ─── Metrics Computation ──────────────────────────────────────────────────

function computeMetrics(frames: SegmentationFrame[]): FilmAnalysisResult['metrics'] {
  const speedBursts = frames.filter(f => f.maskSummary.includes('Speed Burst')).length;

  // Estimate separation from bounding box movement variance
  const xPositions = frames
    .filter(f => f.boundingBox)
    .map(f => f.boundingBox!.x);

  const avgSeparation = xPositions.length > 1
    ? xPositions.reduce((sum, x, i, arr) => {
        if (i === 0) return 0;
        return sum + Math.abs(x - arr[i - 1]);
      }, 0) / (xPositions.length - 1) / 10  // normalize to yards
    : 2.5;

  return {
    speedBursts,
    avgSeparationYards: Math.round(avgSeparation * 10) / 10,
    routeSharpness: Math.min(100, 55 + speedBursts * 8 + Math.round(avgSeparation * 3)),
    playRecognition: Math.min(100, 50 + frames.filter(f => f.playerIsolated).length),
  };
}

// ─── State ────────────────────────────────────────────────────────────────

let totalAnalyses = 0;
const recentAnalyses: Array<{ requestId: string; prospect: string; status: string; timestamp: string }> = [];

// ─── HTTP Server ──────────────────────────────────────────────────────────

const server = Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const headers = { 'Content-Type': 'application/json' };

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'gridiron-film-room',
        vertexEndpointConfigured: !!VERTEX_ENDPOINT_ID,
        gcpProject: GCP_PROJECT_ID,
        totalAnalyses,
        uptime: process.uptime(),
      }), { headers });
    }

    // Analyze film
    if (url.pathname === '/api/analyze' && req.method === 'POST') {
      const start = Date.now();
      const body = await req.json() as FilmAnalysisRequest;

      if (!body.videoUrl || !body.clickCoords?.length) {
        return new Response(
          JSON.stringify({ error: 'videoUrl and clickCoords are required' }),
          { status: 400, headers },
        );
      }

      const requestId = body.requestId || `FILM-${Date.now()}`;
      console.log(`[FilmRoom] Analyzing film for ${body.prospectName} — ${body.analysisType}`);

      const { frames, success } = await callVertexSAM2(
        body.videoUrl,
        body.clickCoords,
        body.frameRate || 30,
      );

      const metrics = computeMetrics(frames);

      const result: FilmAnalysisResult = {
        requestId,
        prospectName: body.prospectName,
        status: success ? 'COMPLETE' : (VERTEX_ENDPOINT_ID ? 'PARTIAL' : 'ENDPOINT_NOT_CONFIGURED'),
        framesAnalyzed: frames.length,
        segmentation: frames,
        metrics,
        processingTimeMs: Date.now() - start,
        vertexEndpointUsed: success,
      };

      totalAnalyses++;
      recentAnalyses.unshift({
        requestId,
        prospect: body.prospectName,
        status: result.status,
        timestamp: new Date().toISOString(),
      });
      if (recentAnalyses.length > 50) recentAnalyses.pop();

      return new Response(JSON.stringify(result), { headers });
    }

    // Status
    if (url.pathname === '/api/status' && req.method === 'GET') {
      return new Response(JSON.stringify({
        service: 'gridiron-film-room',
        version: '1.0.0',
        config: {
          gcpProject: GCP_PROJECT_ID,
          gcpRegion: GCP_REGION,
          vertexEndpointConfigured: !!VERTEX_ENDPOINT_ID,
        },
        totalAnalyses,
        recentAnalyses: recentAnalyses.slice(0, 10),
      }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  },
});

console.log(`[FilmRoom] Gridiron Film Room running on port ${PORT}`);
console.log(`[FilmRoom] GCP Project: ${GCP_PROJECT_ID} | Region: ${GCP_REGION}`);
console.log(`[FilmRoom] Vertex SAM2 Endpoint: ${VERTEX_ENDPOINT_ID || 'NOT CONFIGURED (mock mode)'}`);
