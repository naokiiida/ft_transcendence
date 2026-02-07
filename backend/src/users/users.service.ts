import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getDatabase } from '../db/database';
import { users } from '../db/schema';
import {
  createUserInputSchema,
  type User,
  type CreateUserInput,
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
    let parsed: CreateUserInput;
    try {
      parsed = createUserInputSchema.parse(input);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException(error.issues[0]?.message ?? 'Invalid input');
      }
      throw error;
    }

    const db = getDatabase();
    const now = new Date().toISOString();

    try {
      return db
        .insert(users)
        .values({
          uuid: randomUUID(),
          email: parsed.email,
          display_name: parsed.display_name,
          method: parsed.method,
          password_hash:
            parsed.method === 'email' ? parsed.password_hash : null,
          intra_id: parsed.method === 'intra' ? parsed.intra_id : null,
          intra_username:
            parsed.method === 'intra' ? parsed.intra_username : null,
          created_at: now,
          last_seen: now,
        })
        .returning()
        .get();
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('UNIQUE constraint failed')
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
   * last_seen を更新
   */
  updateLastSeen(uuid: string): void {
    const db = getDatabase();
    db.update(users)
      .set({ last_seen: new Date().toISOString() })
      .where(eq(users.uuid, uuid))
      .run();
  }
}
