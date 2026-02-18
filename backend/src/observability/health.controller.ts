import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import type { Response } from 'express';
import { Public } from '../auth/decorators';
import { getDatabase } from '../db/database';
import { MetricsService } from './metrics.service';

interface ComponentHealth {
  status: 'healthy' | 'unhealthy';
  latencyMs?: number;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  components: {
    database: ComponentHealth;
  };
}

const startTime = Date.now();

@ApiTags('observability')
@Public()
@Controller('api')
export class HealthController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('health')
  health(@Res({ passthrough: true }) res: Response): HealthResponse {
    const database = this.checkDatabase();

    res.status(
      database.status === 'healthy'
        ? HttpStatus.OK
        : HttpStatus.SERVICE_UNAVAILABLE,
    );

    return {
      status: database.status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.1',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      components: { database },
    };
  }

  private checkDatabase(): ComponentHealth {
    try {
      const start = process.hrtime.bigint();
      const db = getDatabase();
      db.run(sql`SELECT 1`);
      const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
      this.metricsService.dbQueryDuration.observe(
        { operation: 'health_check' },
        durationSeconds,
      );
      return { status: 'healthy', latencyMs: Math.round(durationSeconds * 1000) };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

}
