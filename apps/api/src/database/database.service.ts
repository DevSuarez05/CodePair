import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * @class DatabaseService
 *
 * Wraps PrismaClient as a NestJS injectable service.
 *
 * Responsibilities:
 * - Manages a single PrismaClient instance (singleton via NestJS DI)
 * - Configures query logging based on NODE_ENV
 * - Handles connection pooling via Prisma's built-in pool
 * - Implements graceful shutdown (releases all connections)
 * - Provides a transactional helper for atomic operations
 *
 * Connection Pool:
 * Prisma manages the MySQL connection pool internally. Pool size is
 * controlled via `connection_limit` in the DATABASE_URL query string.
 * The pool settings in databaseConfig are applied here programmatically.
 */
@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(configService: ConfigService) {
    const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
    const poolMax = configService.get<number>('database.pool.max', 10);
    const connectionTimeout = configService.get<number>('database.pool.connectionTimeout', 30000);

    // ── Prisma Client Options ──────────────────────────────────
    const clientOptions: Prisma.PrismaClientOptions = {
      // Inject pool settings into the connection URL at runtime
      datasourceUrl: (() => {
        const url = new URL(configService.get<string>('database.url', ''));
        url.searchParams.set('connection_limit', String(poolMax));
        url.searchParams.set('connect_timeout', String(Math.floor(connectionTimeout / 1000)));
        url.searchParams.set('pool_timeout', String(Math.floor(connectionTimeout / 1000)));
        return url.toString();
      })(),

      // ── Query Logging ───────────────────────────────────────
      log: nodeEnv === 'production'
        ? [
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ],

      errorFormat: nodeEnv === 'production' ? 'minimal' : 'pretty',
    };

    super(clientOptions);

    // ── Wire Prisma Log Events ─────────────────────────────────
    // Using $on for structured logging via Winston
    (this as unknown as PrismaClient).$on('query' as never, (e: Prisma.QueryEvent) => {
      this.logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
    });

    (this as unknown as PrismaClient).$on('warn' as never, (e: Prisma.LogEvent) => {
      this.logger.warn(e.message);
    });

    (this as unknown as PrismaClient).$on('error' as never, (e: Prisma.LogEvent) => {
      this.logger.error(e.message);
    });
  }

  // ── Lifecycle Hooks ───────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to MySQL database...');
    try {
      await this.$connect();
      this.logger.log('✅ Database connection established successfully.');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      // Propagate — NestJS will handle module init failure
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from MySQL database...');
    await this.$disconnect();
    this.logger.log('Database connection pool released.');
  }

  // ── Transactional Helper ──────────────────────────────────────

  /**
   * Executes a callback within an interactive transaction.
   * All Prisma operations inside the callback are atomic.
   *
   * @example
   * await this.db.transaction(async (tx) => {
   *   await tx.user.create({ ... });
   *   await tx.session.create({ ... });
   * });
   */
  async transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    return this.$transaction(callback, {
      maxWait: options?.maxWait ?? 5000,
      timeout: options?.timeout ?? 10000,
      isolationLevel: options?.isolationLevel ?? Prisma.TransactionIsolationLevel.ReadCommitted,
    });
  }

  // ── Health Check ─────────────────────────────────────────────

  /**
   * Executes a lightweight query to verify DB connectivity.
   * Used by the health endpoint (/api/v1/health).
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  // ── Soft Delete Helper ────────────────────────────────────────

  /**
   * Applies a soft-delete filter to exclude logically-deleted records.
   * Intended for use in service-layer queries.
   */
  get activeFilter(): { deletedAt: null } {
    return { deletedAt: null };
  }
}
