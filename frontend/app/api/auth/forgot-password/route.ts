/**
 * POST /api/auth/forgot-password
 *
 * Generates a time-limited password reset token and stores it on the user.
 * Sends email via Resend if configured, otherwise logs to console.
 * Always returns 200 regardless of whether the email exists (prevents enumeration).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import { forgotPasswordSchema, validateInput } from '@/lib/validation/schemas';

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateInput(forgotPasswordSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid forgot password request', details: validation.errors },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'ACHEEVY <noreply@foai.cloud>',
          to: normalizedEmail,
          subject: 'Reset your A.I.M.S. password',
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #1e293b;">Reset Your Password</h2>
              <p>Click the button below to reset your password. This link expires in ${TOKEN_EXPIRY_HOURS} hour.</p>
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #D4AF37; color: #1e293b; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Reset Password
              </a>
              <p style="margin-top: 24px; font-size: 13px; color: #94a3b8;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      } else {
        console.log(`[forgot-password] Reset link for ${normalizedEmail}: ${resetUrl}`);
      }
    }

    return NextResponse.json({
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  } catch (error) {
    console.error('[forgot-password] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
