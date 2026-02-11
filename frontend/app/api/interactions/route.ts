
import { NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';

/**
 * Endpoint to handle Discord Interactions (Slash Commands)
 * URL: https://plugmein.cloud/api/interactions
 * 
 * Note: This endpoint must verify the request signature using the Public Key.
 */
export async function POST(req: Request) {
  const signature = req.headers.get('X-Signature-Ed25519');
  const timestamp = req.headers.get('X-Signature-Timestamp');
  const body = await req.text();

  if (!signature || !timestamp || !process.env.DISCORD_PUBLIC_KEY) {
    return new NextResponse('Bad Request Signature', { status: 401 });
  }

  const isValidRequest = verifyKey(
    body,
    signature,
    timestamp,
    process.env.DISCORD_PUBLIC_KEY
  );

  if (!isValidRequest) {
    return new NextResponse('Bad Request Signature', { status: 401 });
  }

  const interaction = JSON.parse(body);

  // Handle Ping (Type 1) - Required for setting up the endpoint
  if (interaction.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // Handle Slash Commands (Type 2)
  if (interaction.type === 2) {
    // Example: Reply to commands
    return NextResponse.json({
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        content: `You triggered command: ${interaction.data.name}`,
      },
    });
  }

  return new NextResponse('Unknown Interaction Type', { status: 400 });
}
