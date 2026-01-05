/**
 * Database client setup with LibSQL adapter
 *
 * Uses Prisma with the LibSQL driver adapter for:
 * - Local development: SQLite file (./prisma/dev.db)
 * - Production: Turso cloud database
 */

import { PrismaClient } from "../../../generated/prisma";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// Create LibSQL client
const libsql = createClient({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Create Prisma adapter
const adapter = new PrismaLibSQL(libsql);

// Create and export Prisma client with adapter
export const db = new PrismaClient({ adapter });

// Export types for convenience
export type { User, GameSession, Tournament, ChatMessage, ChatChannel } from "../../../generated/prisma";
