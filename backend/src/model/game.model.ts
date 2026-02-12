import { z } from 'zod';
import { games } from '../db/schema';

// ═══════════════════════════════════════════════════════════
// 型定義 — Drizzle スキーマから導出（単一真実源）
// ═══════════════════════════════════════════════════════════

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;

// ═══════════════════════════════════════════════════════════
// フィールドカテゴリ
//
//  不変（作成時に固定）:
//    id, player1_id, player2_id, game_type, ai_difficulty, created_at
//
//  ゲーム進行中に変化:
//    player1_score, player2_score, status, started_at
//
//  ゲーム完了時に確定:
//    winner_id, score_delta, ended_at, status → 'completed'|'forfeit'
//
// ═══════════════════════════════════════════════════════════

// ─── ドメインスキーマ（サービス層）──────────────────────

const aiDifficulties = ['easy', 'medium', 'hard', 'EuropeanHard'] as const;

// --- ゲーム作成（サービス内部から呼ばれる） ---

export const createGameSchema = z.discriminatedUnion('game_type', [
  z.object({
    game_type: z.literal('ai'),
    player1_id: z.uuid(),
    ai_difficulty: z.enum(aiDifficulties),
  }),
  z.object({
    game_type: z.literal('online'),
    player1_id: z.uuid(),
    player2_id: z.uuid(),
  }),
  z.object({
    game_type: z.literal('local'),
    player1_id: z.uuid(),
  }),
]);

export type CreateGameInput = z.infer<typeof createGameSchema>;

// --- ゲーム完了（サービス内部から呼ばれる） ---

export const completeGameSchema = z.object({
  game_id: z.uuid(),
  winner_id: z.uuid().nullable(),
  player1_score: z.number().int().nonnegative(),
  player2_score: z.number().int().nonnegative(),
});

export type CompleteGameInput = z.infer<typeof completeGameSchema>;

// ─── HTTPスキーマ（コントローラー層）────────────────────

// GET /api/users/:id/games?limit=20&offset=0
export const matchHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type MatchHistoryQuery = z.infer<typeof matchHistoryQuerySchema>;

// POST /api/games/ai — AI対戦開始リクエスト
export const createAiGameRequestSchema = z.object({
  difficulty: z.enum(aiDifficulties, { error: 'Invalid difficulty' }),
});

export type CreateAiGameRequest = z.infer<typeof createAiGameRequestSchema>;
