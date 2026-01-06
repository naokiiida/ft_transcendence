/**
 * Database module exports
 */

export { db } from "./client";
export type { User, GameSession, Tournament, ChatMessage, ChatChannel } from "./client";

// Re-export TypedSQL queries from generated sql.ts
export {
  findUserById42,
  findUserByLogin,
  getLeaderboard,
} from "../../../generated/prisma/sql";
