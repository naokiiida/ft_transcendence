import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  NotFoundException,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { readCookie } from './cookie.utils';
import { UsersService } from '../users/users.service';
import { gameResultSchema, type GameResult } from '../model/user.model';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

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
  @UsePipes(new ZodValidationPipe(gameResultSchema))
  testScore(@Req() req: Request, @Body() body: GameResult) {
    const sessionId = readCookie(req.headers.cookie ?? '', SESSION_COOKIE);
    if (!sessionId) {
      throw new UnauthorizedException('Not authenticated');
    }
    const user = this.authService.findUserBySession(sessionId);
    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    const updated = this.usersService.recordGameResult(user.uuid, body);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return this.authService.toPublicUser(updated);
  }
}
