import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual, randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { IS_PUBLIC_KEY, REQUIRE_USER_KEY } from './decorators';
import { readCookie } from './cookie.utils';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

/*
ログインしているユーザーにのみAPIを使わせる。
セッション認証 または API キー認証（X-API-Key ヘッダー）で通過可能。

プロフィール、投稿、フレンド、設定変更。
将来的に、WSゲームのゲートに使う。
*/

/** 環境変数 API_KEY、未設定ならランダム生成 */
const API_KEY = process.env.API_KEY || randomUUID();

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    if (!process.env.API_KEY) {
      this.logger.warn(`Generated API key: ${API_KEY}`);
    }
  }

  canActivate(context: ExecutionContext): boolean {
    // @Public() が付いていればスキップ認証不要なプロセスの場合は、スキップする。
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();

    // 1) セッション認証を試行
    const sessionId = readCookie(request.headers.cookie ?? '', 'ft_session');
    if (sessionId) {
      const user = this.authService.findUserBySession(sessionId);
      if (user) {
        request.user = user;
        const lastSeenMs = user.last_seen ? Date.parse(user.last_seen) : NaN;
        const nowMs = Date.now();
        if (Number.isNaN(lastSeenMs) || nowMs - lastSeenMs >= 60_000) {
          this.usersService.updateLastSeen(user.uuid);
        }
        return true;
      }
    }

    // 2) API キー認証を試行
    const apiKey = request.headers['x-api-key'] as string | undefined;
    if (apiKey && this.isValidApiKey(apiKey)) {
      request.user = null as any;

      // @RequireUser() が付いている場合、API キーではアクセス不可
      const requireUser = this.reflector.getAllAndOverride<boolean>(
        REQUIRE_USER_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (requireUser) {
        throw new ForbiddenException(
          'This endpoint requires session authentication. API key access is not allowed.',
        );
      }

      return true;
    }

    throw new UnauthorizedException('Not authenticated');
  }

  private isValidApiKey(key: string): boolean {
    try {
      const a = Buffer.from(key);
      const b = Buffer.from(API_KEY);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }
}
