import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { readCookie } from './cookie.utils';

type RegisterRequest = {
  email: string;
  password: string;
  display_name: string;
};

type LoginRequest = {
  email: string;
  password: string;
};

// api/auth/registerが呼ばれるとAuthServiceのregisterメソッドを呼び出す
@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //bodyで受け取ったjsonをRegisterRequest型としてregisterメソッドに渡す
  @Post('register')
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
}
