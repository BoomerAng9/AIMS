/**
 * A.I.M.S. Security Configuration
 *
 * Centralized security settings for rate limiting, bot protection,
 * input validation, and security headers.
 */

// ─────────────────────────────────────────────────────────────
// Environment Detection
// ─────────────────────────────────────────────────────────────

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// ─────────────────────────────────────────────────────────────
// Allowed Origins (CORS)
// ─────────────────────────────────────────────────────────────

export const ALLOWED_ORIGINS = IS_PRODUCTION
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
      'http://localhost:3003',
      'http://127.0.0.1:3000',
    ];

// ─────────────────────────────────────────────────────────────
// Rate Limiting Configuration
// ─────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  windowMs: number;       // Time window in milliseconds
  maxRequests: number;    // Max requests per window
  message: string;        // Error message when limited
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Global API rate limit
  global: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 100,
    message: 'Too many requests. Please try again later.',
  },

  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 10,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    skipFailedRequests: false,
  },

  // AI/Chat endpoints (expensive operations)
  aiChat: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 20,
    message: 'AI request limit reached. Please wait before sending more messages.',
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10,
    message: 'Upload limit reached. Please wait before uploading more files.',
  },

  // Search endpoints
  search: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 30,
    message: 'Search limit reached. Please slow down.',
  },
};

// ─────────────────────────────────────────────────────────────
// Bot Detection Configuration
// ─────────────────────────────────────────────────────────────

export const BOT_DETECTION = {
  // Known malicious bot user agents (partial matches)
  blockedUserAgents: [
    'sqlmap',
    'nikto',
    'nessus',
    'nmap',
    'masscan',
    'wpscan',
    'dirb',
    'gobuster',
    'burp',
    'zgrab',
    'censys',
    'shodan',
    'python-requests/2.',  // Block old versions used by scrapers
    'curl/',               // Block direct curl (allow when needed via header)
    'wget/',
    'scrapy',
    'httpclient',
    'java/',
    'libwww-perl',
    'lwp-',
    'ahrefsbot',
    'semrushbot',
    'dotbot',
    'mj12bot',
    'blexbot',
    'seokicks',
    'petalbot',
  ],

  // Allowed bots (search engines, monitoring)
  allowedBots: [
    'googlebot',
    'bingbot',
    'slurp',           // Yahoo
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'uptimerobot',
    'pingdom',
    'site24x7',
  ],

  // Suspicious request patterns
  suspiciousPatterns: [
    /\.\.(\/|\\)/,                    // Path traversal
    /<script/i,                       // XSS attempts
    /union\s+select/i,                // SQL injection
    /exec\s*\(/i,                     // Code execution
    /eval\s*\(/i,                     // Eval injection
    /javascript:/i,                   // JS injection
    /on\w+\s*=/i,                     // Event handler injection
    /\$\{.*\}/,                       // Template injection
    /{{.*}}/,                         // Template injection
    /data:text\/html/i,               // Data URI attacks
    /vbscript:/i,                     // VBScript injection
  ],

  // Paths that shouldn't be accessed (honeypot)
  honeypotPaths: [
    '/admin',
    '/wp-admin',
    '/wp-login.php',
    '/phpmyadmin',
    '/.env',
    '/.git',
    '/config.php',
    '/xmlrpc.php',
    '/wp-config.php',
    '/shell.php',
    '/cmd.php',
    '/c99.php',
    '/r57.php',
  ],
};

// ─────────────────────────────────────────────────────────────
// Security Headers
// ─────────────────────────────────────────────────────────────

export const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy (disable unnecessary browser features)
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(), payment=()',

  // Content Security Policy
  'Content-Security-Policy': IS_PRODUCTION
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://api.aims.plugmein.cloud wss://api.aims.plugmein.cloud",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    : "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: data: blob: ws: wss:",

  // Strict Transport Security (HTTPS only)
  ...(IS_PRODUCTION && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }),
};

// ─────────────────────────────────────────────────────────────
// Input Validation
// ─────────────────────────────────────────────────────────────

export const INPUT_LIMITS = {
  // Max lengths
  maxMessageLength: 10000,
  maxUsernameLength: 50,
  maxEmailLength: 254,
  maxUrlLength: 2048,
  maxFileNameLength: 255,

  // File upload limits
  maxFileSizeMB: 10,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedDocTypes: ['application/pdf', 'text/plain', 'application/json'],

  // Request body size
  maxJsonBodySize: '1mb',
  maxFormBodySize: '10mb',
};

// ─────────────────────────────────────────────────────────────
// IP Blocking
// ─────────────────────────────────────────────────────────────

export const IP_BLOCKING = {
  // IPs to always block (known bad actors - add as needed)
  blockedIPs: new Set<string>([
    // Add known malicious IPs here
  ]),

  // IPs to always allow (internal, monitoring)
  allowedIPs: new Set<string>([
    '127.0.0.1',
    '::1',
  ]),

  // Countries to block (ISO codes) - optional geoblocking
  blockedCountries: new Set<string>([
    // Uncomment to enable geoblocking
    // 'XX',
  ]),
};

// ─────────────────────────────────────────────────────────────
// API Key Configuration
// ─────────────────────────────────────────────────────────────

export const API_KEY_CONFIG = {
  // Header name for API key
  headerName: 'X-API-Key',

  // Minimum key length
  minKeyLength: 32,

  // Key prefix for easy identification
  keyPrefix: 'aims_',

  // Endpoints that require API key (in production)
  protectedEndpoints: [
    '/api/chat',
    '/api/acheevy',
    '/api/boomerangs',
    '/api/luc',
  ],
};

// ─────────────────────────────────────────────────────────────
// Audit Logging
// ─────────────────────────────────────────────────────────────

export const AUDIT_CONFIG = {
  // Events to log
  logEvents: [
    'auth_attempt',
    'auth_success',
    'auth_failure',
    'rate_limit_hit',
    'bot_blocked',
    'suspicious_request',
    'honeypot_triggered',
    'ip_blocked',
    'api_key_invalid',
  ],

  // Sensitive fields to redact in logs
  redactFields: [
    'password',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'authorization',
    'cookie',
    'credit_card',
    'ssn',
  ],
};

export default {
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  ALLOWED_ORIGINS,
  RATE_LIMITS,
  BOT_DETECTION,
  SECURITY_HEADERS,
  INPUT_LIMITS,
  IP_BLOCKING,
  API_KEY_CONFIG,
  AUDIT_CONFIG,
};
