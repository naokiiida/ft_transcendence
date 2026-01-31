import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDatabase } from '../db/database';
import type { User, CreateUserInput } from '../model/user.model';

@Injectable()
export class UsersService {
  /**
   * メールアドレスでユーザーを検索
   */
  findByEmail(email: string): User | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const row = stmt.get(email) as User | undefined;
    return row ?? null;
  }

  /**
   * UUIDでユーザーを検索
   */
  findByUuid(uuid: string): User | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE uuid = ?');
    const row = stmt.get(uuid) as User | undefined;
    return row ?? null;
  }

  /**
   * 表示名でユーザーを検索
   */
  findByDisplayName(displayName: string): User | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE display_name = ?');
    const row = stmt.get(displayName) as User | undefined;
    return row ?? null;
  }

  /**
   * 新規ユーザーを作成
   * Discriminated Unionでメール認証とIntra認証を型安全に処理
   */
  create(input: CreateUserInput): User {
    const db = getDatabase();
    const now = new Date().toISOString();
    const uuid = randomUUID();

    // Discriminated Union: methodで分岐
    const user: User =
      input.method === 'email'
        ? {
            uuid,
            email: input.email,
            password_hash: input.password_hash,
            display_name: input.display_name,
            avatar_url: null,
            intra_id: null,
            intra_username: null,
            oauth_access_token: null,
            oauth_refresh_token: null,
            wins: 0,
            losses: 0,
            user_score: 1000,
            created_at: now,
            last_seen: now,
            method: 'email',
          }
        : {
            uuid,
            email: input.email,
            password_hash: null,
            display_name: input.display_name,
            avatar_url: null,
            intra_id: input.intra_id,
            intra_username: input.intra_username,
            oauth_access_token: null,
            oauth_refresh_token: null,
            wins: 0,
            losses: 0,
            user_score: 1000,
            created_at: now,
            last_seen: now,
            method: 'intra',
          };

    const stmt = db.prepare(`
      INSERT INTO users (
        uuid, email, password_hash, display_name, avatar_url,
        intra_id, intra_username, oauth_access_token, oauth_refresh_token,
        wins, losses, user_score, created_at, last_seen, method
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      user.uuid,
      user.email,
      user.password_hash,
      user.display_name,
      user.avatar_url,
      user.intra_id,
      user.intra_username,
      user.oauth_access_token,
      user.oauth_refresh_token,
      user.wins,
      user.losses,
      user.user_score,
      user.created_at,
      user.last_seen,
      user.method,
    );

    return user;
  }

  /**
   * UUIDでユーザーを削除
   */
  deleteByUuid(uuid: string): User | null {
    const db = getDatabase();
    const user = this.findByUuid(uuid);
    if (!user) return null;

    const stmt = db.prepare('DELETE FROM users WHERE uuid = ?');
    stmt.run(uuid);
    return user;
  }

  /**
   * last_seen を更新
   */
  updateLastSeen(uuid: string): void {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE users SET last_seen = ? WHERE uuid = ?');
    stmt.run(new Date().toISOString(), uuid);
  }
}
