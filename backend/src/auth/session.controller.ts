import { Controller, Delete, Get, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// クッキー名を固定するための定数
const SESSION_COOKIE = 'ft_session';

@Controller('api')
export class SessionController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // 本人確認のためのエンドポイント
  @Get('me')
  me(@Req() req: Request) {
    // クッキーからセッションIDを取得 req.headers.cookie（あとで）
    const sessionId = readCookie(req.headers.cookie ?? '', SESSION_COOKIE);
    if (!sessionId) {
      throw new UnauthorizedException('Not authenticated');
    }
    // セッションIDからユーザーを取得
    const user = this.authService.findUserBySession(sessionId);
    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }
    // 公開用のユーザー情報を返す
    return this.authService.toPublicUser(user);
  }

  @Delete('me')
  deleteMe(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = readCookie(req.headers.cookie ?? '', SESSION_COOKIE);
    if (!sessionId) {
      throw new UnauthorizedException('Not authenticated');
    }
    const user = this.authService.findUserBySession(sessionId);
    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }
    if (user.uuid) {
      this.usersService.deleteByUuid(user.uuid);
      this.authService.removeSessionsByUuid(user.uuid);
    }
    res.cookie(SESSION_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    return { ok: true };
  }
}
// 自前パーサー "a=1; ft_session=xxx; b=2"のような文字列から特定のクッキー名の値を取得
// cookie-parserのほうがよい。
function readCookie(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}
