/**
 * Database client setup with LibSQL adapter
 *
 * Uses Prisma with the LibSQL driver adapter for:
 * - Local development: SQLite file (./prisma/dev.db)
 * - Production: Turso cloud database
 */

import { PrismaClient } from "../../../generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Create LibSQL adapter factory with config
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Create and export Prisma client with adapter
export const db = new PrismaClient({ adapter });

// Export types for convenience
export type { User, GameSession, Tournament, ChatMessage, ChatChannel } from "../../../generated/prisma/client.js";
