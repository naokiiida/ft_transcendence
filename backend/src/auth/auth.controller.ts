import { Body, Controller, Post, Req, Res, UsePipes, Get, UseGuards, Logger, } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators';
import { readCookie } from './cookie.utils';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  registerRequestSchema,
  loginRequestSchema,
  type RegisterRequest,
  type LoginRequest,
} from '../model/user.model';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth')
@Public()
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(registerRequestSchema))
  register(
    @Body() body: RegisterRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    //受け取ったデータは関与せずサービスに渡すだけ。
    const user = this.authService.register(body);
    //セッション作成を追加。
    const sessionId = this.authService.createSession(user);
    //レスポンスにクッキーを設定することができる。ブラウザにクッキーを保存でき、今後使われる。
    //jacascriptからアクセスできないようにhttpOnlyをtrueにしている。(XSS
    //sameSiteは他サイトからの不正送信が必要、secureはhttps限定、pathは全パスで送信。
    res.cookie('ft_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    // 公開用のユーザー情報を返す
    return this.authService.toPublicUser(user);
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(loginRequestSchema))
  login(
    @Body() body: LoginRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = this.authService.login(body);
    const sessionId = this.authService.createSession(user);
    res.cookie('ft_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return this.authService.toPublicUser(user);
  }

  @Post('forgot')
  forgot() {
    return { ok: true };
  }

  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = readCookie(req.headers.cookie ?? '', 'ft_session');
    if (sessionId) {
      this.authService.removeSession(sessionId);
    }
    // クッキーを削除するには、同じ名前で有効期限を過去に設定する
    res.cookie('ft_session', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    return { ok: true };
  }

  @Get('42')
  @UseGuards(AuthGuard('42')) 
  oauthLogin() {
    return;
  }

  private readonly logger = new Logger(AuthController.name); 

  @Get('42/callback')
  @UseGuards(AuthGuard('42'))
  async callback(@Req() req, @Res() res: Response) {

    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';

    try {
      // 1. ガードを抜けてもユーザー情報がない場合の安全策
      if (!req.user) {
        throw new Error('User not found from 42 provider');
      }

      const user = await this.authService.login42(req.user);
      const sessionId = this.authService.createSession(user);

      res.cookie('ft_session', sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });

      // 成功時: ユーザーページへ
      res.redirect(`${frontendUrl}/user`);

    } catch (error) {
      // 2. エラーハンドリング
      this.logger.error(`OAuth Callback Error: ${error.message}`, error.stack);

      // 失敗時: ログイン画面へ戻し、エラー原因をクエリパラメータで伝える
      // フロントエンド側で `searchParams.get('error')` を見てアラートを出せる
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }
}
