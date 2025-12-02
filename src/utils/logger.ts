import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config } from '@config/index.js';
import { LogStream } from './logStream.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// custom format to broadcast logs to SSE clients (only in development)
const broadcastFormat = winston.format((info: any) => {
  if (config.nodeEnv !== 'production') {
    // broadcast log to SSE clients
    LogStream.broadcast({
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      stack: info.stack,
      service: info.service,
    });
  }
  return info;
});

const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    broadcastFormat(), // broadcast after formatting
    winston.format.json()
  ),
  defaultMeta: { service: 'basic-nodejs-backend' },
  transports: [
    // write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// if not in production, log to console as well
if (config.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info: any) => {
          const { timestamp, level, message, stack } = info;
          return `${timestamp} [${level}]: ${stack || message}`;
        })
      ),
    })
  );
}

export default logger;
