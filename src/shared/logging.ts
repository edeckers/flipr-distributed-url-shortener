import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: {
    service: 'flipr-sh',
    version: process.env.npm_package_version || '1.0.0',
    nodeId: process.env.HOSTNAME || 'unknown',
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.json(),
        winston.format.splat(),
      ),
    }),
  ],
});
