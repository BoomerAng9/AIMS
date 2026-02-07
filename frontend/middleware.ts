/**
 * Next.js Middleware — A.I.M.S. Route Protection
 *
 * Gates all /dashboard and /api routes (except auth) behind NextAuth session.
 * Unauthenticated users are redirected to /sign-in.
 */
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: '/sign-in',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/acp/:path*',
    '/api/stripe/:path*',
  ],
};
