import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { DatabaseService } from './database.service';

/**
 * @class DatabaseHealthIndicator
 *
 * NestJS Terminus health indicator for the MySQL/Prisma connection.
 * Registered in the HealthModule and exposed at GET /api/v1/health.
 */
@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async isHealthy(key: string = 'database'): Promise<HealthIndicatorResult> {
    const isConnected = await this.db.isHealthy();
    const result = this.getStatus(key, isConnected);

    if (!isConnected) {
      throw new HealthCheckError('Database connection failed', result);
    }

    return result;
  }
}
