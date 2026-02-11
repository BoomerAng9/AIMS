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
import GithubProvider from 'next-auth/providers/github';
import DiscordProvider from 'next-auth/providers/discord';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export type UserRole = 'OWNER' | 'USER' | 'DEMO_USER';

const IS_DEMO = process.env.DEMO_MODE === 'true';

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

    // GitHub OAuth — for social integration + sign-in
    ...(process.env.GITHUB_CLIENT_ID
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
          }),
        ]
      : []),

    // Discord OAuth
    ...(process.env.DISCORD_CLIENT_ID
      ? [
          DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
          }),
        ]
      : []),

    // Credentials — email/password
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Demo mode — allow any login with DEMO_USER role
        if (IS_DEMO && credentials.email.endsWith('@demo.plugmein.cloud')) {
          return {
            id: `demo-${Date.now()}`,
            name: 'Demo Explorer',
            email: credentials.email,
            image: null,
          };
        }

        // Check database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          // If in dev mode and no user found, fallback to owner bypass if applicable
          if (isOwnerEmail(credentials.email) && process.env.NODE_ENV !== 'production') {
              return {
                  id: 'owner-dev',
                  name: 'ACHEEVY Operator (Dev)',
                  email: credentials.email,
                  image: null,
                  role: 'OWNER',
              };
          }
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: null, // Prisma User doesn't have image by default, add if needed or ignore
          role: user.role,
        };
      },
    }),
  ],

  pages: {
    signIn: '/sign-in',
    newUser: '/onboarding/welcome', // Changed from '/onboarding/1' to match sign-up flow
    error: '/sign-in', // Redirect to sign-in on error
  },

  session: {
    strategy: 'jwt',
    maxAge: IS_DEMO ? 4 * 60 * 60 : 30 * 24 * 60 * 60, // 4h demo, 30d production
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth providers (Google, GitHub, Discord, etc.)
      if (account?.provider && account.provider !== 'credentials') {
        if (!user.email) return false;
        
        // TODO: Sync user to Firestore 'users' collection here to support Firebase Extensions 
        // (e.g., firestore-stripe-payments, mailchimp).
        // await syncToFirestore(user);

        // Check if user exists in Prisma DB, if not create
        try {
           const existingUser = await prisma.user.findUnique({
             where: { email: user.email },
           });

           if (!existingUser) {
             await prisma.user.create({
               data: {
                 email: user.email,
                 name: user.name || profile?.name || user.email.split('@')[0],
                 role: isOwnerEmail(user.email) ? 'OWNER' : 'USER',
                 status: 'ACTIVE',
               },
             });
           }
        } catch (error) {
           console.error('Error creating user/signin:', error);
           return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id;
        
        // If user came from DB (Credentials) it has role. If from OAuth, we need to fetch or set default.
        if ((user as any).role) {
             token.role = (user as any).role;
        } else if (user.email) {
            // Fetch role from DB for OAuth users (since user object from provider doesn't have it)
             const dbUser = await prisma.user.findUnique({
                 where: { email: user.email },
                 select: { role: true }
             });
             token.role = dbUser?.role || (isOwnerEmail(user.email) ? 'OWNER' : 'USER');
        } else {
             token.role = 'USER';
        }
      }
      
      // Update session if user updates profile
       if (trigger === "update" && session?.name) {
          token.name = session.name;
        }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).role = token.role || 'USER';
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
