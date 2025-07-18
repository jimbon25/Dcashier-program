import morgan from 'morgan';
import logger from '../logger';
import { Request, Response } from 'express';

// Custom token untuk response time dalam ms
morgan.token('response-time-ms', (_req: Request, res: Response) => {
  return res.get('X-Response-Time') || '0';
});

// Custom token untuk request body
morgan.token('request-body', (req: Request) => {
  const body = { ...req.body };
  // Hapus sensitive data
  if (body.password) body.password = '***';
  if (body.token) body.token = '***';
  if (body.refreshToken) body.refreshToken = '***';
  return JSON.stringify(body);
});

// Format untuk development
const developmentFormat = ':method :url :status :response-time-ms ms - :request-body';

// Format untuk production
const productionFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time-ms',
  timestamp: ':date[iso]',
  ip: ':remote-addr'
});

const skipSuccessfulHealthChecks = (req: Request, res: Response) => {
  return req.path === '/health' && res.statusCode === 200;
};

// Stream untuk menulis log ke Winston
const stream = {
  write: (message: string) => {
    const data = message.trim();
    if (process.env.NODE_ENV === 'production') {
      try {
        const logData = JSON.parse(data);
        logger.info('API Request', logData);
      } catch (e) {
        logger.info(data);
      }
    } else {
      logger.info(data);
    }
  }
};

export const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  {
    stream,
    skip: skipSuccessfulHealthChecks
  }
);
