/**
 * A.I.M.S. Next.js Middleware
 *
 * Global security layer that runs on every request.
 * Protects against bots, attacks, and abuse.
 *
 * NO BACK DOORS. TRUE PENTESTING-READY.
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
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:8080',
    ];

// Extended list of attack tools and malicious bots
const BLOCKED_USER_AGENTS = [
  // Security scanners
  'sqlmap', 'nikto', 'nessus', 'nmap', 'masscan', 'wpscan',
  'dirb', 'gobuster', 'burp', 'zgrab', 'censys', 'shodan',
  'acunetix', 'qualys', 'netsparker', 'appscan', 'webinspect',
  // Scrapers and bots
  'scrapy', 'httpclient', 'libwww-perl', 'lwp-', 'python-requests',
  'wget', 'curl/', 'httpie', 'postman', 'insomnia',
  // AI scrapers
  'gptbot', 'chatgpt', 'claudebot', 'anthropic', 'ccbot', 'bytespider',
  // Generic malicious patterns
  'havij', 'sqlninja', 'pangolin', 'paros', 'webshag',
];

// Extended honeypot paths for common attack vectors
const HONEYPOT_PATHS = [
  // CMS exploits
  '/admin', '/wp-admin', '/wp-login.php', '/phpmyadmin', '/pma',
  '/administrator', '/joomla', '/drupal', '/typo3',
  // Config/sensitive files
  '/.env', '/.git', '/config.php', '/xmlrpc.php', '/.htaccess',
  '/wp-config.php', '/shell.php', '/cmd.php', '/c99.php', '/r57.php',
  '/web.config', '/config.json', '/settings.json', '/secrets.json',
  // Database paths
  '/database', '/db.sql', '/dump.sql', '/backup.sql', '/mysql',
  // API documentation (could reveal endpoints)
  '/swagger', '/api-docs', '/graphql', '/graphiql',
  // AWS/Cloud metadata
  '/latest/meta-data', '/computeMetadata', '/.aws',
  // Common attack paths
  '/cgi-bin', '/scripts', '/eval', '/debug', '/test', '/temp',
  '/.svn', '/.hg', '/vendor', '/node_modules/.bin',
];

// Content Security Policy - strict but functional
const CSP_DIRECTIVES = IS_PRODUCTION ? [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' https://api.aims.plugmein.cloud https://api.anthropic.com https://generativelanguage.googleapis.com https://api.moonshot.cn https://api.groq.com https://api.openai.com https://api.elevenlabs.io wss:",
  "media-src 'self' blob:",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ') : [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: https: blob:",
  "connect-src *",
  "media-src 'self' blob:",
].join('; ');

const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
  'Content-Security-Policy': CSP_DIRECTIVES,
  'X-DNS-Prefetch-Control': 'off',
  'Strict-Transport-Security': IS_PRODUCTION ? 'max-age=31536000; includeSubDomains; preload' : '',
  'X-Permitted-Cross-Domain-Policies': 'none',
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

// Suspicious request patterns that may indicate attacks
function hasSuspiciousPatterns(request: NextRequest): string | null {
  const url = request.nextUrl.toString();
  const pathname = request.nextUrl.pathname;

  // Check for path traversal attempts
  if (pathname.includes('..') || pathname.includes('%2e%2e')) {
    return 'Path traversal detected';
  }

  // Check for null byte injection
  if (pathname.includes('%00') || pathname.includes('\x00')) {
    return 'Null byte injection detected';
  }

  // Check for SQL injection in URL
  const sqlPatterns = /(\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bupdate\b).*(\bfrom\b|\binto\b|\btable\b)/i;
  if (sqlPatterns.test(url)) {
    return 'SQL injection pattern detected';
  }

  // Check for command injection patterns
  const cmdPatterns = /[;&|`$]|\$\(|`.*`/;
  if (cmdPatterns.test(decodeURIComponent(pathname))) {
    return 'Command injection pattern detected';
  }

  // Check for XSS patterns in query string
  const searchParams = request.nextUrl.searchParams.toString();
  const xssPatterns = /<script|javascript:|on\w+=/i;
  if (xssPatterns.test(searchParams)) {
    return 'XSS pattern detected';
  }

  // Check for excessive query parameters (parameter pollution)
  const paramCount = Array.from(request.nextUrl.searchParams.keys()).length;
  if (paramCount > 50) {
    return 'Parameter pollution detected';
  }

  // Check for suspiciously long URLs
  if (url.length > 2000) {
    return 'URL too long';
  }

  return null;
}

// Check Content-Length header for oversized requests
function isOversizedRequest(request: NextRequest): boolean {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    // 15MB limit for most routes, images can be larger
    const maxSize = request.nextUrl.pathname.includes('/diy') ? 15 * 1024 * 1024 : 2 * 1024 * 1024;
    return size > maxSize;
  }
  return false;
}

function createErrorResponse(message: string, status: number): NextResponse {
  const response = NextResponse.json({ error: message }, { status });

  // Apply security headers
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    if (value) { // Skip empty headers
      response.headers.set(header, value);
    }
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

  // Skip security checks for static files and internal healthcheck
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/api/health' ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // 1. Honeypot check (block bots probing for vulnerabilities)
  if (isHoneypot(pathname)) {
    console.warn(`[SECURITY] Honeypot triggered: ${ip} -> ${pathname}`);
    return createErrorResponse('Not Found', 404);
  }

  // 2. Bot detection (only in production)
  if (IS_PRODUCTION && isBlockedBot(userAgent)) {
    console.warn(`[SECURITY] Blocked bot: ${ip} - ${userAgent.slice(0, 100)}`);
    return createErrorResponse('Access denied', 403);
  }

  // 3. Empty user agent check (only in production - dev tools may have short/empty agents)
  if (IS_PRODUCTION && (!userAgent || userAgent.length < 10)) {
    console.warn(`[SECURITY] Empty user agent: ${ip}`);
    return createErrorResponse('Access denied', 403);
  }

  // 4. Suspicious patterns check
  const suspiciousReason = hasSuspiciousPatterns(request);
  if (suspiciousReason) {
    console.warn(`[SECURITY] ${suspiciousReason}: ${ip} -> ${pathname}`);
    return createErrorResponse('Bad request', 400);
  }

  // 5. Request size check for API routes
  if (pathname.startsWith('/api') && isOversizedRequest(request)) {
    console.warn(`[SECURITY] Oversized request: ${ip} -> ${pathname}`);
    return createErrorResponse('Request too large', 413);
  }

  // 6. Rate limiting for API routes (tiered by endpoint sensitivity)
  // In development, use much higher limits to allow rapid testing
  if (pathname.startsWith('/api')) {
    let limit = IS_PRODUCTION ? 100 : 1000;
    if (pathname.includes('/chat') || pathname.includes('/acheevy')) {
      limit = IS_PRODUCTION ? 30 : 500; // Stricter for AI endpoints in prod
    } else if (pathname.includes('/luc')) {
      limit = IS_PRODUCTION ? 60 : 600; // Medium for billing
    } else if (pathname.includes('/transcribe') || pathname.includes('/tts')) {
      limit = IS_PRODUCTION ? 20 : 200; // Strictest for media processing
    }
    const windowMs = 60 * 1000; // 1 minute

    if (!checkRateLimit(ip, limit, windowMs)) {
      console.warn(`[SECURITY] Rate limit exceeded: ${ip} -> ${pathname}`);
      return createErrorResponse('Too many requests', 429);
    }
  }

  // 7. CORS check for API routes in production
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
    if (value) { // Skip empty headers
      response.headers.set(header, value);
    }
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
