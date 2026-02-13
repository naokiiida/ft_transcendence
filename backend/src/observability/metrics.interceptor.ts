import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
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
    const route = this.normalizeRoute(
      request.route?.path
        ? `${request.baseUrl}${request.route.path}`
        : request.path,
    );

    return next.handle().pipe(
      tap({
        next: () => this.record(method, route, response.statusCode, startTime),
        error: (err: Error) =>
          this.record(method, route, this.extractStatus(err), startTime),
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

  private extractStatus(err: unknown): number {
    if (err instanceof HttpException) return err.getStatus();
    if (typeof err === 'object' && err !== null) {
      const e = err as Record<string, unknown>;
      if (typeof e.status === 'number') return e.status;
      if (typeof e.statusCode === 'number') return e.statusCode;
    }
    return 500;
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
