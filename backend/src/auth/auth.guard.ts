import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './decorators';
import { readCookie } from './cookie.utils';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // @Public() が付いていればスキップ
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = readCookie(request.headers.cookie ?? '', 'ft_session');
    if (!sessionId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const user = this.authService.findUserBySession(sessionId);
    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    // Guard が認証済みユーザーを request にセット → @CurrentUser() で取得可能
    request.user = user;
    return true;
  }
}
