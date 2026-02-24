/**
 * POST /api/auth/forgot-password
 *
 * Generates a time-limited password reset token and stores it on the user.
 * In production this would send an email via SendGrid/Resend/etc.
 * For now it logs the reset link to the server console (dev-friendly).
 *
 * Always returns 200 regardless of whether the email exists (prevents enumeration).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up user — but always return 200 to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Generate a secure random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      // Build reset URL
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      // In production, send via email service (SendGrid, Resend, etc.)
      // For now, log to console so the dev can use it
      console.log(`[forgot-password] Reset link for ${normalizedEmail}: ${resetUrl}`);

      // If an email service is configured, send the email
      if (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY) {
        console.log('[forgot-password] Email service configured — email would be sent here');
        // TODO: Wire SendGrid/Resend when API keys are available
      }
    }

    // Always return success to prevent email enumeration
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
