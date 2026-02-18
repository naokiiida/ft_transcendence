import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

const Strategy = require('passport-42').Strategy;

@Injectable()
export class FtStrategy extends PassportStrategy(Strategy, '42') {
  constructor() {
    super({
      clientID: process.env.FT_CLIENT_ID,
      clientSecret: process.env.FT_CLIENT_SECRET,
      callbackURL: process.env.FT_CALLBACK_URL || 'http://localhost:3001/api/auth/42/callback',
      
      authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
      tokenURL: 'https://api.intra.42.fr/oauth/token',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    // 1. データが存在しない場合の安全策
    // _json がなければ、標準の profile から情報を探すように安全に取得します
    const json = profile._json || {};
    
    const ftId = json.id || profile.id;
    const username = json.login || profile.username;
    const email = json.email || (profile.emails && profile.emails[0]?.value);
    const avatar = json.image?.link || (profile.photos && profile.photos[0]?.value);

    // 必須データが取れなかった場合はエラーにする（サイレント失敗を防ぐ）
    if (!username) {
      throw new Error('Validated user is missing username/login');
    }

    // AuthService.login42 が期待するプロパティ名に合わせて返します
    const user = {
      fortyTwoId: ftId, // AuthServiceで使う名前に合わせる (ftId か fortyTwoId か確認してください)
      username: username,
      email: email,
      avatar: avatar,
    };

    return user;
  }
}
