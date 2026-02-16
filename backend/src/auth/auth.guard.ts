import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY, IS_OPTIONAL_AUTH_KEY } from './decorators';
import { readCookie } from './cookie.utils';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

/*
ログインしているユーザーにのみAPIを使わせる。

プロフィール、投稿、フレンド、設定変更。
将来的に、WSゲームのゲートに使う。

*/

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handlers = [context.getHandler(), context.getClass()];

    // @Public() が付いていればスキップ
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, handlers);
    if (isPublic) return true;

    // @OptionalAuth() なら認証を試みるが、失敗しても通す
    const isOptional = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, handlers);

    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = readCookie(request.headers.cookie ?? '', 'ft_session');
    if (!sessionId) {
      if (isOptional) return true;
      throw new UnauthorizedException('Not authenticated');
    }

    const user = this.authService.findUserBySession(sessionId);
    if (!user) {
      if (isOptional) return true;
      throw new UnauthorizedException('Invalid session');
    }

    // Guard が認証済みユーザーを request にセット → @CurrentUser() で取得可能
    request.user = user;
    // last_seen は、APIリクエストと紐づけて、60秒以上の間隔があれば書き込みを行う。
    const lastSeenMs = user.last_seen ? Date.parse(user.last_seen) : NaN;
    const nowMs = Date.now();
    if (Number.isNaN(lastSeenMs) || nowMs - lastSeenMs >= 60_000) {
      this.usersService.updateLastSeen(user.uuid);
    }
    return true;
  }
}
