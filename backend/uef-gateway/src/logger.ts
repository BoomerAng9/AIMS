import pino from 'pino';

const logger = pino({
  name: 'uef-gateway',
  level: process.env.LOG_LEVEL || 'info',
});

export default logger;
