import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL ?? '',
  pool: {
    min: parseInt(process.env.DB_POOL_MIN ?? '2', 10),
    max: parseInt(process.env.DB_POOL_MAX ?? '10', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT ?? '30000', 10),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT ?? '600000', 10),
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT ?? '60000', 10),
  },
}));
