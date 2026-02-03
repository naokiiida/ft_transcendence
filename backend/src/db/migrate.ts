import * as fs from 'fs';
import * as path from 'path';
import { getDatabase } from './database';

/**
 * schema_version テーブルを作成（存在しない場合）
 */
function ensureSchemaVersionTable(): void {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);
}

/**
 * 適用済みのバージョン一覧を取得
 */
function getAppliedVersions(): Set<number> {
  const db = getDatabase();
  const rows = db.prepare('SELECT version FROM schema_version').all() as {
    version: number;
  }[];
  return new Set(rows.map((r) => r.version));
}

/**
 * マイグレーションファイルを読み込んで適用
 */
export function runMigrations(): void {
  ensureSchemaVersionTable();

  const appliedVersions = getAppliedVersions();
  // __dirname はビルド後 dist/db/ を指すため、ビルド環境でも動作する
  const migrationsDir = path.join(__dirname, 'migrations');

  // マイグレーションファイルを取得してソート
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const db = getDatabase();

  for (const file of files) {
    // ファイル名から番号を抽出（例: 001_users.sql → 1）
    const match = file.match(/^(\d+)/);
    if (!match) continue;

    const version = parseInt(match[1], 10);

    // 既に適用済みならスキップ
    if (appliedVersions.has(version)) {
      continue;
    }

    console.log(`Applying migration: ${file}`);

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    // トランザクションで実行
    const transaction = db.transaction(() => {
      db.exec(sql);
      db.prepare(
        'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
      ).run(version, new Date().toISOString());
    });

    transaction();
    console.log(`Migration ${file} applied successfully`);
  }
}
