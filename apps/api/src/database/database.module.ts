import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseHealthIndicator } from './database.health';

/**
 * @module DatabaseModule
 * @global — Exports DatabaseService to all modules without re-importing.
 *
 * Provides:
 * - PrismaClient singleton with connection pooling
 * - Lifecycle hooks for graceful startup/shutdown
 * - Health indicator for /health endpoint
 */
@Global()
@Module({
  providers: [DatabaseService, DatabaseHealthIndicator],
  exports: [DatabaseService, DatabaseHealthIndicator],
})
export class DatabaseModule {}
