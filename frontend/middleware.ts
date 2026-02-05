/**
 * A.I.M.S. Next.js Middleware
 *
 * Global security layer that runs on every request.
 * Protects against bots, attacks, and abuse.
 */

import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────
// Configuration (inline to avoid import issues in Edge Runtime)
// ─────────────────────────────────────────────────────────────

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const ALLOWED_ORIGINS = IS_PRODUCTION
  ? [
      'https://aims.plugmein.cloud',
      'https://www.aims.plugmein.cloud',
      'https://api.aims.plugmein.cloud',
      'https://luc.plugmein.cloud',
    ]
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];

const BLOCKED_USER_AGENTS = [
  'sqlmap', 'nikto', 'nessus', 'nmap', 'masscan', 'wpscan',
  'dirb', 'gobuster', 'burp', 'zgrab', 'censys', 'shodan',
  'scrapy', 'httpclient', 'libwww-perl', 'lwp-',
];

const HONEYPOT_PATHS = [
  '/admin', '/wp-admin', '/wp-login.php', '/phpmyadmin',
  '/.env', '/.git', '/config.php', '/xmlrpc.php',
  '/wp-config.php', '/shell.php', '/cmd.php',
];

const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
};

// Rate limit store (in-memory, resets on deploy)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '127.0.0.1'
  );
}

function isBlockedBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BLOCKED_USER_AGENTS.some((bot) => ua.includes(bot));
}

function isHoneypot(path: string): boolean {
  return HONEYPOT_PATHS.some((hp) => path.toLowerCase().startsWith(hp));
}

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const key = `global:${ip}`;
  const state = rateLimitStore.get(key);

  if (!state || state.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  state.count++;
  return state.count <= limit;
}

function createErrorResponse(message: string, status: number): NextResponse {
  const response = NextResponse.json({ error: message }, { status });

  // Apply security headers
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }

  return response;
}

// ─────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  const ip = getClientIP(request);

  // Skip security checks for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  // 1. Honeypot check (block bots probing for vulnerabilities)
  if (isHoneypot(pathname)) {
    console.warn(`[SECURITY] Honeypot triggered: ${ip} -> ${pathname}`);
    return createErrorResponse('Not Found', 404);
  }

  // 2. Bot detection
  if (isBlockedBot(userAgent)) {
    console.warn(`[SECURITY] Blocked bot: ${ip} - ${userAgent}`);
    return createErrorResponse('Access denied', 403);
  }

  // 3. Empty user agent check (likely a bot/script)
  if (!userAgent || userAgent.length < 10) {
    console.warn(`[SECURITY] Empty user agent: ${ip}`);
    return createErrorResponse('Access denied', 403);
  }

  // 4. Rate limiting for API routes
  if (pathname.startsWith('/api')) {
    const limit = pathname.includes('/chat') ? 30 : 100; // Stricter for AI endpoints
    const windowMs = 60 * 1000; // 1 minute

    if (!checkRateLimit(ip, limit, windowMs)) {
      console.warn(`[SECURITY] Rate limit exceeded: ${ip} -> ${pathname}`);
      return createErrorResponse('Too many requests', 429);
    }
  }

  // 5. CORS check for API routes in production
  if (IS_PRODUCTION && pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      console.warn(`[SECURITY] CORS rejected: ${origin} -> ${pathname}`);
      return createErrorResponse('CORS policy violation', 403);
    }
  }

  // Continue with request, applying security headers
  const response = NextResponse.next();

  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }

  // Add CORS headers for API routes
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    if (origin && (ALLOWED_ORIGINS.includes(origin) || !IS_PRODUCTION)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
      response.headers.set('Access-Control-Max-Age', '86400');
    }
  }

  return response;
}

// ─────────────────────────────────────────────────────────────
// Matcher Configuration
// ─────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
