import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as schema from './schema';

// シングルトンでDB接続を管理
let sqlite: Database.Database | null = null;
let db: BetterSQLite3Database<typeof schema> | null = null;

/**
 * Drizzle ORMでラップしたデータベース接続を取得（シングルトン）
 * 初回呼び出し時にDBファイルを作成し、PRAGMAを設定
 */
export function getDatabase(): BetterSQLite3Database<typeof schema> {
  if (!db) {
    const dataDir = path.join(process.cwd(), 'data');
    // data/ ディレクトリがなければ作成
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'pong.db');
    sqlite = new Database(dbPath);

    // WALモード: 読み書きの並行性を向上
    sqlite.pragma('journal_mode = WAL');

    // 外部キー制約を有効化
    sqlite.pragma('foreign_keys = ON');

    // ビジータイムアウト: ロック待機時間（5秒）
    sqlite.pragma('busy_timeout = 5000');

    db = drizzle(sqlite, { schema });
  }
  return db;
}

/**
 * データベース接続を閉じる（テスト用）
 */
export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}
