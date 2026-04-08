import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';

/**
 * CORS configuration — allows requests from the foai.cloud origin.
 */
export const corsMiddleware = cors({
  origin: process.env.CORS_ORIGIN || 'https://foai.cloud',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  credentials: true,
});

/**
 * Rate limiting — 100 requests per 15 minutes per IP.
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});

/**
 * Admin auth middleware — checks Bearer token against ADMIN_API_KEY env var.
 */
export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid authorization header.' });
    return;
  }

  const token = authHeader.slice(7);

  if (token !== process.env.ADMIN_API_KEY) {
    res.status(403).json({ success: false, error: 'Forbidden: invalid API key.' });
    return;
  }

  next();
}

/**
 * Request logging middleware — logs method, path, status, and duration.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, path } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] ${method} ${path} — ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}

/**
 * Stripe webhook signature verification middleware.
 * Must be used with express.raw() body parser on the webhook route.
 */
export function stripeWebhookVerification(stripe: Stripe) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const sig = req.headers['stripe-signature'] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig) {
      res.status(400).json({ success: false, error: 'Missing stripe-signature header.' });
      return;
    }

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured.');
      res.status(500).json({ success: false, error: 'Webhook secret not configured.' });
      return;
    }

    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      (req as any).stripeEvent = event;
      next();
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).json({ success: false, error: 'Webhook signature verification failed.' });
    }
  };
}
