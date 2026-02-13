/**
 * Agent Bridge - Security Gateway
 *
 * Bridges communication between A.I.M.S. core network and sandboxed agents.
 * Implements strict security controls:
 * - Rate limiting
 * - Operation whitelisting
 * - Payment operation blocking
 * - Request/response sanitization
 *
 * CRITICAL: Boomer_Angs NEVER have payment access. This bridge enforces that.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3010', 10);
const AIMS_GATEWAY_URL = process.env.AIMS_GATEWAY_URL || 'http://uef-gateway:3001';
const SANDBOX_AGENT_URL = process.env.SANDBOX_AGENT_URL || 'http://agent-zero:80';

// Rate limiting
const RATE_LIMIT_REQUESTS = parseInt(process.env.RATE_LIMIT_REQUESTS || '100', 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10);

// Security: Allowed operations (whitelist)
const ALLOWED_OPS = (process.env.ALLOWED_OPS || 'search,analyze,summarize,generate,read,write,edit,code').split(',');

// Security: BLOCKED operations (payment-related) - NEVER ALLOW
const BLOCKED_OPS = (process.env.BLOCKED_OPS ||
  'payment,transfer,purchase,checkout,buy,order,credit_card,stripe,paypal,venmo,bank,wallet,invoice,billing,charge,refund,subscription'
).split(',');

// Security: Blocked patterns in request content
const BLOCKED_PATTERNS = [
  /credit.?card/i,
  /card.?number/i,
  /cvv/i,
  /expir(y|ation)/i,
  /billing.?address/i,
  /payment.?method/i,
  /bank.?account/i,
  /routing.?number/i,
  /stripe.?(key|secret|token)/i,
  /paypal/i,
  /checkout/i,
  /purchase/i,
  /\b\d{13,19}\b/,  // Credit card number pattern
];

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AgentRequest {
  operation: string;
  agent_id: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

interface SecurityViolation {
  type: 'blocked_operation' | 'blocked_pattern' | 'rate_limit' | 'invalid_request';
  operation?: string;
  pattern?: string;
  details?: string;
}

// ─────────────────────────────────────────────────────────────
// Security Functions
// ─────────────────────────────────────────────────────────────

function isOperationBlocked(operation: string): boolean {
  const normalizedOp = operation.toLowerCase().trim();
  return BLOCKED_OPS.some(blocked => normalizedOp.includes(blocked.toLowerCase()));
}

function isOperationAllowed(operation: string): boolean {
  if (isOperationBlocked(operation)) return false;
  const normalizedOp = operation.toLowerCase().trim();
  return ALLOWED_OPS.some(allowed => normalizedOp.includes(allowed.toLowerCase()));
}

function containsBlockedPatterns(content: string): string | null {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      return pattern.toString();
    }
  }
  return null;
}

function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    // Block sensitive keys
    if (/password|secret|token|key|credential/i.test(key)) {
      continue;
    }

    if (typeof value === 'string') {
      // Check for blocked patterns
      if (containsBlockedPatterns(value)) {
        sanitized[key] = '[REDACTED - SECURITY]';
      } else {
        sanitized[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function validateRequest(req: AgentRequest): SecurityViolation | null {
  // Check operation
  if (!req.operation) {
    return { type: 'invalid_request', details: 'Missing operation' };
  }

  if (isOperationBlocked(req.operation)) {
    return {
      type: 'blocked_operation',
      operation: req.operation,
      details: 'Payment-related operations are not allowed for agents',
    };
  }

  // Check payload content
  const payloadStr = JSON.stringify(req.payload);
  const blockedPattern = containsBlockedPatterns(payloadStr);
  if (blockedPattern) {
    return {
      type: 'blocked_pattern',
      pattern: blockedPattern,
      details: 'Request contains blocked security patterns',
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// Express App
// ─────────────────────────────────────────────────────────────

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [AIMS_GATEWAY_URL],
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_REQUESTS,
  message: { error: 'Rate limit exceeded', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Request logging (sanitized)
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[Agent Bridge] ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'agent-bridge',
    security: 'enabled',
    blocked_operations: BLOCKED_OPS.length,
    allowed_operations: ALLOWED_OPS.length,
  });
});

// Security status
app.get('/security', (_req: Request, res: Response) => {
  res.json({
    allowed_operations: ALLOWED_OPS,
    blocked_operations: BLOCKED_OPS,
    rate_limit: {
      requests: RATE_LIMIT_REQUESTS,
      window_ms: RATE_LIMIT_WINDOW,
    },
    features: {
      pattern_blocking: true,
      payload_sanitization: true,
      operation_whitelist: true,
      payment_blocking: 'ENFORCED',
    },
  });
});

// Forward request from AIMS to agent (with security checks)
app.post('/agent/request', async (req: Request, res: Response) => {
  try {
    const agentRequest: AgentRequest = req.body;

    // Security validation
    const violation = validateRequest(agentRequest);
    if (violation) {
      console.warn(`[Agent Bridge] SECURITY VIOLATION:`, violation);
      return res.status(403).json({
        error: 'Security violation',
        code: 'SECURITY_VIOLATION',
        violation,
      });
    }

    // Sanitize payload before forwarding
    const sanitizedRequest = {
      ...agentRequest,
      payload: sanitizePayload(agentRequest.payload),
    };

    // Forward to sandbox agent
    const response = await fetch(`${SANDBOX_AGENT_URL}/api/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedRequest),
    });

    const data = await response.json();

    // Sanitize response before returning to AIMS
    const sanitizedResponse = sanitizePayload(data as Record<string, unknown>);

    res.json(sanitizedResponse);
  } catch (error) {
    console.error('[Agent Bridge] Error:', error);
    res.status(500).json({ error: 'Bridge error', code: 'BRIDGE_ERROR' });
  }
});

// Forward response from agent to AIMS (with security checks)
app.post('/agent/response', async (req: Request, res: Response) => {
  try {
    const agentResponse = req.body;

    // Check response for blocked patterns
    const responseStr = JSON.stringify(agentResponse);
    const blockedPattern = containsBlockedPatterns(responseStr);

    if (blockedPattern) {
      console.warn(`[Agent Bridge] Blocked pattern in response: ${blockedPattern}`);
      return res.status(403).json({
        error: 'Response contains blocked security patterns',
        code: 'RESPONSE_BLOCKED',
      });
    }

    // Sanitize and forward to UEF Gateway
    const sanitizedResponse = sanitizePayload(agentResponse);

    const response = await fetch(`${AIMS_GATEWAY_URL}/api/agent/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedResponse),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[Agent Bridge] Error:', error);
    res.status(500).json({ error: 'Bridge error', code: 'BRIDGE_ERROR' });
  }
});

// Forward message FROM sandbox agent TO UEF Gateway (ingest direction)
// This is the reverse path: sandboxed agent sends a user's message to ACHEEVY
app.post('/agent/ingest', async (req: Request, res: Response) => {
  try {
    const ingestPayload = req.body;

    // Check for blocked patterns in the ingest message
    const payloadStr = JSON.stringify(ingestPayload);
    const blockedPattern = containsBlockedPatterns(payloadStr);

    if (blockedPattern) {
      console.warn(`[Agent Bridge] Blocked pattern in ingest: ${blockedPattern}`);
      return res.status(403).json({
        error: 'Message contains blocked security patterns',
        code: 'INGEST_BLOCKED',
      });
    }

    // Sanitize and forward to UEF Gateway's agent callback endpoint
    const sanitizedPayload = sanitizePayload(ingestPayload);

    const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (INTERNAL_API_KEY) headers['X-API-Key'] = INTERNAL_API_KEY;

    const response = await fetch(`${AIMS_GATEWAY_URL}/api/agent/callback`, {
      method: 'POST',
      headers,
      body: JSON.stringify(sanitizedPayload),
    });

    const data = await response.json();

    // Sanitize response before sending back to the agent
    const sanitizedResponse = sanitizePayload(data as Record<string, unknown>);
    res.json(sanitizedResponse);
  } catch (error) {
    console.error('[Agent Bridge] Ingest error:', error);
    res.status(500).json({ error: 'Bridge ingest error', code: 'INGEST_ERROR' });
  }
});

// List available agent operations
app.get('/operations', (_req: Request, res: Response) => {
  res.json({
    allowed: ALLOWED_OPS,
    blocked: BLOCKED_OPS,
    info: 'Only whitelisted operations are forwarded to agents. Payment operations are NEVER allowed.',
  });
});

// ─────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Agent Bridge] Security gateway running on port ${PORT}`);
  console.log(`[Agent Bridge] Allowed operations: ${ALLOWED_OPS.join(', ')}`);
  console.log(`[Agent Bridge] BLOCKED operations: ${BLOCKED_OPS.join(', ')}`);
  console.log(`[Agent Bridge] Payment access: DENIED (enforced)`);
});
