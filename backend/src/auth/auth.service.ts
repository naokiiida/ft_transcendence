import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'crypto';
import type {
  User,
  CreateEmailUserInput,
  PublicUser,
} from '../model/user.model';
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

type LoginInput = {
  email: string;
  password: string;
};

/*
例外処理がHTTPのステータスコードに対応している。
- BadRequestException: 400 Bad Request
- ConflictException: 409 Conflict

UUIDはUUID v4で自動生成される。
display_nameはユニークで、ユーザーが後から変更可能。
*/

@Injectable()
export class AuthService {
  // ブラウザからくるセッションIDとログインユーザーの対応表
  // メモリ上に保存しているだけなので、サーバー再起動で消える、サーバー分散したら共有されない
  private sessionsById = new Map<string, string>();

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

    // 既存ユーザーとの重複チェック（email, display_name共にユニーク）
    if (this.usersService.findByEmail(email)) {
      throw new ConflictException('Email already registered');
    }
    if (this.usersService.findByDisplayName(displayName)) {
      throw new ConflictException('Display name already in use');
    }

    // パスワードをハッシュ化してユーザー作成
    const createInput: CreateEmailUserInput = {
      method: 'email',
      email,
      password_hash: this.hashPassword(password),
      display_name: displayName,
    };

    return this.usersService.create(createInput);
  }

  login(input: LoginInput): User {
    const email = input.email?.trim().toLowerCase();
    const password = input.password ?? '';

    if (!email || !password) {
      throw new BadRequestException('Missing required fields');
    }

    const user = this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password_hash || !this.verifyPassword(password, user.password_hash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  // ログイン状態を作成する。コントローラーで呼ばれる、ログイン証明書としてセッションIDを発行する
  createSession(user: User) {
    const sessionId = randomUUID();
    this.sessionsById.set(sessionId, user.uuid);
    return sessionId;
  }

  // セッションIDからユーザーを取得する
  findUserBySession(sessionId: string) {
    const uuid = this.sessionsById.get(sessionId);
    if (!uuid) return null;
    return this.usersService.findByUuid(uuid) ?? null;
  }

  // ログアウト時にセッション対応表から削除する
  removeSession(sessionId: string) {
    this.sessionsById.delete(sessionId);
  }

  // 指定したユーザーUUIDに関連するすべてのセッションを削除する
  removeSessionsByUuid(uuid: string) {
    for (const [sessionId, storedUuid] of this.sessionsById.entries()) {
      if (storedUuid === uuid) {
        this.sessionsById.delete(sessionId);
      }
    }
  }

  // ユーザー情報から公開用の情報だけを返す
  // パスワードハッシュを含まないようにする
  toPublicUser(user: User): PublicUser {
    const { password_hash, ...safe } = user;
    return safe;
  }

  // 簡易的なパスワードハッシュ化関数
  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256')
      .update(salt + password, 'utf8')
      .digest('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, stored: string | null): boolean {
    if (!stored) return false;
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const candidate = createHash('sha256')
      .update(salt + password, 'utf8')
      .digest('hex');
    return candidate === hash;
  }
}
