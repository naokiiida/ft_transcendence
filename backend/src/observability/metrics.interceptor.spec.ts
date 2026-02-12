import { HttpException, HttpStatus } from '@nestjs/common';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor;

  beforeEach(() => {
    // MetricsService のモック（テストで使う inc/observe だけ用意）
    const mockMetricsService = {
      httpRequestsTotal: { inc: jest.fn() },
      httpRequestDuration: { observe: jest.fn() },
    } as unknown as MetricsService;

    interceptor = new MetricsInterceptor(mockMetricsService);
  });

  // ─── extractStatus ────────────────────────────────────

  describe('extractStatus', () => {
    // private メソッドへのアクセス
    const callExtractStatus = (err: unknown): number =>
      (interceptor as any).extractStatus(err);

    it('HttpException(403) → 403', () => {
      expect(callExtractStatus(new HttpException('Forbidden', HttpStatus.FORBIDDEN))).toBe(403);
    });

    it('{ status: 502 } → 502', () => {
      expect(callExtractStatus({ status: 502 })).toBe(502);
    });

    it('{ statusCode: 504 } → 504', () => {
      expect(callExtractStatus({ statusCode: 504 })).toBe(504);
    });

    it('new Error("plain") → 500', () => {
      expect(callExtractStatus(new Error('plain'))).toBe(500);
    });

    it('null → 500', () => {
      expect(callExtractStatus(null)).toBe(500);
    });
  });

  // ─── normalizeRoute ───────────────────────────────────

  describe('normalizeRoute', () => {
    const callNormalize = (path: string): string =>
      (interceptor as any).normalizeRoute(path);

    it('UUID をプレースホルダに置換する', () => {
      expect(callNormalize('/api/users/550e8400-e29b-41d4-a716-446655440000'))
        .toBe('/api/users/:uuid');
    });

    it('数値IDをプレースホルダに置換する', () => {
      expect(callNormalize('/api/users/123')).toBe('/api/users/:id');
    });

    it('末尾スラッシュを除去する', () => {
      expect(callNormalize('/api/health/')).toBe('/api/health');
    });

    it('ルートパスはそのまま返す', () => {
      expect(callNormalize('/')).toBe('/');
    });
  });
});
