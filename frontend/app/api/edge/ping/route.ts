/**
 * Ping — Ultra-fast health check
 *
 * Sub-5ms response. No downstream service checks.
 * Designed for wearable/mobile connectivity monitoring.
 * Returns timestamp and device classification.
 */

export async function GET(req: Request) {
  const deviceType = req.headers.get('x-device-type') || 'unknown';

  return new Response(
    JSON.stringify({
      ok: true,
      ts: Date.now(),
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
