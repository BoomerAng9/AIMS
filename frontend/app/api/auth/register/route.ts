
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName, businessName, businessType } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: `${firstName} ${lastName}`.trim(),
        role: 'USER', // Default role
        // Additional business logic could be added here or in a separate transaction
        workspaces: businessName ? {
          create: {
            workspace: {
              create: {
                name: businessName,
                slug: businessName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              }
            },
            role: 'OWNER'
          }
        } : undefined
      },
    });

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
