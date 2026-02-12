import { z } from 'zod';
import { friendships } from '../db/schema';

// ═══════════════════════════════════════════════════════════
// 型定義 — Drizzle スキーマから導出
// ═══════════════════════════════════════════════════════════

export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;

// ─── HTTPスキーマ（コントローラー層）────────────────────

// POST /api/friendships — フレンドリクエスト送信
export const sendFriendRequestSchema = z.object({
  addressee_id: z.string().uuid({ message: 'Invalid user ID' }),
});

export type SendFriendRequestBody = z.infer<typeof sendFriendRequestSchema>;

// PATCH /api/friendships/:id — リクエストへの応答
export const respondFriendRequestSchema = z.object({
  response: z.enum(['accepted', 'declined'], {
    message: 'Response must be "accepted" or "declined"',
  }),
});

export type RespondFriendRequestBody = z.infer<typeof respondFriendRequestSchema>;
