import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getDatabase } from '../db/database';
import { users } from '../db/schema';
import {
  createUserInputSchema,
  type User,
  type CreateUserInput,
  type GameResult,
} from '../model/user.model';

@Injectable()
export class UsersService {
  /**
   * メールアドレスでユーザーを検索
   */
  findByEmail(email: string): User | null {
    const db = getDatabase();
    return db.select().from(users).where(eq(users.email, email)).get() ?? null;
  }

  /**
   * UUIDでユーザーを検索
   */
  findByUuid(uuid: string): User | null {
    const db = getDatabase();
    return db.select().from(users).where(eq(users.uuid, uuid)).get() ?? null;
  }

  /**
   * 表示名でユーザーを検索
   */
  findByDisplayName(displayName: string): User | null {
    const db = getDatabase();
    return (
      db
        .select()
        .from(users)
        .where(eq(users.display_name, displayName))
        .get() ?? null
    );
  }

  /**
   * 新規ユーザーを作成
   * Zod バリデーションで認証方法の整合性を保証（旧 DB トリガーの代替）
   * .returning() で INSERT 結果を直接取得
   */
  create(input: CreateUserInput): User {
    const result = createUserInputSchema.safeParse(input);
    if (!result.success) {
      throw new BadRequestException(
        result.error.issues[0]?.message ?? 'Invalid input',
      );
    }
    const parsed = result.data;

    const db = getDatabase();

    try {
      return db
        .insert(users)
        .values({
          email: parsed.email,
          display_name: parsed.display_name,
          method: parsed.method,
          password_hash:
            parsed.method === 'email' ? parsed.password_hash : null,
          intra_id: parsed.method === 'intra' ? parsed.intra_id : null,
          intra_username:
            parsed.method === 'intra' ? parsed.intra_username : null,
        })
        .returning()
        .get();
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE'
      ) {
        if (error.message.includes('email')) {
          throw new ConflictException('Email already registered');
        }
        if (error.message.includes('display_name')) {
          throw new ConflictException('Display name already in use');
        }
        throw new ConflictException('User already exists');
      }
      throw error;
    }
  }

  /**
   * UUIDでユーザーを削除
   * RETURNING句で1操作にして競合状態を排除
   */
  deleteByUuid(uuid: string): User | null {
    const db = getDatabase();
    return (
      db.delete(users).where(eq(users.uuid, uuid)).returning().get() ?? null
    );
  }

  /**
   * ゲーム結果を記録（wins/losses/score を原子的に更新）
   */
  recordGameResult(uuid: string, input: GameResult): User | null {
    const db = getDatabase();
    const { result, score_delta } = input;

    const setValues = result === 'win'
      ? { wins: sql`${users.wins} + 1`, user_score: sql`MAX(0, ${users.user_score} + ${score_delta})` }
      : { losses: sql`${users.losses} + 1`, user_score: sql`MAX(0, ${users.user_score} - ${score_delta})` };

    return db.update(users)
      .set(setValues)
      .where(eq(users.uuid, uuid))
      .returning()
      .get() ?? null;
  }

  /**
   * last_seen を更新
   */
  updateLastSeen(uuid: string): void {
    const db = getDatabase();
    db.update(users)
      .set({ last_seen: new Date().toISOString() })
      .where(eq(users.uuid, uuid))
      .run();
  }

  /**
   * 表示名でユーザーを検索（部分一致）
   */
  searchByDisplayName(query: string, limit: number, excludeUuid?: string | null) {
    const db = getDatabase();
    const normalized = query.trim();
    if (!normalized) return [];

    const escaped = normalized.replace(/[%_]/g, '\\$&');
    const pattern = `%${escaped}%`;
    const conditions = [
      sql`${users.display_name} LIKE ${pattern} ESCAPE '\\'`,
    ];

    if (excludeUuid) {
      conditions.push(sql`${users.uuid} != ${excludeUuid}`);
    }

    return db
      .select({
        uuid: users.uuid,
        display_name: users.display_name,
        avatar_url: users.avatar_url,
      })
      .from(users)
      .where(and(...conditions))
      .limit(limit)
      .all();
  }

  /**
   * スコアランキングを取得
   */
  getLeaderboard(limit: number, offset: number) {
    const db = getDatabase();
    const rows = db
      .select({
        uuid: users.uuid,
        display_name: users.display_name,
        avatar_url: users.avatar_url,
        user_score: users.user_score,
        position: sql<number>`RANK() OVER (ORDER BY ${users.user_score} DESC)`,
      })
      .from(users)
      .orderBy(desc(users.user_score))
      .limit(limit)
      .offset(offset)
      .all();

    const total = db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .get();

    return {
      entries: rows,
      total: total?.count ?? 0,
      limit,
      offset,
    };
  }
}
