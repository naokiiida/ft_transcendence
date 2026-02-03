import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

// シングルトンでDB接続を管理
let db: Database.Database | null = null;

/**
 * データベース接続を取得（シングルトン）
 * 初回呼び出し時にDBファイルを作成し、PRAGMAを設定
 */
export function getDatabase(): Database.Database {
  if (!db) {
    const dataDir = path.join(process.cwd(), 'data');
    // data/ ディレクトリがなければ作成
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'pong.db');
    db = new Database(dbPath);

    // WALモード: 読み書きの並行性を向上
    db.pragma('journal_mode = WAL');

    // 外部キー制約を有効化
    db.pragma('foreign_keys = ON');

    // ビジータイムアウト: ロック待機時間（5秒）
    db.pragma('busy_timeout = 5000');
  }
  return db;
}

/**
 * データベース接続を閉じる（テスト用）
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
