import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigins: process.env.CORS_ORIGINS ?? 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL ?? 'debug',
  logFormat: process.env.LOG_FORMAT ?? 'pretty',
}));
