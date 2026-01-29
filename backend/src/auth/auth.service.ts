import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'crypto';
import type { User } from '../model/user.model';
import { UsersService } from '../users/users.service';

/*
【今後の修正が必要と思われる項目】

認証の今後の厳格化が必要
ハッシュ化が弱い。
randomUUIDは可能性は極めて極めて低いが衝突の危険性あり。DBでユニーク制約？
メールの厳密判定
→確認メールを送る？
→依存追加など（isEmail zod）
*/

type RegisterInput = {
  email: string;
  password: string;
  display_name: string;
};

/*
例外処理が、HTTPのステータスコードに対応している。
- BadRequestException: 400 Bad Request
- ConflictException: 409 Conflict
*/

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  // inputは、コントローラーで受けったった登録情報
  register(input: RegisterInput): User {
    // 余分な空白を削除して、小文字に変換
    const email = input.email?.trim().toLowerCase();
    // パスワードはそのまま取得
    const password = input.password ?? '';
    // 余分な空白を削除
    const displayName = input.display_name?.trim();

    // どれかがかけてる、メールアドレスの形式が不正（簡易判定）、パスワードが短すぎる場合はエラー
    if (!email || !displayName || !password) {
      throw new BadRequestException('Missing required fields');
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new BadRequestException('Invalid email');
    }
    if (password.length < 8) {
      throw new BadRequestException('Password too short');
    }

    //既存ユーザーとの重複チェック、同じメールや同じ表示名があればエラー。
    if (this.usersService.findByEmail(email)) {
      throw new ConflictException('Email already registered');
    }
    if (this.usersService.findByDisplayName(displayName)) {
      throw new ConflictException('Display name already in use');
    }

    // パスワードをハッシュ化してユーザー作成
    const password_hash = this.hashPassword(password);
    const now = new Date().toISOString();
    const uuid = randomUUID();
    const user: User = {
      uuid,
      display_name: displayName,
      email,
      password_hash,
      avatar_url: null,
      wins: 0,
      losses: 0,
      user_score: 0,
      created_at: now,
      last_seen: now,
    };

    return this.usersService.create(user);
  }

  // 簡易的なパスワードハッシュ化関数
  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256')
      .update(salt + password, 'utf8')
      .digest('hex');
    return `${salt}:${hash}`;
  }
}
