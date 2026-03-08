import { Router } from 'express';

export const lucStripeBridgeRouter = Router();

lucStripeBridgeRouter.use('/api/billing', (_req, res) => {
  res.status(501).json({
    error: 'LUC-Stripe bridge unavailable',
    code: 'LUC_STRIPE_BRIDGE_NOT_CONFIGURED',
  });
});