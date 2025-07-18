import { Request, Response, NextFunction } from 'express';

export const responseTime = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const time = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    if (!res.headersSent) {
      res.set('X-Response-Time', time);
    }
  });

  next();
};
