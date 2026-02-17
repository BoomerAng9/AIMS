/**
 * n8n Webhook Bridge — Trigger PMO intake pipeline on remote n8n
 *
 * POST /api/n8n/webhook — Sends Boomer_Ang directive to n8n's pmo-intake webhook
 *
 * This is the primary bridge for ACHEEVY → n8n PMO pipeline routing.
 * The frontend classifies a user message, then forwards the directive
 * to n8n for Chicken Hawk dispatch and Lil_Hawk execution.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { triggerPmoWebhook } from '@/lib/n8n-bridge';

export async function POST(req: Request) {
  // Authenticate — reject anonymous requests
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { message, pmoOffice, director, executionLane } = body;
  // Use authenticated user ID — never trust client-supplied userId
  const userId = session.user.email;

  if (!message) {
    return NextResponse.json(
      { error: 'Missing required field: message' },
      { status: 400 }
    );
  }

  const result = await triggerPmoWebhook({
    message,
    userId,
    pmoOffice,
    director,
    executionLane,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || 'n8n webhook trigger failed', fallback: 'local' },
      { status: 502 }
    );
  }

  return NextResponse.json({
    dispatched: true,
    pmoOffice,
    director,
    executionLane,
    n8nResponse: result.data,
  });
}
