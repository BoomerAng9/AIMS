/**
 * A.I.M.S. — Server-side Role Enforcement for API Routes
 *
 * Use in Next.js API route handlers to enforce role-based access control.
 * Returns early with 401/403 if the user lacks the required role.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, type UserRole } from '@/lib/auth';

export interface AuthenticatedUser {
  email: string;
  name?: string | null;
  role: UserRole;
}

interface AuthResult {
  user: AuthenticatedUser;
}

/**
 * Require authentication and optionally a specific role for an API route.
 * Returns the authenticated user or a NextResponse error.
 *
 * Usage:
 * ```ts
 * const auth = await requireAuth();
 * if (auth instanceof NextResponse) return auth;
 * const { user } = auth;
 * ```
 */
export async function requireAuth(
  requiredRoles?: UserRole[],
): Promise<AuthResult | NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  const user = session.user as Record<string, unknown>;
  const role = (user.role as UserRole) || 'CUSTOMER';
  const email = user.email as string;

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(role)) {
    return NextResponse.json(
      { error: `Forbidden — requires ${requiredRoles.join(' or ')} role` },
      { status: 403 },
    );
  }

  return {
    user: {
      email,
      name: user.name as string | null,
      role,
    },
  };
}

/**
 * Shorthand: require OWNER role.
 */
export async function requireOwner(): Promise<AuthResult | NextResponse> {
  return requireAuth(['OWNER']);
}

/**
 * Shorthand: require OWNER or ADMIN role.
 */
export async function requireAdmin(): Promise<AuthResult | NextResponse> {
  return requireAuth(['OWNER', 'ADMIN']);
}
