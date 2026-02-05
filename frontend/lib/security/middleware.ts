/**
 * A.I.M.S. Security Middleware
 *
 * Protection against bots, attacks, and abuse.
 * Use in Next.js API routes and middleware.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ALLOWED_ORIGINS,
  RATE_LIMITS,
  BOT_DETECTION,
  SECURITY_HEADERS,
  INPUT_LIMITS,
  IP_BLOCKING,
  API_KEY_CONFIG,
  AUDIT_CONFIG,
  IS_PRODUCTION,
  RateLimitConfig,
} from './config';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  statusCode?: number;
}

export interface RateLimitState {
  count: number;
  resetAt: number;
}

// ─────────────────────────────────────────────────────────────
// In-Memory Rate Limit Store (use Redis in production)
// ─────────────────────────────────────────────────────────────

const rateLimitStore = new Map<string, RateLimitState>();

// Clean up expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, state] of rateLimitStore.entries()) {
      if (state.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000); // Clean every minute
}

// ─────────────────────────────────────────────────────────────
// IP Extraction
// ─────────────────────────────────────────────────────────────

export function getClientIP(request: NextRequest): string {
  // Check various headers for real IP (behind proxy/CDN)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback
  return '127.0.0.1';
}

// ─────────────────────────────────────────────────────────────
// Bot Detection
// ─────────────────────────────────────────────────────────────

export function checkBot(request: NextRequest): SecurityCheckResult {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const path = request.nextUrl.pathname.toLowerCase();

  // Check if it's an allowed bot
  const isAllowedBot = BOT_DETECTION.allowedBots.some((bot) =>
    userAgent.includes(bot)
  );
  if (isAllowedBot) {
    return { allowed: true };
  }

  // Check blocked user agents
  const isBlockedAgent = BOT_DETECTION.blockedUserAgents.some((agent) =>
    userAgent.includes(agent.toLowerCase())
  );
  if (isBlockedAgent) {
    logSecurityEvent('bot_blocked', { userAgent, reason: 'blocked_agent' });
    return {
      allowed: false,
      reason: 'Access denied',
      statusCode: 403,
    };
  }

  // Check honeypot paths
  const isHoneypot = BOT_DETECTION.honeypotPaths.some((hp) =>
    path.startsWith(hp)
  );
  if (isHoneypot) {
    logSecurityEvent('honeypot_triggered', { path, userAgent });
    return {
      allowed: false,
      reason: 'Not found',
      statusCode: 404,
    };
  }

  // Empty user agent is suspicious
  if (!userAgent || userAgent.length < 10) {
    logSecurityEvent('bot_blocked', { userAgent, reason: 'empty_agent' });
    return {
      allowed: false,
      reason: 'Access denied',
      statusCode: 403,
    };
  }

  return { allowed: true };
}

// ─────────────────────────────────────────────────────────────
// Suspicious Request Detection
// ─────────────────────────────────────────────────────────────

export function checkSuspiciousRequest(request: NextRequest): SecurityCheckResult {
  const url = request.url;
  const path = request.nextUrl.pathname;

  // Check URL for suspicious patterns
  for (const pattern of BOT_DETECTION.suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(path)) {
      logSecurityEvent('suspicious_request', { url, pattern: pattern.toString() });
      return {
        allowed: false,
        reason: 'Bad request',
        statusCode: 400,
      };
    }
  }

  // Check query parameters
  const searchParams = request.nextUrl.searchParams;
  for (const [key, value] of searchParams.entries()) {
    for (const pattern of BOT_DETECTION.suspiciousPatterns) {
      if (pattern.test(key) || pattern.test(value)) {
        logSecurityEvent('suspicious_request', { param: key, value, pattern: pattern.toString() });
        return {
          allowed: false,
          reason: 'Bad request',
          statusCode: 400,
        };
      }
    }
  }

  return { allowed: true };
}

// ─────────────────────────────────────────────────────────────
// IP Blocking
// ─────────────────────────────────────────────────────────────

export function checkIP(request: NextRequest): SecurityCheckResult {
  const ip = getClientIP(request);

  // Always allow whitelisted IPs
  if (IP_BLOCKING.allowedIPs.has(ip)) {
    return { allowed: true };
  }

  // Block blacklisted IPs
  if (IP_BLOCKING.blockedIPs.has(ip)) {
    logSecurityEvent('ip_blocked', { ip });
    return {
      allowed: false,
      reason: 'Access denied',
      statusCode: 403,
    };
  }

  return { allowed: true };
}

// ─────────────────────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────────────────────

export function checkRateLimit(
  request: NextRequest,
  configKey: keyof typeof RATE_LIMITS = 'global'
): SecurityCheckResult {
  const config = RATE_LIMITS[configKey];
  const ip = getClientIP(request);
  const key = `${configKey}:${ip}`;
  const now = Date.now();

  let state = rateLimitStore.get(key);

  if (!state || state.resetAt < now) {
    // Create new window
    state = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, state);
    return { allowed: true };
  }

  // Increment count
  state.count++;

  if (state.count > config.maxRequests) {
    logSecurityEvent('rate_limit_hit', { ip, configKey, count: state.count });
    return {
      allowed: false,
      reason: config.message,
      statusCode: 429,
    };
  }

  return { allowed: true };
}

// ─────────────────────────────────────────────────────────────
// CORS Check
// ─────────────────────────────────────────────────────────────

export function checkCORS(request: NextRequest): SecurityCheckResult {
  const origin = request.headers.get('origin');

  // No origin header (same-origin request)
  if (!origin) {
    return { allowed: true };
  }

  // Check if origin is allowed
  const isAllowed = ALLOWED_ORIGINS.some((allowed) => {
    if (allowed === '*') return true;
    return origin === allowed || origin.endsWith(allowed.replace('https://', '.'));
  });

  if (!isAllowed && IS_PRODUCTION) {
    logSecurityEvent('cors_rejected', { origin });
    return {
      allowed: false,
      reason: 'CORS policy violation',
      statusCode: 403,
    };
  }

  return { allowed: true };
}

// ─────────────────────────────────────────────────────────────
// Input Validation
// ─────────────────────────────────────────────────────────────

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove JS protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

export function validateInput(input: unknown, maxLength: number): boolean {
  if (typeof input !== 'string') return false;
  if (input.length > maxLength) return false;

  // Check for suspicious patterns
  for (const pattern of BOT_DETECTION.suspiciousPatterns) {
    if (pattern.test(input)) return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────────
// Security Logging
// ─────────────────────────────────────────────────────────────

export function logSecurityEvent(
  event: string,
  data: Record<string, unknown>
): void {
  if (!AUDIT_CONFIG.logEvents.includes(event)) return;

  // Redact sensitive fields
  const safeData = { ...data };
  for (const field of AUDIT_CONFIG.redactFields) {
    if (field in safeData) {
      safeData[field] = '[REDACTED]';
    }
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...safeData,
  };

  // In production, send to logging service
  // For now, console log
  console.warn('[SECURITY]', JSON.stringify(logEntry));
}

// ─────────────────────────────────────────────────────────────
// Apply Security Headers
// ─────────────────────────────────────────────────────────────

export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    if (value) {
      response.headers.set(header, value);
    }
  }
  return response;
}

// ─────────────────────────────────────────────────────────────
// Combined Security Check
// ─────────────────────────────────────────────────────────────

export function runSecurityChecks(
  request: NextRequest,
  options: {
    rateLimitKey?: keyof typeof RATE_LIMITS;
    skipBotCheck?: boolean;
    skipRateLimit?: boolean;
  } = {}
): SecurityCheckResult {
  // 1. IP Check
  const ipCheck = checkIP(request);
  if (!ipCheck.allowed) return ipCheck;

  // 2. Bot Detection
  if (!options.skipBotCheck) {
    const botCheck = checkBot(request);
    if (!botCheck.allowed) return botCheck;
  }

  // 3. Suspicious Request Check
  const suspiciousCheck = checkSuspiciousRequest(request);
  if (!suspiciousCheck.allowed) return suspiciousCheck;

  // 4. CORS Check
  const corsCheck = checkCORS(request);
  if (!corsCheck.allowed) return corsCheck;

  // 5. Rate Limiting
  if (!options.skipRateLimit) {
    const rateLimitCheck = checkRateLimit(request, options.rateLimitKey);
    if (!rateLimitCheck.allowed) return rateLimitCheck;
  }

  return { allowed: true };
}

// ─────────────────────────────────────────────────────────────
// Next.js Middleware Helper
// ─────────────────────────────────────────────────────────────

export function createSecurityMiddleware(
  options: {
    rateLimitKey?: keyof typeof RATE_LIMITS;
    skipBotCheck?: boolean;
    skipRateLimit?: boolean;
  } = {}
) {
  return function securityMiddleware(request: NextRequest): NextResponse | null {
    const result = runSecurityChecks(request, options);

    if (!result.allowed) {
      const response = NextResponse.json(
        { error: result.reason },
        { status: result.statusCode || 403 }
      );
      return applySecurityHeaders(response);
    }

    return null; // Continue to next middleware/handler
  };
}

// ─────────────────────────────────────────────────────────────
// API Route Wrapper
// ─────────────────────────────────────────────────────────────

export function withSecurity<T>(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    rateLimitKey?: keyof typeof RATE_LIMITS;
    skipBotCheck?: boolean;
    skipRateLimit?: boolean;
  } = {}
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Run security checks
    const securityResult = runSecurityChecks(request, options);

    if (!securityResult.allowed) {
      const response = NextResponse.json(
        { error: securityResult.reason },
        { status: securityResult.statusCode || 403 }
      );
      return applySecurityHeaders(response);
    }

    // Run the actual handler
    try {
      const response = await handler(request);
      return applySecurityHeaders(response);
    } catch (error) {
      console.error('[API Error]', error);
      const response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      return applySecurityHeaders(response);
    }
  };
}

export default {
  checkBot,
  checkSuspiciousRequest,
  checkIP,
  checkRateLimit,
  checkCORS,
  sanitizeInput,
  validateInput,
  logSecurityEvent,
  applySecurityHeaders,
  runSecurityChecks,
  createSecurityMiddleware,
  withSecurity,
  getClientIP,
};
