import * as path from 'path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { getDatabase } from './database';

/**
 * Drizzle ORM のマイグレーションを実行
 * drizzle/ ディレクトリの SQL ファイルを適用
 */
export function runMigrations(): void {
  const db = getDatabase();
  // process.cwd() を使用する理由:
  // - __dirname はビルド後に dist/src/db/ となり、drizzle/ への相対パスが壊れやすい
  // - process.cwd() は起動元ディレクトリに依存するが、以下の全経路で backend/ が保証される:
  //   1. Docker: WORKDIR /app + drizzle/ コピー済み (Dockerfile L15)
  //   2. pnpm dev: backend/ から nest start 実行
  //   3. テスト: backend/ から jest 実行
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  migrate(db, { migrationsFolder });
}
