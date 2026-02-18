import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

const Strategy = require('passport-42').Strategy;

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy, '42') {
  constructor() {
    super({
      clientID: process.env.FORTYTWO_APP_ID,
      clientSecret: process.env.FORTYTWO_APP_SECRET,
      callbackURL: 'http://localhost:3001/api/auth/42/callback',
      
      authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
      tokenURL: 'https://api.intra.42.fr/oauth/token',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any, // ここは any にしておくと型定義ファイルの問題を無視できます
    cb: any, // コールバックが必要な場合の引数
  ) {
    // profile._json が存在しない場合の安全策
    const json = profile._json || profile;
    
    const user = {
      fortyTwoId: json.id,
      username: json.login,
      email: json.email,
      avatar: json.image?.link,
    };

    return user;
  }
}
