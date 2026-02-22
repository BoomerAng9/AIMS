/**
 * GET /api/circuit-box/boomerangs
 *
 * Fetches real Boomer_Ang list from House of Ang and checks their health.
 */

import { NextResponse } from 'next/server';

const HOUSE_OF_ANG_URL = process.env.HOUSE_OF_ANG_URL || 'http://house-of-ang:3002';

interface BoomerAng {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: string;
  endpoint: string;
  health_check: string;
}

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Get the list of registered agents
    const listRes = await fetch(`${HOUSE_OF_ANG_URL}/boomerangs`, {
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);

    if (!listRes.ok) {
      return NextResponse.json(
        { error: `House of Ang returned ${listRes.status}` },
        { status: 502 }
      );
    }

    const body = await listRes.json();
    // House of Ang wraps the array: { boomerangs: [...] }
    const agents: BoomerAng[] = Array.isArray(body) ? body : (body.boomerangs || []);

    // Check health of each agent in parallel
    const healthResults = await Promise.all(
      agents.map(async (agent) => {
        try {
          const hc = new AbortController();
          const hcTimeout = setTimeout(() => hc.abort(), 5000);
          const healthRes = await fetch(agent.health_check, { signal: hc.signal });
          clearTimeout(hcTimeout);
          return {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            capabilities: agent.capabilities,
            registryStatus: agent.status,
            healthStatus: healthRes.ok ? 'online' : 'degraded',
          };
        } catch {
          return {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            capabilities: agent.capabilities,
            registryStatus: agent.status,
            healthStatus: 'offline',
          };
        }
      })
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      agents: healthResults,
      summary: {
        total: healthResults.length,
        online: healthResults.filter(a => a.healthStatus === 'online').length,
        offline: healthResults.filter(a => a.healthStatus === 'offline').length,
      },
    });
  } catch {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        agents: [],
        summary: { total: 0, online: 0, offline: 0 },
        error: 'House of Ang service unreachable',
      },
      { status: 503 }
    );
  }
}
