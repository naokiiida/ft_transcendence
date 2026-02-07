import * as path from 'path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { getDatabase } from './database';

/**
 * Drizzle ORM のマイグレーションを実行
 * drizzle/ ディレクトリの SQL ファイルを適用
 */
export function runMigrations(): void {
  const db = getDatabase();
  const migrationsFolder = path.join(process.cwd(), 'drizzle');
  migrate(db, { migrationsFolder });
}
