import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { getDatabase } from '../db/database';

interface ComponentHealth {
  status: 'healthy' | 'unhealthy';
  latencyMs?: number;
  usedMb?: number;
  totalMb?: number;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  components: {
    database: ComponentHealth;
    memory: ComponentHealth;
  };
}

const startTime = Date.now();

@Controller('api')
export class HealthController {
  @Get('health')
  health(@Res({ passthrough: true }) res: Response): HealthResponse {
    const database = this.checkDatabase();
    const memory = this.checkMemory();

    const isHealthy =
      database.status === 'healthy' && memory.status === 'healthy';

    res.status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.1',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      components: { database, memory },
    };
  }

  private checkDatabase(): ComponentHealth {
    try {
      const start = Date.now();
      const db = getDatabase();
      db.prepare('SELECT 1').get();
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private checkMemory(): ComponentHealth {
    const mem = process.memoryUsage();
    const usedMb = Math.round(mem.heapUsed / 1024 / 1024);
    const totalMb = Math.round(mem.heapTotal / 1024 / 1024);
    const status = mem.heapUsed / mem.heapTotal < 0.9 ? 'healthy' : 'unhealthy';
    return { status, usedMb, totalMb };
  }
}
