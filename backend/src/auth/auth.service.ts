import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { eq, and, gt, lte } from 'drizzle-orm';
import { getDatabase } from '../db/database';
import { sessions } from '../db/schema';
import type {
  User,
  CreateEmailUserInput,
  PublicUser,
  RegisterRequest,
  LoginRequest,
} from '../model/user.model';
import { UsersService } from '../users/users.service';

const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1時間

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly usersService: UsersService) {}

  onModuleInit() {
    this.cleanupExpiredSessions();
    this.cleanupTimer = setInterval(
      () => this.cleanupExpiredSessions(),
      SESSION_CLEANUP_INTERVAL,
    );
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  // 期限切れセッションを削除する
  private cleanupExpiredSessions(): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    const expired = db
      .delete(sessions)
      .where(lte(sessions.expires_at, now))
      .returning()
      .all();
    if (expired.length > 0) {
      this.logger.log(`Cleaned up ${expired.length} expired session(s)`);
    }
  }

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

// ── OAuth 認証 ──────────────────────────────────────
  async login42(profile: any): Promise<User> {
    // 1. 既存ユーザーを探す (EmailまたはIntraIDで)
    let user = this.usersService.findByEmail(profile.email);

    if (user) {
      return user;
    }

    // 2. 表示名の重複チェックと回避
    // UsersService.createは重複時に例外を投げるため、ここで事前に回避します
    let displayName = profile.username;
    while (this.usersService.findByDisplayName(displayName)) {
      // 重複していたらランダムな文字列を付与 (例: naokiiida_a1b2)
      const suffix = randomBytes(2).toString('hex');
      displayName = `${profile.username}_${suffix}`;
    }

    // 3. 新規ユーザー作成
    // UsersService.create の引数 (CreateUserInput) に合わせます
    const newUserInput = {
      method: 'intra',               // ここでIntra認証であることを指定
      email: profile.email,
      display_name: displayName,
      intra_id: String(profile.ftId),  // IntraのユーザーID
      intra_username: profile.username, // IntraのログインID
      // method: 'intra' なので password_hash は無視されますが、
      // 型定義で必須なら適当な値を入れるか、型定義を修正してください
      password_hash: '', 
      avatar_url: profile.avatar,    // ※CreateUserInputにこのフィールドがある場合
    };

    // createメソッド呼び出し (型キャストが必要な場合は as any を使用)
    return this.usersService.create(newUserInput as any);
  }

  // ── セッション管理（DB永続化） ─────────────────────────

  // セッションを作成し、IDを返す
  createSession(user: User): string {
    const db = getDatabase();
    const expiresAt = computeSessionExpiry();
    const session = db
      .insert(sessions)
      .values({ user_id: user.uuid, expires_at: expiresAt })
      .returning()
      .get();

    return session.id;
  }

  // セッションIDから有効なユーザーを取得する（期限切れチェック付き）
  findUserBySession(sessionId: string): User | null {
    const db = getDatabase();
    const now = new Date().toISOString();

    const session = db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), gt(sessions.expires_at, now)))
      .get();

    if (!session) return null;
    return this.usersService.findByUuid(session.user_id) ?? null;
  }

  // ログアウト時にセッションを削除する
  removeSession(sessionId: string): void {
    const db = getDatabase();
    db.delete(sessions).where(eq(sessions.id, sessionId)).run();
  }

  // 指定したユーザーの全セッションを削除する（アカウント削除時など）
  removeSessionsByUuid(uuid: string): void {
    const db = getDatabase();
    db.delete(sessions).where(eq(sessions.user_id, uuid)).run();
  }

  // ── ユーティリティ ──────────────────────────────────

  toPublicUser(user: User): PublicUser {
    const { password_hash, ...safe } = user;
    return safe;
  }

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
    const candidateBuf = Buffer.from(candidate, 'utf8');
    const hashBuf = Buffer.from(hash, 'utf8');
    if (candidateBuf.length !== hashBuf.length) return false;
    return timingSafeEqual(candidateBuf, hashBuf);
  }
}

// 現在時刻か7日後の ISO 8601 文字列を返す関数
function computeSessionExpiry(): string {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
}
