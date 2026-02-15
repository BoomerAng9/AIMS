import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 });
    }

    // Dynamic import to avoid build-time resolution of broken htmlparser2/entities chain
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const data = await resend.emails.send({
      from: 'A.I.M.S. <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to the A.I.M.S. Orchestration Loop',
      html: `
        <div style="font-family: sans-serif; background: #000; color: #fff; padding: 40px;">
          <h1 style="color: #D4AF37;">A.I.M.S. Link Established</h1>
          <p>You have been successfully pulled into the ACHEEVY orchestration loop.</p>
          <hr style="border: 1px solid #333;" />
          <p><strong>Tactical Systems:</strong></p>
          <ul>
             <li>Hostinger VPS: Connected</li>
             <li>n8n: Active</li>
             <li>PostgreSQL: Synced</li>
          </ul>
          <p style="color: #06b6d4;">Welcome to plugmein.cloud</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
