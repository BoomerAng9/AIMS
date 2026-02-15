/**
 * Router_Ang Logger — Structured logging via pino
 */

import pino from 'pino';

export const logger = pino({
  name: 'router-ang',
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true },
  } : undefined,
});
