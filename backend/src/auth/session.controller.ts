import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// クッキー名を固定するための定数
const SESSION_COOKIE = 'ft_session';

@ApiTags('session')
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

  @Post('me/test-score')
  testScore(@Req() req: Request, @Body() body: ScoreTestRequest) {
    const sessionId = readCookie(req.headers.cookie ?? '', SESSION_COOKIE);
    if (!sessionId) {
      throw new UnauthorizedException('Not authenticated');
    }
    const user = this.authService.findUserBySession(sessionId);
    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    const winsDelta = normalizeDelta(body.winsDelta);
    const lossesDelta = normalizeDelta(body.lossesDelta);
    const scoreDelta = normalizeDelta(body.scoreDelta);

    user.wins = clampNonNegative(user.wins + winsDelta);
    user.losses = clampNonNegative(user.losses + lossesDelta);
    user.user_score = clampNonNegative(user.user_score + scoreDelta);

    return this.authService.toPublicUser(user);
  }
}

type ScoreTestRequest = {
  winsDelta?: number;
  lossesDelta?: number;
  scoreDelta?: number;
};
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

function normalizeDelta(value: number | undefined) {
  if (value === undefined) return 0;
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new BadRequestException('Invalid delta');
  }
  return value;
}

function clampNonNegative(value: number) {
  if (value < 0) return 0;
  return value;
}
