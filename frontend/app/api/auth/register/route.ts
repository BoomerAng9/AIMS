/**
 * POST /api/auth/register
 *
 * Creates a new user account. Called by the sign-up form after
 * collecting account, business, and region details.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password, businessName, businessType, country, state, city, postalCode } = body;

    // ── Validate required fields ──────────────────────────
    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: 'Email, password, and first name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // ── Check for existing user ──────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // ── Hash password ────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    // ── Create user ──────────────────────────────────────
    const name = [firstName, lastName].filter(Boolean).join(' ');
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        passwordHash,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });

    // ── Optionally store business/region metadata ────────
    // TODO: When workspace model supports metadata, store businessName,
    // businessType, country, state, city, postalCode as workspace config.

    return NextResponse.json(
      { success: true, userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('[register] Error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
