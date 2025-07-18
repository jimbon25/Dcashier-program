import winston from 'winston';
import path from 'path';

const logDir = 'logs';
const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const logger = winston.createLogger({
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    // Log info level to console
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      ),
      level: 'info'
    }),
    // Log all levels to file
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

export default logger;
