/**
 * A.I.M.S. Security Module
 *
 * Centralized security for the A.I.M.S. platform.
 * Includes rate limiting, bot protection, input validation,
 * and security headers.
 */

export * from './config';
export * from './middleware';

// Re-export commonly used items
export {
  withSecurity,
  createSecurityMiddleware,
  sanitizeInput,
  validateInput,
  runSecurityChecks,
  applySecurityHeaders,
  logSecurityEvent,
} from './middleware';

export {
  RATE_LIMITS,
  SECURITY_HEADERS,
  INPUT_LIMITS,
  IS_PRODUCTION,
} from './config';
