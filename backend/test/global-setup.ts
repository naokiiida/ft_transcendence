import * as fs from 'fs';
import * as path from 'path';

export default function globalSetup() {
  const dbPath = path.join(process.cwd(), 'data', 'pong.db');
  const walPath = dbPath + '-wal';
  const shmPath = dbPath + '-shm';

  for (const file of [dbPath, walPath, shmPath]) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}
