import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'crypto';
import type {
  User,
  CreateEmailUserInput,
  PublicUser,
  RegisterRequest,
  LoginRequest,
} from '../model/user.model';
import { UsersService } from '../users/users.service';


@Injectable()
export class AuthService {
  // ブラウザからくるセッションIDとログインユーザーの対応表
  // メモリ上に保存しているだけなので、サーバー再起動で消える、サーバー分散したら共有されない
  private sessionsById = new Map<string, string>();

  constructor(private readonly usersService: UsersService) {}

  // ZodValidationPipe がバリデーション+trim/toLowerCase を担当済み
  register(input: RegisterRequest): User {
    const { email, password, display_name } = input;

    // 既存ユーザーとの重複チェック（ビジネスロジック）
    if (this.usersService.findByEmail(email)) {
      throw new ConflictException('Email already registered');
    }
    if (this.usersService.findByDisplayName(display_name)) {
      throw new ConflictException('Display name already in use');
    }

    const createInput: CreateEmailUserInput = {
      method: 'email',
      email,
      password_hash: this.hashPassword(password),
      display_name,
    };

    return this.usersService.create(createInput);
  }

  login(input: LoginRequest): User {
    const { email, password } = input;

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
