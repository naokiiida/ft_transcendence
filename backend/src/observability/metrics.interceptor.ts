import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const startTime = process.hrtime.bigint();
    const method = request.method;
    const route = this.normalizeRoute(request.route?.path ?? request.path);

    return next.handle().pipe(
      tap({
        next: () => this.record(method, route, response.statusCode, startTime),
        error: () =>
          this.record(method, route, response.statusCode || 500, startTime),
      }),
    );
  }

  private record(
    method: string,
    route: string,
    statusCode: number,
    startTime: bigint,
  ) {
    const durationSeconds = Number(process.hrtime.bigint() - startTime) / 1e9;
    const labels = { method, route, status_code: String(statusCode) };

    this.metricsService.httpRequestsTotal.inc(labels);
    this.metricsService.httpRequestDuration.observe(labels, durationSeconds);
  }

  // ルート正規化: UUID/数値IDをプレースホルダに変換してカーディナリティ爆発を防止
  private normalizeRoute(path: string): string {
    return (
      path
        .replace(
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
          ':uuid',
        )
        .replace(/\/\d+/g, '/:id')
        .replace(/\/$/, '') || '/'
    );
  }
}
