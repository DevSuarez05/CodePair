import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

/**
 * @class DatabaseHealthIndicator
 *
 * Health indicator for the MySQL/Prisma connection.
 */
@Injectable()
export class DatabaseHealthIndicator {
  constructor(private readonly db: DatabaseService) {}

  async isHealthy(key: string = 'database'): Promise<Record<string, { status: string; timestamp: string }>> {
    const isConnected = await this.db.isHealthy();
    return {
      [key]: {
        status: isConnected ? 'up' : 'down',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
