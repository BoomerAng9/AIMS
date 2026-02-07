/**
 * NextAuth.js Configuration — A.I.M.S. Authentication
 *
 * Supports:
 * - Google OAuth (primary)
 * - Credentials (email/password) for dev/fallback
 *
 * Roles:
 * - OWNER: Platform super admin (env: OWNER_EMAILS)
 * - USER: Regular customer
 *
 * Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET to .env
 */
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

export type UserRole = 'OWNER' | 'USER';

/**
 * Owner email whitelist — comma-separated in OWNER_EMAILS env var.
 * These users get full super admin access.
 */
function getOwnerEmails(): string[] {
  const raw = process.env.OWNER_EMAILS || '';
  return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const owners = getOwnerEmails();
  // In dev with no OWNER_EMAILS set, treat the dev user as owner
  if (owners.length === 0 && process.env.NODE_ENV !== 'production') return true;
  return owners.includes(email.toLowerCase());
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth — primary auth method
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
          }),
        ]
      : []),

    // Credentials — email/password (fallback / dev)
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Owner bypass — allows platform owner to sign in with any password
        // until a real user DB is wired up
        if (isOwnerEmail(credentials.email)) {
          return {
            id: 'owner-1',
            name: 'ACHEEVY Operator',
            email: credentials.email,
            image: null,
          };
        }

        // Non-owner credentials require a real DB (not yet wired)
        // TODO: Replace with DB lookup when persistence layer is connected
        if (process.env.NODE_ENV === 'production') {
          return null;
        }

        return {
          id: 'dev-user-1',
          name: 'ACHEEVY Operator',
          email: credentials.email,
          image: null,
        };
      },
    }),
  ],

  pages: {
    signIn: '/sign-in',
    newUser: '/onboarding/1',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = isOwnerEmail(user.email) ? 'OWNER' : 'USER';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.userId;
        (session.user as Record<string, unknown>).role = token.role || 'USER';
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
