/**
 * POST /api/auth/reset-password
 *
 * Validates a reset token and updates the user's password.
 * Token must be valid and not expired.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { resetPasswordSchema, validateInput } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateInput(resetPasswordSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid reset password request', details: validation.errors },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Find user with this reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password and clear reset token
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    console.log(`[reset-password] Password updated for ${user.email}`);

    return NextResponse.json({
      message: 'Password has been reset successfully. You can now sign in.',
    });
  } catch (error) {
    console.error('[reset-password] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
