/**
 * Edge Ping — Ultra-fast health check at the edge
 *
 * Sub-5ms response. No downstream service checks.
 * Designed for wearable/mobile connectivity monitoring.
 * Returns edge region, timestamp, and device classification.
 */

export const runtime = 'edge';

export async function GET(req: Request) {
  const deviceType = req.headers.get('x-device-type') || 'unknown';
  const edgeRegion = req.headers.get('x-edge-region') || req.headers.get('x-vercel-id')?.split('::')[0] || 'unknown';
  const edgeCountry = req.headers.get('x-edge-country') || 'unknown';

  return new Response(
    JSON.stringify({
      ok: true,
      ts: Date.now(),
      edge: edgeRegion,
      country: edgeCountry,
      device: deviceType,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Response-Time': '0',
      },
    },
  );
}
